import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useState } from 'react';
import { useClassroom } from '@/context/ClassroomContext';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CreateClassroomProps {
  onSuccess?: (classroom: any) => void;
  onCancel?: () => void;
}

export default function CreateClassroom({ onSuccess, onCancel }: CreateClassroomProps) {
  const { user } = useAuth();
  const { setCurrentClassroom } = useClassroom();
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createdClassroom, setCreatedClassroom] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  

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

      // Guardar en AsyncStorage
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

      // Mostrar pantalla de éxito
      setCreatedClassroom(classroom);
      setShowSuccess(true);

      setName('');
      setSubject('');
      setDescription('');

    } catch (error) {
      console.error('Unexpected error:', error);
      showAlert('Error', 'Ocurrió un error inesperado. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToClassroom = () => {
    if (createdClassroom) {
      console.log('Classroom created successfully:', createdClassroom);
      router.push(`/(drawer)` as any);
    }
  };

  // Pantalla de éxito
  if (showSuccess && createdClassroom) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successContent}>
          <View style={styles.successIconContainer}>
            <MaterialIcons name="check-circle" size={80} color="#10B981" />
          </View>
          
          <Text style={styles.successTitle}>¡Salón Creado!</Text>
          <Text style={styles.successMessage}>
            Tu salón "{createdClassroom.name}" ha sido creado exitosamente
          </Text>

          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Código de invitación</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{createdClassroom.code}</Text>
            </View>
            <Text style={styles.codeHint}>
              Comparte este código con tus compañeros para que se unan
            </Text>
          </View>

          <View style={styles.successActions}>
            <Pressable 
              style={[styles.button, styles.primaryButton]}
              onPress={handleGoToClassroom}
            >
              <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Ir al Salón</Text>
            </Pressable>

            <Pressable 
              style={[styles.button, styles.secondaryButton]}
              onPress={() => {
                setShowSuccess(false);
                setCreatedClassroom(null);
              }}
            >
              <MaterialIcons name="add" size={20} color="#6366F1" />
              <Text style={styles.secondaryButtonText}>Crear Otro Salón</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

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
  successContainer: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successContent: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  successMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  codeContainer: {
    width: '100%',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    marginBottom: 32,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 12,
    fontWeight: '600',
  },
  codeBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginBottom: 12,
  },
  codeText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#6366F1',
    letterSpacing: 8,
    fontFamily: 'monospace',
  },
  codeHint: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  successActions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '700',
  },
});