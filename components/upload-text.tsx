import { IconSymbol } from '@/components/ui/icon-symbol';
import { createClient } from '@supabase/supabase-js';
import { useClassroom } from '@/context/ClassroomContext';
import { supabase as supabaseSess } from '@/lib/supabase';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function UploadText() {
  const [content, setContent] = useState('');
  const [out, setOut] = useState('');
  const [loading, setLoading] = useState(false);
  const { selectedClassroom } = useClassroom();

  const supabase = useMemo(() => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
    if (!url) throw new Error('Falta EXPO_PUBLIC_SUPABASE_URL');
    if (!anon) throw new Error('Falta EXPO_PUBLIC_SUPABASE_ANON_KEY');
    return createClient(url, anon);
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setOut('');
    try {
      if (!selectedClassroom?.id) {
        alert('Primero selecciona un salón en Mis salones.');
        setLoading(false);
        return;
      }
      const { data: user } = await supabaseSess.auth.getUser();
      if (!user?.user?.id) {
        alert('Debes iniciar sesión.');
        setLoading(false);
        return;
      }

      // Inserta un documento inline en classroom_documents; el procesador creará chunks/embeddings
      const { data: doc, error: docErr } = await supabaseSess
        .from('classroom_documents')
        .insert([
          {
            classroom_id: selectedClassroom.id,
            owner_user_id: user.user.id,
            bucket: 'inline',
            storage_path: null,
            original_filename: null,
            mime_type: 'text/plain',
            size_bytes: content.length,
            text_excerpt: content,
            status: 'uploaded',
          }
        ])
        .select('*')
        .single();
      if (docErr) throw docErr;

      // Disparar el procesamiento vía Supabase Edge Functions (requiere función desplegada)
      if (doc?.id) {
        try {
          await supabaseSess.functions.invoke('process-classroom-document', {
            body: { document_id: doc.id },
          });
        } catch {}
      }

  alert('Texto enviado. Se procesará para embeddings.');
  setOut(doc ? `Documento ${doc.id} creado y procesándose...` : 'Documento creado.');
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
