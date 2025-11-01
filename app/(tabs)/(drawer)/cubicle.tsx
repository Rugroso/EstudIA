import { ScrollableTabView } from '@/components/scrollable-tab-view';
import { StyleSheet, Text, View, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useClassroom } from '@/context/ClassroomContext';
import { useAuth } from '@/context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

interface SessionMember {
  user_id: string;
  user_email: string;
  user_name: string | null;
  joined_at: string;
}

export default function CubicleScreen() {
  const { currentClassroom } = useClassroom();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionMembers, setSessionMembers] = useState<SessionMember[]>([]);
  const [cubicleId, setCubicleId] = useState<string | null>(null);

  // Verificar si hay una sesión activa al cargar
  useEffect(() => {
    if (currentClassroom?.id && user?.id) {
      checkActiveSession();
    }
  }, [currentClassroom?.id, user?.id]);

  // realtime
  useEffect(() => {
    if (!activeSessionId) return;

    loadSessionMembers();

    const channel = supabase
      .channel(`cubicle_session:${activeSessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cubicle_session_members',
          filter: `session_id=eq.${activeSessionId}`,
        },
        () => {
          loadSessionMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSessionId]);

  const checkActiveSession = async () => {
    if (!currentClassroom?.id || !user?.id) return;

    try {
      const { data: cubicle, error: cubicleError } = await supabase
        .from('cubicles')
        .select('id')
        .eq('classroom_id', currentClassroom.id)
        .eq('is_active', true)
        .maybeSingle();

      if (cubicleError) {
        console.error('Error fetching cubicle:', cubicleError);
        return;
      }

      if (cubicle) {
        setCubicleId(cubicle.id);

        const { data: session, error: sessionError } = await supabase
          .from('cubicle_sessions')
          .select('id')
          .eq('cubicle_id', cubicle.id)
          .eq('is_active', true)
          .maybeSingle();

        if (sessionError) {
          console.error('Error fetching session:', sessionError);
          return;
        }

        if (session) {
          const { data: membership, error: membershipError } = await supabase
            .from('cubicle_session_members')
            .select('*')
            .eq('session_id', session.id)
            .eq('user_id', user.id)
            .is('left_at', null)
            .maybeSingle();

          if (membershipError) {
            console.error('Error fetching membership:', membershipError);
            return;
          }

          if (membership) {
            setActiveSessionId(session.id);
          }
        }
      }
    } catch (error) {
      console.error('Error checking active session:', error);
    }
  };

  const loadSessionMembers = async () => {
    if (!activeSessionId) return;

    try {
      const { data, error } = await supabase.rpc('get_active_session_members', {
        p_session_id: activeSessionId,
      });

      if (error) {
        console.error('Error loading session members:', error);
        setSessionMembers([]);
        return;
      }
      
      setSessionMembers(data || []);
    } catch (error) {
      console.error('Error loading session members:', error);
      setSessionMembers([]);
    }
  };

  const handleJoinCubicle = async () => {
    if (!currentClassroom?.id) {
      Alert.alert('Error', 'Debes seleccionar un salón primero');
      return;
    }

    setLoading(true);
    try {
      const { data: sessionId, error } = await supabase.rpc('join_cubicle', {
        p_classroom_id: currentClassroom.id,
      });

      if (error) throw error;

      setActiveSessionId(sessionId);
      await loadSessionMembers();

      router.push('/(tabs)/(drawer)/cubicleChat');
    } catch (error: any) {
      console.error('Error joining cubicle:', error);
      Alert.alert('Error', error.message || 'No se pudo unir al cubículo');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveCubicle = async () => {
    if (!activeSessionId) return;

    setLoading(true);
    try {
      const { error } = await supabase.rpc('leave_cubicle', {
        p_session_id: activeSessionId,
      });

      if (error) throw error;

      setActiveSessionId(null);
      setSessionMembers([]);
      Alert.alert('Éxito', 'Has salido del cubículo');
    } catch (error: any) {
      console.error('Error leaving cubicle:', error);
      Alert.alert('Error', error.message || 'No se pudo salir del cubículo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollableTabView contentContainerStyle={styles.container}>
      {currentClassroom ? (
        <View style={styles.content}>
          <View style={styles.header}>
            <MaterialIcons name="group" size={48} color="#FF9500" />
            <Text style={styles.headerTitle}>Cubículo - {currentClassroom.name}</Text>
            <Text style={styles.headerSubtitle}>Estudia con compañeros en tiempo real</Text>
          </View>

          {/* Estado de conexión */}
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Estado:</Text>
              <Text style={[styles.statusValue, activeSessionId ? styles.connected : styles.disconnected]}>
                {activeSessionId ? 'Conectado' : 'Desconectado'}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Capacidad:</Text>
              <Text style={styles.statusValue}>8 estudiantes</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Conectados:</Text>
              <Text style={styles.statusValue}>{sessionMembers.length} estudiantes</Text>
            </View>
          </View>

          {/* Usuarios conectados */}
          <View style={styles.usersCard}>
            <Text style={styles.usersTitle}>👥 Estudiantes conectados</Text>
            <View style={styles.usersList}>
              {sessionMembers.length > 0 ? (
                sessionMembers.map((member) => (
                  <View key={member.user_id} style={styles.userItem}>
                    <View style={styles.userAvatar}>
                      <MaterialIcons name="person" size={24} color="#fff" />
                    </View>
                    <Text style={styles.userName}>
                      {member.user_name || member.user_email || 'Usuario'}
                    </Text>
                    <View style={styles.onlineIndicator} />
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No hay usuarios conectados</Text>
              )}
            </View>
          </View>

          {/* Controles */}
          <View style={styles.controlsCard}>
            <Text style={styles.controlsTitle}>🎮 Controles</Text>
            <View style={styles.buttonsRow}>
              {!activeSessionId ? (
                <Pressable 
                  onPress={handleJoinCubicle} 
                  style={[styles.button, styles.joinButton]}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialIcons name="login" size={20} color="#fff" />
                      <Text style={styles.buttonText}>Entrar al cubículo</Text>
                    </>
                  )}
                </Pressable>
              ) : (
                <>
                  <Pressable 
                    onPress={() => router.push('/(tabs)/(drawer)/cubicleChat')} 
                    style={[styles.button, styles.chatButton]}
                  >
                    <MaterialIcons name="chat" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Ir al chat</Text>
                  </Pressable>
                  <Pressable 
                    onPress={handleLeaveCubicle} 
                    style={[styles.button, styles.leaveButton]}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <MaterialIcons name="logout" size={20} color="#fff" />
                        <Text style={styles.buttonText}>Salir del cubículo</Text>
                      </>
                    )}
                  </Pressable>
                </>
              )}
            </View>
            
            {activeSessionId && (
              <View style={styles.featuresInfo}>
                <Text style={styles.featuresTitle}>✨ Funciones activas:</Text>
                <Text style={styles.featureItem}>✅ Chat en tiempo real</Text>
                <Text style={styles.featureItem}>🚀 Videoconferencia (próximamente)</Text>
                <Text style={styles.featureItem}>🚀 Compartir pantalla (próximamente)</Text>
                <Text style={styles.featureItem}>🚀 Pizarra colaborativa (próximamente)</Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.noClassroom}>
          <MaterialIcons name="group-off" size={64} color="#666" />
          <Text style={styles.noClassroomText}>Selecciona un salón para acceder al cubículo</Text>
        </View>
      )}
      
    </ScrollableTabView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    padding: 20,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.2)',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusLabel: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  statusValue: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  connected: {
    color: '#10B981',
  },
  disconnected: {
    color: '#EF4444',
  },
  usersCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  usersTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  usersList: {
    gap: 12,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userName: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  controlsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  controlsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  buttonsRow: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 16,
    gap: 10,
  },
  joinButton: {
    backgroundColor: '#10B981',
  },
  chatButton: {
    backgroundColor: '#6366F1',
  },
  leaveButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  featuresInfo: {
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  featureItem: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 6,
    lineHeight: 20,
  },
  noClassroom: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  noClassroomText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});
