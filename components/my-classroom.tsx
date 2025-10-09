import { useAuth } from '@/context/AuthContext';
import { useClassroom } from '@/context/ClassroomContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Classroom {
  id: string;
  name: string;
  subject: string;
  description?: string;
  code: string;
  created_by: string;
  created_at: string;
  is_active: boolean;
  role: 'admin' | 'member';
  member_count: number;
  joined_at: string;
}

interface MyClassroomProps {
  onClassroomSelect?: (classroom: Classroom) => void;
}

export default function MyClassroom({ onClassroomSelect }: MyClassroomProps) {
  const { user } = useAuth(); 
  const { setCurrentClassroom } = useClassroom();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Función para mostrar alertas compatibles con web
  const showAlert = (title: string, message: string, buttons?: Array<{text: string, onPress?: () => void, style?: 'default' | 'cancel' | 'destructive'}>) => {
    if (Platform.OS === 'web') {
      const result = window.confirm(`${title}\n\n${message}`);
      if (result && buttons && buttons.length > 1) {
        buttons[1].onPress?.();
      } else if (!result && buttons && buttons.length > 1) {
        buttons[0].onPress?.();
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  const loadUserClassrooms = async () => {
    try {
      if (!user?.id) {
        console.warn('Usuario no autenticado');
        setClassrooms([]);
        return;
      }

      const userId = user.id;

      // Obtener todos los salones donde el usuario es miembro
      const { data: membershipData, error: membershipError } = await supabase
        .from('classroom_members')
        .select(`
          role,
          joined_at,
          classrooms (
            id,
            name,
            subject,
            description,
            code,
            created_by,
            created_at,
            is_active
          )
        `)
        .eq('user_id', userId)
        .eq('classrooms.is_active', true);

      if (membershipError) {
        console.error('Error loading classrooms:', membershipError);
        showAlert('Error', 'No se pudieron cargar los salones. Intenta de nuevo.');
        return;
      }

      if (!membershipData || membershipData.length === 0) {
        setClassrooms([]);
        return;
      }

      // Procesar los datos y agregar información adicional
      const processedClassrooms = await Promise.all(
        membershipData.map(async (membership: any) => {
          const classroom = membership.classrooms;
          
          // Contar miembros del salón
          const { data: membersData, error: membersError } = await supabase
            .from('classroom_members')
            .select('id')
            .eq('classroom_id', classroom.id);

          const memberCount = membersError ? 0 : (membersData?.length || 0);

          return {
            ...classroom,
            role: membership.role,
            member_count: memberCount,
            joined_at: membership.joined_at,
          } as Classroom;
        })
      );

      // Ordenar: primero los que administra, luego por fecha de creación
      const sortedClassrooms = processedClassrooms.sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (b.role === 'admin' && a.role !== 'admin') return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setClassrooms(sortedClassrooms);

    } catch (error) {
      console.error('Unexpected error loading classrooms:', error);
      showAlert('Error', 'Ocurrió un error inesperado al cargar los salones.');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadUserClassrooms();
    setIsRefreshing(false);
  };

  const handleClassroomPress = async (classroom: Classroom) => {
    try {
      // Salon actual
      await AsyncStorage.setItem('currentClassroomId', classroom.id);
      
      // Actualizar el contexto
      setCurrentClassroom({
        id: classroom.id,
        name: classroom.name,
        subject: classroom.subject,
        description: classroom.description,
        code: classroom.code,
        created_by: classroom.created_by,
        is_active: classroom.is_active,
        created_at: classroom.created_at,
      });

      // Navegar usando ruta dinámica
      router.push(`/(tabs)/(drawer)/overview` as any);
      
      if (onClassroomSelect) {
        onClassroomSelect(classroom);
      }
    } catch (error) {
      console.error('Error entering classroom:', error);
      showAlert('Error', 'No se pudo acceder al salón');
    }
  };

  const handleLeaveClassroom = async (classroom: Classroom) => {
    if (classroom.role === 'admin') {
      showAlert('No puedes salir', 'No puedes salir de un salón que administras. Transfiere la administración a otro miembro primero.');
      return;
    }

    showAlert(
      'Confirmar salida',
      `¿Estás seguro de que quieres salir del salón "${classroom.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user?.id) {
                showAlert('Error', 'Usuario no autenticado');
                return;
              }
              
              const userId = user.id;
              
              const { error } = await supabase
                .from('classroom_members')
                .delete()
                .eq('classroom_id', classroom.id)
                .eq('user_id', userId);

              if (error) {
                console.error('Error leaving classroom:', error);
                showAlert('Error', 'No se pudo salir del salón. Intenta de nuevo.');
                return;
              }

              showAlert('Salida exitosa', `Has salido del salón "${classroom.name}".`);
              loadUserClassrooms(); // Recargar la lista
            } catch (error) {
              console.error('Unexpected error leaving classroom:', error);
              showAlert('Error', 'Ocurrió un error inesperado.');
            }
          }
        }
      ]
    );
  };

  const handleShareClassroom = (classroom: Classroom) => {
    showAlert(
      'Compartir Salón',
      `Comparte este código con tus compañeros:\n\n${classroom.code}\n\nEllos pueden usarlo para unirse al salón "${classroom.name}".`,
      [
        {
          text: 'Copiar Código',
          onPress: () => {
            // En una app real, aquí copiarías al clipboard
            console.log('Código copiado:', classroom.code);
          }
        }
      ]
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await loadUserClassrooms();
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando tus salones...</Text>
      </View>
    );
  }

  // Si el usuario no está autenticado
  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>❌ Usuario no autenticado</Text>
        <Pressable 
          style={styles.loginButton}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor="#007AFF"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>📚 Mis Salones</Text>
        <Text style={styles.subtitle}>
          {classrooms.length === 0 
            ? 'No tienes salones aún' 
            : `${classrooms.length} salon${classrooms.length > 1 ? 'es' : ''}`
          }
        </Text>
      </View>

      {classrooms.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏫</Text>
          <Text style={styles.emptyTitle}>No tienes salones</Text>
          <Text style={styles.emptyDescription}>
            Crea un nuevo salón o únete a uno existente para comenzar a estudiar colaborativamente.
          </Text>
          
          <View style={styles.emptyActions}>
            <Pressable 
              style={[styles.button, styles.createButton]}
              onPress={() => router.push('/classroom/create')}
            >
              <Text style={styles.buttonText}>✨ Crear Salón</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.button, styles.joinButton]}
              onPress={() => router.push('/classroom/join')}
            >
              <Text style={styles.buttonText}>🚪 Unirse a Salón</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.classroomsList}>
          {classrooms.map((classroom) => (
            <View key={classroom.id} style={styles.classroomCard}>
              <Pressable
                style={styles.classroomContent}
                onPress={() => handleClassroomPress(classroom)}
              >
                <View style={styles.classroomHeader}>
                  <View style={styles.classroomInfo}>
                    <Text style={styles.classroomName}>{classroom.name}</Text>
                    <Text style={styles.classroomSubject}>{classroom.subject}</Text>
                  </View>
                  
                  <View style={styles.classroomBadge}>
                    <Text style={[
                      styles.roleBadgeText,
                      classroom.role === 'admin' ? styles.adminBadge : styles.memberBadge
                    ]}>
                      {classroom.role === 'admin' ? 'Admin' : 'Miembro'}
                    </Text>
                  </View>
                </View>

                {classroom.description && (
                  <Text style={styles.classroomDescription} numberOfLines={2}>
                    {classroom.description}
                  </Text>
                )}

                <View style={styles.classroomMeta}>
                  <Text style={styles.metaText}>
                    👥 {classroom.member_count} miembro{classroom.member_count !== 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.metaText}>
                    📅 {formatDate(classroom.created_at)}
                  </Text>
                  <Text style={styles.metaText}>
                    🔑 {classroom.code}
                  </Text>
                </View>
              </Pressable>

              <View style={styles.classroomActions}>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => handleShareClassroom(classroom)}
                >
                  <Text style={styles.actionButtonText}>📤 Compartir</Text>
                </Pressable>
                
                {classroom.role !== 'admin' && (
                  <Pressable
                    style={[styles.actionButton, styles.leaveButton]}
                    onPress={() => handleLeaveClassroom(classroom)}
                  >
                    <Text style={styles.leaveButtonText}>🚪 Salir</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  emptyActions: {
    gap: 12,
    width: '100%',
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#007AFF',
  },
  joinButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  classroomsList: {
    padding: 20,
    gap: 16,
  },
  classroomCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  classroomContent: {
    padding: 20,
  },
  classroomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  classroomInfo: {
    flex: 1,
  },
  classroomName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  classroomSubject: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  classroomBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  adminBadge: {
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
    color: '#FF9500',
  },
  memberBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    color: '#34C759',
  },
  classroomDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 16,
  },
  classroomMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metaText: {
    fontSize: 12,
    color: '#888',
  },
  classroomActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  leaveButton: {
    borderRightWidth: 0,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  leaveButtonText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center' as const,
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
});