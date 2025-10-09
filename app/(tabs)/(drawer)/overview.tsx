import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useClassroom } from '@/context/ClassroomContext';
import { ScrollableTabView } from '@/components/scrollable-tab-view';
import { Text, View, StyleSheet, ActivityIndicator, Alert, Pressable } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Button } from '@react-navigation/elements';

interface Classroom {
  id: string;
  name: string;
  subject: string;
  description?: string;
  code: string;
  created_by: string;
  is_active: boolean;
  created_at: string;
}

interface ClassroomMember {
  role: 'admin' | 'member';
  joined_at: string;
}

export default function ClassroomOverview() {
  const { user } = useAuth();
  const { currentClassroom, getSavedClassroomId } = useClassroom();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [memberInfo, setMemberInfo] = useState<ClassroomMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  const initializeClassroom = async () => {
    setLoading(true); 
    try {
      console.log('Current classroom from context:', currentClassroom);

      if (currentClassroom) {
        setClassroom(currentClassroom);
        if (user) {
          await fetchMemberInfo(currentClassroom.id);
        }
      } else if (user) {
        const savedClassroomId = await getSavedClassroomId();
        console.log('Saved classroom ID:', savedClassroomId);
        if (savedClassroomId) {
            await fetchClassroomData(savedClassroomId);
          } else {
            // No hay salón en contexto ni guardado
            setError('Salón no encontrado');
          }
        } else {
          setError('Debes iniciar sesión');
        }
      } catch (e) {
        console.error(e);
        setError('Error inicializando el salón');
      } finally {
        setLoading(false); // <-- ¡siempre apagar!
      }
    };

    initializeClassroom();
  }, [currentClassroom, user]);


  const fetchMemberInfo = async (classroomId: string) => {
    console.log('Fetching member info for classroom ID:', classroomId);
    try {
      const { data: memberData, error } = await supabase
        .from('classroom_members')
        .select('role, joined_at')
        .eq('classroom_id', classroomId)
        .eq('user_id', user?.id)      // <-- filtra por el usuario
        .maybeSingle();               // <-- no revienta si no hay fila

      if (error) {
        console.error(error);
        setError('No tienes acceso a este salón');
        return;
      }
      if (!memberData) {
        setError('No eres miembro de este salón');
        return;
      }

      setMemberInfo({
        role: memberData.role,
        joined_at: memberData.joined_at,
      });
    } catch (err) {
      console.error('Error fetching member info:', err);
      setError('Error al cargar información del miembro');
    }
  };


  const fetchClassroomData = async (classroomId: string) => {
  try {
    setLoading(true);
    setError(null);

    const { data: memberData, error } = await supabase
      .from('classroom_members')
      .select(`
        role,
        joined_at,
        classrooms!inner (
          id,
          name,
          subject,
          description,
          code,
          created_by,
          is_active,
          created_at
        )
      `)
      .eq('classroom_id', classroomId)
      .eq('user_id', user?.id)
      .maybeSingle();                // <-- más seguro que single()

    if (error) {
      console.error(error);
      setError('No tienes acceso a este salón o no existe');
      return;
    }
    if (!memberData) {
      setError('No eres miembro de este salón');
      return;
    }

    
      setMemberInfo({
        role: memberData.role,
        joined_at: memberData.joined_at,
      });
      setClassroom((memberData.classrooms && Array.isArray(memberData.classrooms) ? memberData.classrooms[0] : memberData.classrooms) as Classroom);
    } catch (err) {
      console.error('Error fetching classroom:', err);
      setError('Error al cargar el salón');
    } finally {
      setLoading(false);
    }
  };


  const handleCopyCode = () => {
    if (classroom?.code) {
      // En una app real, copiarías al clipboard
      Alert.alert(
        'Código copiado',
        `El código ${classroom.code} ha sido copiado al portapapeles`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleGoBack = () => {
    router.push('/homepage');
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <ScrollableTabView contentContainerStyle={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando salón...</Text>
      </ScrollableTabView>
    );
  }

  if (error || !classroom) {
    return (
      <ScrollableTabView contentContainerStyle={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>{error || 'Salón no encontrado'}</Text>
        <Pressable 
          style={styles.backButton}
          onPress={() => router.push('/homepage')}
        >
          <Text style={styles.backButtonText}>Volver al inicio</Text>
        </Pressable>
      </ScrollableTabView>
    );
  }

  return (
    <ScrollableTabView contentContainerStyle={styles.container}>
      {/* Header del salón */}
      <View style={styles.header}>
        <Text style={styles.title}>{classroom.name}</Text>
        <Text style={styles.subject}>{classroom.subject}</Text>
        {classroom.description && (
          <Text style={styles.description}>{classroom.description}</Text>
        )}
      </View>

      <Button onPress={handleGoBack}>Volver</Button>

      {/* Información del código */}
      <View style={styles.codeCard}>
        <View style={styles.codeHeader}>
          <Text style={styles.codeLabel}>Código del salón</Text>
          <Pressable style={styles.copyButton} onPress={handleCopyCode}>
            <MaterialIcons name="content-copy" size={20} color="#007AFF" />
          </Pressable>
        </View>
        <Text style={styles.codeText}>{classroom.code}</Text>
        <Text style={styles.codeSubtext}>Comparte este código para invitar estudiantes</Text>
      </View>

      {/* Información de membresía */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>📊 Información del salón</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tu rol:</Text>
          <Text style={[
            styles.infoValue,
            memberInfo?.role === 'admin' ? styles.adminRole : styles.memberRole
          ]}>
            {memberInfo?.role === 'admin' ? 'Administrador' : 'Miembro'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Te uniste:</Text>
          <Text style={styles.infoValue}>
            {memberInfo?.joined_at ? formatDate(memberInfo.joined_at) : 'N/A'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Creado:</Text>
          <Text style={styles.infoValue}>
            {formatDate(classroom.created_at)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Estado:</Text>
          <Text style={[
            styles.infoValue,
            classroom.is_active ? styles.activeStatus : styles.inactiveStatus
          ]}>
            {classroom.is_active ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
      </View>

      {/* Acciones rápidas */}
      <View style={styles.actionsCard}>
        <Text style={styles.actionsTitle}>🚀 Acciones rápidas</Text>
        
        <Pressable 
          style={styles.actionButton}
          onPress={() => router.push('/(tabs)/(drawer)/estudia')}
        >
          <MaterialIcons name="school" size={24} color="#007AFF" />
          <Text style={styles.actionButtonText}>Ir a EstudIA</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#666" />
        </Pressable>

        <Pressable 
          style={styles.actionButton}
          onPress={() => router.push('/(tabs)/(drawer)/cubicle')}
        >
          <MaterialIcons name="library-books" size={24} color="#34C759" />
          <Text style={styles.actionButtonText}>Ver recursos</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#666" />
        </Pressable>

        <Pressable 
          style={styles.actionButton}
          onPress={() => router.push('/(tabs)/(drawer)/cubicle')}
        >
          <MaterialIcons name="group" size={24} color="#FF9500" />
          <Text style={styles.actionButtonText}>Abrir cubículo</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#666" />
        </Pressable>
      </View>
    </ScrollableTabView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subject: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    lineHeight: 24,
  },
  codeCard: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  codeLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    fontWeight: '500',
  },
  copyButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
  },
  codeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    fontFamily: 'monospace',
    marginBottom: 8,
    textAlign: 'center',
  },
  codeSubtext: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.6,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  adminRole: {
    color: '#FF9500',
  },
  memberRole: {
    color: '#34C759',
  },
  activeStatus: {
    color: '#34C759',
  },
  inactiveStatus: {
    color: '#FF3B30',
  },
  actionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    marginLeft: 12,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});