import { IconSymbol } from '@/components/ui/icon-symbol';
import { supabase } from '@/lib/supabase';
import { useClassroom } from '@/context/ClassroomContext';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, Alert } from 'react-native';

export default function UploadText() {
  const [content, setContent] = useState('');
  const [out, setOut] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentClassroom } = useClassroom();

  const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'http://127.0.0.1:8000';
  const EMBEDDING_URL = `${API_BASE}/embedding`;

  const handleSubmit = async () => {
    if (!currentClassroom) {
      Alert.alert('Error', 'Debes seleccionar un salón primero');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Error', 'Debes escribir algo de texto');
      return;
    }

    setLoading(true);
    setOut('');
    try {
      // 1. Generar embedding
      const r = await fetch(EMBEDDING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      const embedding: number[] = Array.isArray(data?.embedding) ? data.embedding : [];

      // 2. Obtener usuario actual
      const { data: userData } = await supabase.auth.getUser();

      // 3. Guardar en documents con referencia al salón
      const { error } = await supabase.from('documents').insert({
        classroom_id: currentClassroom.id,
        user_id: userData?.user?.id,
        content: content.trim(),
        embedding,
        file_type: 'text',
        file_name: `Texto - ${new Date().toLocaleDateString()}`,
        metadata: {
          length: content.length,
          createdAt: new Date().toISOString(),
        },
      });

      if (error) {
        Alert.alert('Error', 'Error creando embedding: ' + error.message);
        setOut('Error: ' + error.message);
      } else {
        Alert.alert('¡Éxito!', 'Embedding creado y guardado correctamente');
        setContent(''); // Limpiar el contenido
        setOut('✅ Embedding generado exitosamente para el salón: ' + currentClassroom.name);
      }
    } catch (e: any) {
      const errorMsg = `Error: ${e?.message ?? 'request failed'}`;
      setOut(errorMsg);
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Agrega tu dataset</Text>
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
          <Text style={styles.buttonText}>...</Text>
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
