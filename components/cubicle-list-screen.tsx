// screens/CubicleListScreen.tsx
import { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";

export default function CubicleListScreen() {
  const [cubicles, setCubicles] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("cubicle")
        .select("id, name, capacity, active_session_id, updated_at")
        .order("updated_at", { ascending: false });
      setCubicles(data ?? []);
    })();
  }, []);

  return (
    <FlatList
      data={cubicles}
      keyExtractor={(c) => c.id}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push((`/(tabs)/(drawer)/cubicleChat/${item.id}`) as any)}
          style={{ padding: 16, borderBottomWidth: 1, borderColor: "#333" }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600" }}>{item.name}</Text>
          <Text>Capacidad: {item.capacity}</Text>
          <Text>Sesión activa: {item.active_session_id ? "Sí" : "No"}</Text>
        </Pressable>
      )}
    />
  );
}
