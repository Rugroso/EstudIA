import { IconSymbol } from '@/components/ui/icon-symbol';
import { useClassroom } from '@/context/ClassroomContext';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, Alert } from 'react-native';

export default function UploadText() {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [out, setOut] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentClassroom } = useClassroom();

  const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? '';
  const EMBEDDING_URL = `${API_BASE}/embedding`;

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Por favor, ingresa algo de texto');
      return;
    }

    if (!currentClassroom?.id) {
      Alert.alert('Error', 'No hay classroom seleccionado');
      return;
    }

    setLoading(true);

    try {
      // Primero generar el embedding
      const response = await fetch(EMBEDDING_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: content,
        }),
      });

      const data = await response.json();
      
      console.log('MCP Response:', JSON.stringify(data, null, 2));

      // Parsear la respuesta del servidor
      if (data?.success && data?.data?.structuredContent) {
        const result = data.data.structuredContent;

        if (result.success && result.embedding) {
          const embedding = result.embedding;
          const model = result.model;
          const textLength = result.text_length;

          // Obtener el usuario actual
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            Alert.alert('Error', 'Usuario no autenticado');
            return;
          }

          // Guardar en la base de datos
          const { data: documentData, error: dbError } = await supabase
            .from('classroom_documents')
            .insert({
              classroom_id: currentClassroom.id,
              owner_user_id: user.id,
              bucket: 'uploads',
              storage_path: `text/${Date.now()}.txt`, // Path virtual para texto
              original_filename: null,
              mime_type: 'text/plain',
              size_bytes: new TextEncoder().encode(content).length,
              sha256: null,
              title: title.trim() || 'Texto sin título',
              description: `Texto ingresado manualmente. Longitud: ${textLength} caracteres`,
              text_excerpt: content.length > 200 ? content.substring(0, 200) + '...' : content,
              page_count: null,
              image_width: null,
              image_height: null,
              status: 'ready',
              embedding_model: model,
              embedding_ready: true,
              chunk_count: 1
            })
            .select()
            .single();

          if (dbError) {
            console.error('Error saving to database:', dbError);
            Alert.alert('Error', 'Error al guardar en la base de datos: ' + dbError.message);
            return;
          }

          // Ahora guardar el embedding en la tabla de chunks (necesitarás crear esta tabla también)
          // Por ahora solo mostramos el éxito
          Alert.alert(
            'Texto Guardado',
            `✅ Texto guardado exitosamente!\n\n` +
            `📊 Dimensiones del embedding: ${embedding?.length || 'N/A'}\n` +
            `📝 Longitud: ${textLength} caracteres\n` +
            `🤖 Modelo: ${model}\n` +
            `🆔 ID del documento: ${documentData.id}`
          );

          // Limpiar el formulario
          setContent('');
          setTitle('');

        } else {
          Alert.alert('Error', 'No se pudo generar el embedding');
        }
      } else {
        Alert.alert('Error', 'Formato de respuesta inesperado del servidor');
      }

    } catch (error) {
      console.error('Error al procesar texto:', error);
      Alert.alert('Error', 'Error al procesar el texto: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Agrega tu dataset</Text>
      
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Título del documento (opcional)"
        placeholderTextColor="#888"
        style={styles.titleInput}
      />
      
      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder="Escribe aquí..."
        placeholderTextColor="#888"
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        maxLength={100000}
        autoCorrect
        spellCheck
        style={styles.textarea}
      />
      
      <Pressable 
        onPress={handleSubmit} 
        style={styles.sendButton} 
        disabled={loading}
      >
        {loading ? (
          <Text style={styles.buttonText}>Guardando...</Text>
        ) : (
          <IconSymbol name="paperplane.fill" size={20} color="white" />
        )}
      </Pressable>
      
      {!!out && <Text style={{ color: '#ccc', marginTop: 8 }}>{out}</Text>}
      <Text style={styles.counter}>{content.length}/100000</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    gap: 12, 
    paddingTop: 8,
  },
  label: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#FFFFFF',
    marginBottom: 4,
  },
  titleInput: {
    color: '#FFFFFF',
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
  },
  textarea: {
    color: '#FFFFFF',
    minHeight: 140,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
  },
  sendButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  buttonText: { 
    color: '#FFFFFF', 
    fontWeight: '700',
    fontSize: 15,
  },
  counter: { 
    alignSelf: 'flex-end', 
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
  },
});
