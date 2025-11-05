import { createClient } from '@supabase/supabase-js';
import React, { useMemo, useRef, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { IconSymbol } from './ui/icon-symbol';
import { useTabBarHeight } from '@/hooks/use-tab-bar-height';
import { ThemedText } from './themed-text';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useClassroom } from '@/context/ClassroomContext';


const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const EMBEDDING_URL = process.env.EXPO_PUBLIC_EMBEDDING_URL ?? '';
const CHAT_URL = process.env.EXPO_PUBLIC_CHAT_URL ?? '';

// Interfaces para el nuevo formato de API
interface ProfessorAssistantData {
  response: string;
  chunks_referenced: number;
  chunks: any[];
  classroom_id: string;
  personalized: boolean;
  documents: any[];
  document_ids: string[];
  total_documents: number;
}

interface ProfessorAssistantResponse {
  success: boolean;
  data: {
    content: Array<{
      type: string;
      text: string;
    }>;
    isError: boolean;
    structuredContent: {
      success: boolean;
      data: ProfessorAssistantData;
      message: string;
    };
  };
  source: string;
  timestamp: string;
  metadata: {
    message_length: number;
    classroom_id: string;
    user_id: string;
    session_id: string;
  };
}

export default function SearchScreen() {
  const { user } = useAuth();
  const { currentClassroom } = useClassroom();
  const [text, setText] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { scrollViewInset } = useTabBarHeight();

  const supabase = useMemo(() => createClient(SUPABASE_URL, SUPABASE_ANON), []);

  const handleSearch = async () => {
    const q = text.trim();
    if (!q) return;

    // Validar que tengamos classroom y usuario
    if (!currentClassroom?.id) {
      alert('Por favor selecciona un salón primero');
      return;
    }

    if (!user?.id) {
      alert('Usuario no autenticado');
      return;
    }

    setLoading(true);
    setQuestions((prev) => [...prev, q]);
    setText('');

    console.log('🔍 Enviando pregunta a Professor Assistant:', {
      message: q,
      user_id: user.id,
      classroom_id: currentClassroom.id
    });

    try {
      const response = await fetch('https://u7jss6bicb.execute-api.us-east-2.amazonaws.com/chat-classroom', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          message: q,
          user_id: user.id,
          classroom_id: currentClassroom.id,
        }),
      });

      console.log('� Respuesta status:', response.status);

      if (!response.ok) {
        throw new Error('Error al conectar con el servidor');
      }

      const apiResponse: ProfessorAssistantResponse = await response.json();
      console.log('📄 Respuesta API completa:', apiResponse);

      // Verificar si la respuesta fue exitosa a nivel general
      if (!apiResponse.success) {
        setAnswers((prev) => [...prev, 'Error al obtener respuesta del servidor.']);
        setLoading(false);
        return;
      }

      // Verificar si hay error en los datos
      if (apiResponse.data.isError) {
        setAnswers((prev) => [...prev, 'Ocurrió un error al procesar tu pregunta.']);
        setLoading(false);
        return;
      }

      // Verificar el contenido estructurado
      if (!apiResponse.data.structuredContent?.success) {
        const errorMsg = apiResponse.data.structuredContent?.message || 'Error desconocido';
        setAnswers((prev) => [...prev, `Error: ${errorMsg}`]);
        setLoading(false);
        return;
      }

      // Obtener la respuesta
      const answerText = apiResponse.data.structuredContent.data.response;
      const chunksUsed = apiResponse.data.structuredContent.data.chunks_referenced;
      const totalDocs = apiResponse.data.structuredContent.data.total_documents;

      console.log(`✅ Respuesta obtenida (${chunksUsed} chunks de ${totalDocs} documentos)`);

      setAnswers((prev) => [...prev, answerText]);

    } catch (err: any) {
      console.error('❌ Error completo:', err);
      alert(err?.message ?? 'Fallo la búsqueda');
      setAnswers((prev) => [...prev, 'Ocurrió un error en la búsqueda.']);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <ScrollView>
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
            <View key={`${i}-${q}`} style={styles.chatBubbleContainer}>
              {/* Pregunta del usuario */}
              <View style={styles.userBubble}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <MaterialIcons name="person" size={16} color="#6366F1" style={{ marginRight: 6 }} />
                  <Text style={styles.userLabel}>Tú</Text>
                </View>
                <Text style={styles.userText}>{q}</Text>
              </View>
              
              {/* Respuesta del asistente */}
              {isLoading ? (
                <View style={styles.assistantBubble}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <MaterialIcons name="school" size={16} color="#8B5CF6" style={{ marginRight: 6 }} />
                    <Text style={styles.assistantLabel}>Profesor Asistente</Text>
                  </View>
                  <Text style={styles.loading}>Escribiendo...</Text>
                </View>
              ) : a ? (
                <View style={styles.assistantBubble}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <MaterialIcons name="school" size={16} color="#8B5CF6" style={{ marginRight: 6 }} />
                    <Text style={styles.assistantLabel}>Profesor Asistente</Text>
                  </View>
                  <Text style={styles.assistantText}>{a}</Text>
                </View>
              ) : null}
            </View>
          );
        })}
        <View style={styles.inputBar}>
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder="Pregúntale a tu profesor asistente..."
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
      </ScrollView>


    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    padding: 20,
  },
  title: { 
    color: '#FFFFFF', 
    fontSize: 24, 
    fontWeight: '700', 
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  chatBubbleContainer: {
    marginBottom: 24,
  },
  userBubble: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  userLabel: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  userText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 15,
    lineHeight: 22,
  },
  assistantBubble: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 16,
    padding: 16,
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  assistantLabel: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  assistantText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 15,
    lineHeight: 22,
  },
  loading: { 
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
  },
  qIcon: { 
    color: '#6366F1', 
    fontWeight: '800', 
    marginRight: 8 
  },
  qText: { 
    color: 'rgba(255, 255, 255, 0.9)', 
    fontSize: 16, 
    flexShrink: 1,
    lineHeight: 24,
  },
  aText: { 
    color: 'rgba(255, 255, 255, 0.9)', 
    lineHeight: 24 
  },
  inputBar: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 52,
    maxHeight: 160,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderRadius: 16,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
  },
  sendBtn: {},
  buttonText: { 
    color: '#FFFFFF', 
    fontWeight: '700',
    fontSize: 15,
  },
});
