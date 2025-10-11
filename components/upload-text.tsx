import { IconSymbol } from '@/components/ui/icon-symbol';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useClassroom } from '@/context/ClassroomContext';

export default function UploadText() {
  const [content, setContent] = useState('');
  const [out, setOut] = useState('');
  const [loading, setLoading] = useState(false);
  const { selectedClassroom } = useClassroom();

  const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'http://127.0.0.1:8000';
  const EMBEDDING_URL = `${API_BASE}/embedding`;

  const handleSubmit = async () => {
    setLoading(true);
    setOut('');
    try {
      // Validar salón seleccionado
      if (!selectedClassroom?.id) {
        Alert.alert('Selecciona un salón', 'Ve a Mis salones y elige uno antes de subir texto.');
        return;
      }
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        Alert.alert('Sesión requerida', 'Inicia sesión para subir contenido.');
        return;
      }

      const r = await fetch(EMBEDDING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      const embedding: number[] = Array.isArray(data?.embedding) ? data.embedding : [];

      // 1) Guardar también en tabla global de embeddings
      const { error } = await supabase.from('documents').insert({
        content,
        embedding,
      });
      if (error) {
        alert('Error creating embedding: ' + error.message);
      } else {
        alert('Successfully created embedding.');
      }

      // 2) Registrar metadata en classroom_documents para este salón
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      let sizeBytes: number | null = null;
      try {
        // Disponible en RN y Web
        // @ts-ignore
        sizeBytes = new Blob([content]).size ?? null;
      } catch {}
      const syntheticPath = `${userId}/${stamp}-rawtext.txt`;
      const textExcerpt = content.length > 280 ? content.slice(0, 277) + '…' : content;
      const { error: metaErr } = await supabase.from('classroom_documents').insert([
        {
          classroom_id: selectedClassroom.id,
          owner_user_id: userId,
          // bucket default = 'uploads'
          storage_path: syntheticPath,
          original_filename: 'raw-text.txt',
          mime_type: 'text/plain',
          size_bytes: sizeBytes,
          title: 'Texto pegado',
          text_excerpt: textExcerpt,
          status: 'ready',
          embedding_model: 'external',
          embedding_ready: true,
        },
      ]);
      if (metaErr) {
        console.warn('No se pudo registrar en classroom_documents:', metaErr.message);
      }
      setOut(JSON.stringify(data));
    } catch (e: any) {
      setOut(`Error: ${e?.message ?? 'request failed'}`);
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
    gap: 8, 
    paddingTop: 4,
  },
  label: { fontSize: 16, 
    fontWeight: '600', 
    color: '#ccc' 
  },
  textarea: {
    color: '#ccc',
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  sendButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  buttonText: { 
    color: 'white', 
    fontWeight: '700' 
  },
  counter: { alignSelf: 'flex-end', color: '#9ca3af' },
});
