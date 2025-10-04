import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface CreateClassroomProps {
  onSuccess?: (classroom: any) => void;
  onCancel?: () => void;
}

export default function CreateClassroom({ onSuccess, onCancel }: CreateClassroomProps) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateClassroomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateClassroom = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre del salón es requerido');
      return;
    }

    if (!subject.trim()) {
      Alert.alert('Error', 'La materia es requerida');
      return;
    }

    setIsLoading(true);

    try {

      const classroomCode = generateClassroomCode();

      // Crear el salón en Supabase
      const { data: classroom, error } = await supabase
        .from('classrooms')
        .insert([
          {
            name: name.trim(),
            subject: subject.trim(),
            description: description.trim(),
            code: classroomCode,
            created_by: '00000000-0000-0000-0000-000000000000', // Temporalmente vacío
            created_at: new Date().toISOString(),
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating classroom:', error);
        Alert.alert('Error', 'No se pudo crear el salón. Intenta de nuevo.');
        return;
      }

      Alert.alert(
        'Salón Creado',
        `¡Tu salón "${name}" ha sido creado exitosamente!\n\nCódigo: ${classroomCode}\n\nComparte este código con tus compañeros para que se unan.`,
        [
          {
            text: 'Copiar Código',
            onPress: () => {
              // En una app real, aquí copiarías al clipboard
              console.log('Código copiado:', classroomCode);
            }
          },
          {
            text: 'Ir al Salón',
            onPress: () => {
              onSuccess?.(classroom);
              router.push('/(tabs)/upload');
            }
          }
        ]
      );

      setName('');
      setSubject('');
      setDescription('');

      // Agregar al creador como miembro del salón
      /*await supabase
        .from('classroom_members')
        .insert([
          {
            classroom_id: classroom.id,
            user_id: user.id,
            role: 'admin',
            joined_at: new Date().toISOString(),
          }
        ]);*/


    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>✨ Crear Nuevo Salón</Text>
      <Text style={styles.subtitle}>Configura tu salón de estudio colaborativo</Text>

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
              <Text style={styles.buttonText}>✨ Crear Salón</Text>
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
        <Text style={styles.infoTitle}>💡 ¿Cómo funciona?</Text>
        <Text style={styles.infoText}>• Se generará un código único de 6 caracteres</Text>
        <Text style={styles.infoText}>• Comparte el código con tus compañeros</Text>
        <Text style={styles.infoText}>• Serás el administrador del salón</Text>
      </View>
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
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  createButton: {
    backgroundColor: '#007AFF',
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
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
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
});