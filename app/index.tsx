import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function Index() {
  const { user, loading, logout } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);
  const [checkingInSupabase, setCheckingInSupabase] = useState(true);

  useEffect(() => {
    const checkUserInSupabase = async () => {
      if (!user && !loading) {
        setCheckingInSupabase(false);
        return;
      }
      if (user && !loading) {
        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error || !userData) {
            await logout();
            router.replace("/" as any);
          }
        } catch (error) {
          await logout();
          router.replace("/" as any);
        } finally {
          setCheckingInSupabase(false);
        }
      }
    };

    checkUserInSupabase();
  }, [user, loading]);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', user.id)
            .single();

          if (userData) {
            setIsAdmin(userData.is_admin || false);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          setIsAdmin(false);
        }
      }
      setCheckingRole(false);
    };

    if (user) {
      fetchUserRole();
    } else {
      setCheckingRole(false);
    }
  }, [user]);

  if (loading || checkingRole || checkingInSupabase) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4f0b2e" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (isAdmin != null) {
    return isAdmin 
      ? <Redirect href="/homepage" /> 
      : <Redirect href="/homepage" />;
  }

  return null;
}