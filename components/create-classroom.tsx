import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useState } from 'react';
import { useClassroom } from '@/context/ClassroomContext';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface CreateClassroomProps {
  onSuccess?: (classroom: any) => void;
  onCancel?: () => void;
}

export default function CreateClassroom({ onSuccess, onCancel }: CreateClassroomProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { getSavedClassroomId, currentClassroom } = useClassroom();
  

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

  const generateClassroomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateClassroom = async () => {
    if (!user) {
      showAlert('Error', 'Debes iniciar sesión para crear un salón');
      return;
    }

    if (!name.trim()) {
      showAlert('Error', 'El nombre del salón es requerido');
      return;
    }

    if (!subject.trim()) {
      showAlert('Error', 'La materia es requerida');
      return;
    }

    setIsLoading(true);

    try {

      const classroomCode = generateClassroomCode();

      const { data: classroom, error } = await supabase
        .from('classrooms')
        .insert([
          {
            name: name.trim(),
            subject: subject.trim(),
            description: description.trim(),
            code: classroomCode,
            created_by: user?.id || '', 
            created_at: new Date().toISOString(),
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating classroom:', error);
        showAlert('Error', 'No se pudo crear el salón. Intenta de nuevo.');
        return;
      }

      showAlert(
        'Salón Creado',
        `¡Tu salón "${name}" ha sido creado exitosamente!\n\nCódigo: ${classroomCode}\n\nComparte este código con tus compañeros para que se unan.`,
        [
          {
            text: 'Copiar Código',
            onPress: () => {
              console.log('Código copiado:', classroomCode);
            }
          },
          {
            text: 'Ir al Salón',
            onPress: async () => {
              onSuccess?.(classroom);
              const savedClassroomId = await getSavedClassroomId();
              router.push('/classroom/myClassroom' as any);
            }
          }
        ]
      );

      setName('');
      setSubject('');
      setDescription('');

      // Agregar al creador como miembro del salón
      await supabase
        .from('classroom_members')
        .insert([
          {
            classroom_id: classroom.id,
            user_id: user.id,
            role: 'admin',
            joined_at: new Date().toISOString(),
          }
        ]);


    } catch (error) {
      console.error('Unexpected error:', error);
      showAlert('Error', 'Ocurrió un error inesperado. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
      <MaterialIcons name="create-new-folder" size={48} color="#FFF" />  
      <Text style={styles.title}>Crear Nuevo Salón</Text>
      <Text style={styles.subtitle}>Configura tu salón de estudio colaborativo</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre del Salón *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="ej: Matemáticas Avanzadas"
            placeholderTextColor="#666"
            maxLength={50}
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Materia *</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="ej: Cálculo, Física, Historia..."
            placeholderTextColor="#666"
            maxLength={30}
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descripción (Opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe el objetivo del salón..."
            placeholderTextColor="#666"
            multiline
            numberOfLines={3}
            maxLength={200}
            editable={!isLoading}
          />
        </View>

        <View style={styles.buttonGroup}>
          <Pressable 
            style={[styles.button, styles.createButton, isLoading && styles.buttonDisabled]}
            onPress={handleCreateClassroom}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Crear Salón</Text>
            )}
          </Pressable>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 ¿Cómo funciona?</Text>
        <Text style={styles.infoText}>• Se generará un código único de 6 caracteres</Text>
        <Text style={styles.infoText}>• Comparte el código con tus compañeros</Text>
        <Text style={styles.infoText}>• Serás el administrador del salón</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 10,
    fontWeight: '700',
  },
  input: {
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonGroup: {
    gap: 12,
    marginTop: 24,
  },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.2)',
  },
  createButton: {
    backgroundColor: '#6366F1',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 6,
    lineHeight: 22,
  },
});