// hooks/useCubicle.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { supabase } from "@/lib/supabase";

type PresenceUser = { id: string; name?: string; avatarUrl?: string };

export function useCubicle(cubicleId: string, user: { id: string; name?: string; avatarUrl?: string }) {
  const [membersCount, setMembersCount] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [capacity, setCapacity] = useState<number>(0);
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const appState = useRef(AppState.currentState);
  const channel = useMemo(
    () => supabase.channel(`room:cubicle:${cubicleId}`, {
      config: { presence: { key: user.id } }
    }),
    [cubicleId, user.id]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: cub } = await supabase
        .from("cubicle")
        .select("capacity, active_session_id")
        .eq("id", cubicleId)
        .single();
      if (!mounted) return;
      setCapacity(cub?.capacity ?? 0);
      setSessionId(cub?.active_session_id ?? null);

      if (cub?.active_session_id) {
        const { count } = await supabase
          .from("cubicle_session_member")
          .select("*", { count: "exact", head: true })
          .eq("session_id", cub.active_session_id)
          .is("left_at", null);
        if (!mounted) return;
        setMembersCount(count ?? 0);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [cubicleId]);

  useEffect(() => {
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState() as Record<string, PresenceUser[]>;
        const list = Object.values(state).flat();
        setPresence(list);
      })
      .on("presence", { event: "join" }, () => {
        const state = channel.presenceState() as Record<string, PresenceUser[]>;
        const list = Object.values(state).flat();
        setPresence(list);
      })
      .on("presence", { event: "leave" }, () => {
        const state = channel.presenceState() as Record<string, PresenceUser[]>;
        const list = Object.values(state).flat();
        setPresence(list);
      })
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "cubicle", filter: `id=eq.${cubicleId}` },
        (payload: any) => {
          setSessionId(payload.new.active_session_id ?? null);
          setCapacity(payload.new.capacity);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cubicle_session_member" },
        async (payload: any) => {
          if (payload.new?.session_id === sessionId || payload.old?.session_id === sessionId) {
            const { count } = await supabase
              .from("cubicle_session_member")
              .select("*", { count: "exact", head: true })
              .eq("session_id", sessionId!)
              .is("left_at", null);
            setMembersCount(count ?? 0);
          }
        }
      )
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Track presencia al entrar al canal
          await channel.track({ id: user.id, name: user.name, avatarUrl: user.avatarUrl });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [channel, cubicleId, sessionId, user.id, user.name, user.avatarUrl]);

  // Manejo de background/foreground para presencia
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (next) => {
      if (appState.current.match(/inactive|background/) && next === "active") {
        await channel.track({ id: user.id, name: user.name, avatarUrl: user.avatarUrl });
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [channel, user.id, user.name, user.avatarUrl]);

  // Acciones
  const join = async () => {
    const { data, error } = await supabase.rpc("join_cubicle", { p_cubicle_id: cubicleId });
    if (error) throw error;
    setSessionId(data as string);
  };

  const leave = async () => {
    await supabase.rpc("leave_cubicle", { p_cubicle_id: cubicleId });
    await channel.untrack();
  };

  const broadcast = async (type: string, payload: any) => {
    await channel.send({ type: "broadcast", event: type, payload });
  };

  return {
    capacity,
    membersCount,
    presence,
    sessionId,
    join,
    leave,
    broadcast,
  };
}
