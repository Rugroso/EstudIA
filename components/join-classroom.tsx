import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useClassroom } from '@/context/ClassroomContext';

interface JoinClassroomProps {
  onSuccess?: (classroom: any) => void;
  onCancel?: () => void;
}

export default function JoinClassroom({ onSuccess, onCancel }: JoinClassroomProps) {
  const { user } = useAuth();
  const { setSelectedClassroom } = useClassroom();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [foundClassroom, setFoundClassroom] = useState<any>(null);

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

  const handleSearchClassroom = async () => {
    if (!code.trim()) {
      showAlert('Error', 'Por favor ingresa un código de salón');
      return;
    }

    if (code.length !== 6) {
      showAlert('Error', 'El código debe tener exactamente 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      // Buscar el salón por código
      const { data: classroom, error } = await supabase
        .from('classrooms')
        .select('*, created_by')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !classroom) {
        showAlert('Error', 'No se encontró ningún salón con ese código. Verifica que esté escrito correctamente.');
        return;
      }

      // Obtener información adicional del salón (número de miembros)
      const { data: members, error: membersError } = await supabase
        .from('classroom_members')
        .select('*')
        .eq('classroom_id', classroom.id);

      if (!membersError) {
        classroom.memberCount = members?.length || 0;
      }

      setFoundClassroom(classroom);
      
      showAlert(
        'Salón Encontrado',
        `¿Quieres unirte al salón "${classroom.name}"?\n\nMateria: ${classroom.subject}\nMiembros: ${classroom.memberCount}\n${classroom.description ? `\nDescripción: ${classroom.description}` : ''}`,
        [
          {
            text: 'Cancelar',
            style: 'cancel'
          },
          {
            text: 'Unirme',
            onPress: () => handleJoinClassroom(classroom)
          }
        ]
      );

    } catch (error) {
      console.error('Error searching classroom:', error);
      showAlert('Error', 'Ocurrió un error al buscar el salón. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinClassroom = async (classroom: any) => {
    setIsLoading(true);

    try {
      // Obtener el usuario actual (por ahora usamos un ID temporal)
      const userId = user?.id; // Usuario autenticado
      
      // Verificar si el usuario ya es miembro
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('classroom_members')
        .select('*')
        .eq('classroom_id', classroom.id)
        .eq('user_id', userId)
        .single();

      if (existingMember) {
        showAlert('Ya eres miembro', 'Ya perteneces a este salón.', [
          {
            text: 'Ir al Salón',
            onPress: () => {
              onSuccess?.(classroom);
              setSelectedClassroom(classroom);
              router.push('/(tabs)/(drawer)/estudia');
            }
          }
        ]);
        return;
      }

      // Agregar al usuario como miembro del salón
      const { error: joinError } = await supabase
        .from('classroom_members')
        .insert([
          {
            classroom_id: classroom.id,
            user_id: userId,
            role: 'member',
            joined_at: new Date().toISOString(),
          }
        ]);

      if (joinError) {
        console.error('Error joining classroom:', joinError);
        showAlert('Error', 'No se pudo unir al salón. Intenta de nuevo.');
        return;
      }

      showAlert(
        'Bienvenido',
        `¡Te has unido exitosamente al salón "${classroom.name}"!`,
        [
          {
            text: 'Ir al Salón',
            onPress: () => {
              onSuccess?.(classroom);
              setSelectedClassroom(classroom);
              router.push('/(tabs)/(drawer)/estudia');
            }
          }
        ]
      );

      // Limpiar formulario
      setCode('');
      setFoundClassroom(null);

    } catch (error) {
      console.error('Unexpected error joining classroom:', error);
      showAlert('Error', 'Ocurrió un error inesperado. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚪 Unirse a Salón</Text>
      <Text style={styles.subtitle}>Ingresa el código de invitación para unirte</Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Código del Salón *</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase())}
            placeholder="ABC123"
            placeholderTextColor="#666"
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!isLoading}
          />
          <Text style={styles.helperText}>
            Introduce el código de 6 caracteres que te proporcionó el creador del salón
          </Text>
        </View>

        <View style={styles.buttonGroup}>
          <Pressable 
            style={[styles.button, styles.searchButton, isLoading && styles.buttonDisabled]}
            onPress={handleSearchClassroom}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>🔍 Buscar Salón</Text>
            )}
          </Pressable>

          {onCancel && (
            <Pressable 
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 ¿No tienes un código?</Text>
        <Text style={styles.infoText}>• Pide al creador del salón que comparta el código contigo</Text>
        <Text style={styles.infoText}>• Los códigos son únicos para cada salón</Text>
        <Text style={styles.infoText}>• Si el código no funciona, verifica que esté escrito correctamente</Text>
      </View>

      {foundClassroom && (
        <View style={styles.previewBox}>
          <Text style={styles.previewTitle}>📚 Vista Previa del Salón</Text>
          <Text style={styles.previewName}>{foundClassroom.name}</Text>
          <Text style={styles.previewSubject}>Materia: {foundClassroom.subject}</Text>
          <Text style={styles.previewMembers}>Miembros: {foundClassroom.memberCount || 0}</Text>
          {foundClassroom.description && (
            <Text style={styles.previewDescription}>{foundClassroom.description}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#0a0a0a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
  },
  form: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    fontSize: 18,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    textAlign: 'center',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  helperText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonGroup: {
    gap: 12,
    marginTop: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  searchButton: {
    backgroundColor: '#34C759',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  infoBox: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.2)',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 4,
  },
  previewBox: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  previewName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  previewSubject: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 6,
  },
  previewMembers: {
    fontSize: 14,
    color: '#888',
    marginBottom: 6,
  },
  previewDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginTop: 8,
  },
});