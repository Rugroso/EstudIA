import { createClient } from '@supabase/supabase-js';
import React, { useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { IconSymbol } from './ui/icon-symbol';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const EMBEDDING_URL = process.env.EXPO_PUBLIC_EMBEDDING_URL ?? 'http://127.0.0.1:8000/embedding';
const CHAT_URL = process.env.EXPO_PUBLIC_CHAT_URL ?? 'http://127.0.0.1:8000/chat';

// ============ UI ============
export default function SearchScreen() {
  const [text, setText] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const supabase = useMemo(() => createClient(SUPABASE_URL, SUPABASE_ANON), []);

  const toastError = (message = 'Something went wrong') => {
    // simple alert para web; si usas algún toast, reemplaza aquí
    alert(message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // en Expo Web no hay router de Next; puedes limpiar estado o redirigir con location:
    if (Platform.OS === 'web') location.reload();
  };

  const handleSearch = async () => {
    const q = text.trim();
    if (!q) return;
    setLoading(true);
    setQuestions((prev) => [...prev, q]);
    setText('');

    try {
      const er = await fetch(EMBEDDING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: q.replace(/\n/g, ' ') }),
      });

      if (!er.ok) {
        toastError(`Embedding HTTP ${er.status}`);
        setAnswers((prev) => [...prev, 'Error creando embedding.']);
        setLoading(false);
        return;
      }

      const ejson = await er.json();
      const embedding: number[] = ejson.embedding ?? ejson?.data?.[0]?.embedding;

      if (!embedding || !Array.isArray(embedding)) {
        toastError('Respuesta de embedding inválida');
        setAnswers((prev) => [...prev, 'Respuesta de embedding inválida.']);
        setLoading(false);
        return;
      }

      // 2) buscar documentos similares mediante RPC en Supabase
      // Asegúrate que la RPC "match_documents" existe y su firma coincide
      const { data: documents, error: rpcError } = await supabase.rpc('match_documents', {
        query_embedding: embedding,
        match_threshold: 0.3,
        match_count: 10,
      });

      if (rpcError) {
        toastError('RPC match_documents falló: ' + rpcError.message);
        setAnswers((prev) => [...prev, 'No pude buscar contexto en la base.']);
        setLoading(false);
        return;
      }

      let tokenCount = 0;
      let contextText = '';
      for (let i = 0; i < (documents?.length ?? 0); i++) {
        const d = documents[i];
        const content = d?.content ?? '';
        const tokens = d?.token ?? Math.ceil(content.length / 4);
        if (tokenCount + tokens > 1500) break;
        tokenCount += tokens;
        contextText += `${String(content).trim()}\n--\n`;
      }

      if (!contextText) {
        setAnswers((prev) => [...prev, 'No encontré contexto relacionado. Intenta otra pregunta.']);
        setLoading(false);
        return;
      }

      const prompt = generatePrompt(contextText, q);

      const cr = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!cr.ok) {
        toastError(`Chat HTTP ${cr.status}`);
        setAnswers((prev) => [...prev, 'Error generando respuesta.']);
        setLoading(false);
        return;
      }

      const cjson = await cr.json();
      // acepta varias formas: { answer } o { choices: [{ text }] } o { content }
      const answer =
        cjson.answer ??
        cjson?.choices?.[0]?.text ??
        cjson?.content ??
        'No tuve respuesta del modelo.';

      setAnswers((prev) => [...prev, String(answer)]);
    } catch (err: any) {
      alert(err?.message ?? 'Fallo la búsqueda');
      setAnswers((prev) => [...prev, 'Ocurrió un error en la búsqueda.']);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {/* Lista Q/A */}
      <View>
        <Text style={styles.title}>
          Bienvenido a EstudIA
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 12 }}>
        {questions.map((q, i) => {
          const a = answers[i];
          const isLoading = loading && !a;
          return (
            <View key={`${i}-${q}`} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Text style={[styles.qIcon]}>Q:</Text>
                <Text style={styles.qText}>{q}</Text>
              </View>
              {isLoading ? (
                <Text style={styles.loading}>Loading...</Text>
              ) : (
                <Text style={styles.aText}>{a}</Text>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder="Ask estudIA a question"
          placeholderTextColor="#999"
          onSubmitEditing={handleSearch}
          style={styles.input}
          multiline
        />
        <Pressable onPress={handleSearch} style={[styles.button, styles.sendBtn]} disabled={loading}>
          {loading ? (
            <Text style={styles.buttonText}>...</Text>
          ) : (
            <IconSymbol name="paperplane.fill" size={20} color="white" />
          )}
        </Pressable>
      </View>
    </View>
  );
}

function generatePrompt(contextText: string, searchText: string) {
  return (
    `You are a very enthusiastic estudIA representative who loves to help people! ` +
    `Given the following sections from the estudIA documentation, answer the question ` +
    `using only that information, outputted in markdown format. If you are unsure and ` +
    `the answer is not explicitly written in the documentation, say "Sorry, I don't know how to help with that."\n\n` +
    `Context sections:\n${contextText}\n\n` +
    `Question: """\n${searchText}\n"""\n\n` +
    `Answer as markdown (including related code snippets if available):\n`
  );
}

const styles = StyleSheet.create({
  title: { color: 'black', fontSize: 20, fontWeight: '700', marginBottom: 12 },
  qIcon: { color: '#818cf8', fontWeight: '800', marginRight: 6 },
  qText: { color: '#c7d2fe', fontSize: 16, flexShrink: 1 },
  loading: { color: '#9ca3af' },
  aText: { color: '#e5e7eb', lineHeight: 20 },
  inputBar: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 160,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 12,
    color: 'black', 
  },
  button: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  sendBtn: {},
  buttonText: { color: 'white', fontWeight: '700' },
});
