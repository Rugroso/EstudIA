import { StyleSheet, Text, View, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { useClassroom } from '@/context/ClassroomContext';
import { useAuth } from '@/context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ChatMessage {
  id: string;
  content: string;
  user_id: string;
  user_email: string;
  user_name: string;
  created_at: string;
}

export default function CubicleChat() {
  const { currentClassroom } = useClassroom();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (currentClassroom?.id && user?.id) {
      checkSession();
    }
  }, [currentClassroom?.id, user?.id]);

  useEffect(() => {
    if (!sessionId) return;

    loadMessages(sessionId);

    // Suscribirse a nuevos mensajes en tiempo real
    const channel = supabase
      .channel(`cubicle_chat:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cubicle_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;
          
          // Verificar que el mensaje no esté ya en la lista (evitar duplicados)
          setMessages((prev) => {
            if (prev.some(msg => msg.id === newMsg.id)) {
              return prev;
            }

            // Cargar información del usuario de forma asíncrona
            supabase
              .from('users')
              .select('email, name, last_name')
              .eq('id', newMsg.user_id)
              .single()
              .then(({ data: userData }) => {
                let displayName = 'Usuario';
                if (userData) {
                  if (userData.name && userData.last_name) {
                    displayName = `${userData.name} ${userData.last_name}`;
                  } else if (userData.name) {
                    displayName = userData.name;
                  } else if (userData.email) {
                    displayName = userData.email;
                  }
                }
                
                setMessages((currentMessages) => 
                  currentMessages.map(msg => 
                    msg.id === newMsg.id 
                      ? { 
                          ...msg, 
                          user_name: displayName,
                          user_email: userData?.email || 'Usuario'
                        }
                      : msg
                  )
                );
              });

            // Agregar el mensaje inmediatamente con nombre temporal
            const formattedMsg: ChatMessage = {
              id: newMsg.id,
              content: newMsg.content,
              user_id: newMsg.user_id,
              user_email: 'Cargando...',
              user_name: 'Cargando...',
              created_at: newMsg.created_at,
            };

            scrollToBottom();
            return [...prev, formattedMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const checkSession = async () => {
    if (!currentClassroom?.id || !user?.id) return;

    try {
      setLoading(true);

      const { data: cubicle, error: cubicleError } = await supabase
        .from('cubicles')
        .select('id')
        .eq('classroom_id', currentClassroom.id)
        .eq('is_active', true)
        .maybeSingle();

      if (cubicleError || !cubicle) {
        console.error('Cubicle not found:', cubicleError);
        Alert.alert('Error', 'No hay cubículo activo para este salón');
        router.back();
        return;
      }

      // Buscar sesión activa
      const { data: session, error: sessionError } = await supabase
        .from('cubicle_sessions')
        .select('id')
        .eq('cubicle_id', cubicle.id)
        .eq('is_active', true)
        .maybeSingle();

      if (sessionError || !session) {
        Alert.alert('Error', 'No hay sesión activa');
        router.back();
        return;
      }

      // Verificar que el usuario está en la sesión
      const { data: membership, error: membershipError } = await supabase
        .from('cubicle_session_members')
        .select('*')
        .eq('session_id', session.id)
        .eq('user_id', user.id)
        .is('left_at', null)
        .maybeSingle();

      if (membershipError || !membership) {
        Alert.alert('Error', 'No eres miembro de esta sesión');
        router.back();
        return;
      }

      setSessionId(session.id);
    } catch (error) {
      Alert.alert('Error', 'Error al verificar la sesión');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      // Cargar mensajes básicos
      const { data: messagesData, error: messagesError } = await supabase
        .from('cubicle_messages')
        .select('id, content, user_id, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        throw messagesError;
      }

      if (!messagesData || messagesData.length === 0) {
        console.log('📭 [loadMessages] No hay mensajes');
        setMessages([]);
        return;
      }

      console.log('📄 [loadMessages] Mensajes raw:', messagesData);

      // Cargar información de usuarios
      const userIds = [...new Set(messagesData.map(msg => msg.user_id))];

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, name, last_name')
        .in('id', userIds);

      if (usersError) {
        console.error('❌ [loadMessages] Error cargando usuarios:', usersError);
      }

      console.log('👥 [loadMessages] Usuarios cargados:', usersData);

      const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

      const formattedMessages = messagesData.map((msg: any) => {
        const userData = usersMap.get(msg.user_id);
        
        let displayName = 'Usuario';
        if (userData) {
          if (userData.name && userData.last_name) {
            displayName = `${userData.name} ${userData.last_name}`;
          } else if (userData.name) {
            displayName = userData.name;
          } else if (userData.email) {
            displayName = userData.email;
          }
        }
        
        console.log(`👤 [loadMessages] Mensaje ${msg.id}: userData =`, userData, `→ displayName = "${displayName}"`);
        
        return {
          id: msg.id,
          content: msg.content,
          user_id: msg.user_id,
          user_email: userData?.email || 'Usuario',
          user_name: displayName,
          created_at: msg.created_at,
        };
      });

      setMessages(formattedMessages);
      scrollToBottom();
    } catch (error) {
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !sessionId || !user?.id) return;

    const messageContent = newMessage.trim();
    setSending(true);
    setNewMessage('');

    try {
      // Enviar el mensaje del usuario
      const { error } = await supabase.from('cubicle_messages').insert({
        session_id: sessionId,
        user_id: user.id,
        content: messageContent,
      });

      if (error) throw error;

      // Verificar si el mensaje menciona a @estudia
      if (messageContent.toLowerCase().includes('@estudia')) {
        console.log('🤖 Detectada mención a @estudia, llamando al chat...');
        
        // Llamar al endpoint de chat de EstudIA
        try {
          const response = await fetch(
            'https://u7jss6bicb.execute-api.us-east-2.amazonaws.com/chat-classroom',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: messageContent.replace(/@estudia/gi, '').trim(),
                user_id: user.id,
                classroom_id: currentClassroom?.id,
                session_id: sessionId,
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
          }

          const apiResponse = await response.json();
          console.log('📦 Respuesta de EstudIA:', apiResponse);

          if (!apiResponse.success || !apiResponse.data?.structuredContent) {
            throw new Error('Respuesta sin structuredContent');
          }

          const estudiaResponse = apiResponse.data.structuredContent.data.response;

          // Insertar la respuesta de EstudIA como un mensaje de bot (user_id diferente)
          await supabase.from('cubicle_messages').insert({
            session_id: sessionId,
            user_id: '00000000-0000-0000-0000-000000000000', // UUID especial 
            content: `🤖 EstudIA: ${estudiaResponse}`,
          });

          console.log('✅ Respuesta de EstudIA enviada al chat');
        } catch (apiError) {
          console.error('❌ Error llamando a EstudIA:', apiError);
          // Enviar mensaje de error al chat
          await supabase.from('cubicle_messages').insert({
            session_id: sessionId,
            user_id: '00000000-0000-0000-0000-000000000000', // UUID especial para EstudIA
            content: '🤖 EstudIA: Lo siento, tuve un problema al procesar tu pregunta. Intenta de nuevo.',
          });
        }
      }

      scrollToBottom();
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo enviar el mensaje');
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Cargando chat...</Text>
      </View>
    );
  }

  if (!currentClassroom) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color="#EF4444" />
        <Text style={styles.errorText}>No hay salón seleccionado</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Chat - {currentClassroom.name}</Text>
          <Text style={styles.headerSubtitle}>Cubículo de estudio</Text>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesScrollView}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => scrollToBottom()}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="chat-bubble-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
            <Text style={styles.emptyText}>No hay mensajes aún</Text>
            <Text style={styles.emptySubtext}>Sé el primero en enviar un mensaje</Text>
          </View>
        ) : (
          messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.user_id === user?.id ? styles.myMessage : styles.otherMessage,
              ]}
            >
              {msg.user_id !== user?.id && (
                <Text style={styles.senderName}>
                  {msg.user_name || msg.user_email}
                </Text>
              )}
              <Text style={styles.messageText}>{msg.content}</Text>
              <Text style={styles.messageTime}>{formatTime(msg.created_at)}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#666"
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
        />
        <Pressable
          onPress={sendMessage}
          disabled={!newMessage.trim() || sending}
          style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialIcons name="send" size={24} color="#fff" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#0A0A0F',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#0A0A0F',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 18,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.3)',
  },
  backButton: {
    padding: 10,
    marginRight: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  messagesScrollView: {
    flex: 1,
  },
  messagesContainer: {
    padding: 20,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    minHeight: 400,
  },
  emptyText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptySubtext: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#6366F1',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  senderName: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.2)',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
    opacity: 0.5,
  },
});
