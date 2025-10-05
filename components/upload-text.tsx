import { IconSymbol } from '@/components/ui/icon-symbol';
import { createClient } from '@supabase/supabase-js';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function UploadText() {
  const [content, setContent] = useState('');
  const [out, setOut] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = useMemo(() => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
    if (!url) throw new Error('Falta EXPO_PUBLIC_SUPABASE_URL');
    if (!anon) throw new Error('Falta EXPO_PUBLIC_SUPABASE_ANON_KEY');
    return createClient(url, anon);
  }, []);

  const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'http://127.0.0.1:8000';
  const EMBEDDING_URL = `${API_BASE}/embedding`;

  const handleSubmit = async () => {
    setLoading(true);
    setOut('');
    try {
      const r = await fetch(EMBEDDING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      const embedding: number[] = Array.isArray(data?.embedding) ? data.embedding : [];

      const { error } = await supabase.from('documents').insert({
        content,
        embedding,
      });
      if (error) {
        alert('Error creating embedding: ' + error.message);
      } else {
        alert('Successfully created embedding.');
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
