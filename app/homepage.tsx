import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { Redirect, router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Animated, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

    export default function Homepage() {
      const [enterClass, setEnterClass] = useState(false);
      const [unirseSalon, setUnirseSalon] = useState(false);
      const [crearSalon, setCrearSalon] = useState(false);
      const fadeAnim = useRef(new Animated.Value(1)).current;
      const scaleAnim = useRef(new Animated.Value(1)).current;
      
      const { logout, loading } = useAuth();

      const handleEnterClass = () => {
        animateTransition(() => setEnterClass(true));
      };

      const handleUnirseSalon = () => {
        animateTransition(() => setUnirseSalon(true));
      };

      const handleCrearSalon = () => {
        animateTransition(() => setCrearSalon(true));
      };

      const animateTransition = (callback: () => void) => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start(() => {
          callback();
        });
      };

      const handleLogout = async () => {
        Alert.alert(
          "Cerrar sesión",
          "¿Estás seguro que deseas cerrar sesión?",
          [
            {
              text: "Cancelar",
              style: "cancel"
            },
            {
              text: "Cerrar sesión",
              style: "destructive",
              onPress: async () => {
                try {
                  await logout();
                  router.replace("/login");
                } catch (error) {
                  Alert.alert("Error", "No se pudo cerrar sesión");
                }
              }
            }
          ]
        );
      };

      if (enterClass) {
        return <Redirect href="/(tabs)/(drawer)/overview" />;
      }
      if (unirseSalon) {
        return <Redirect href="/classroom/join" />;
      }
      if (crearSalon) {
        return <Redirect href="/classroom/create" />;
      }


      return (
        <Animated.View style={[{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], flex: 1, backgroundColor: '#000' }]}>
          <SafeAreaView style={{ flex: 1 }}>
          <ScrollView style={styles.container}>
            <ThemedView style={styles.content}>
              <ThemedView style={styles.header}>
                <Text style={styles.title}>🎓 EstudIA</Text>
                <Text style={styles.subtitle}>
                  App colaborativa de estudio con IA
                </Text>
                <View style={styles.headerDivider} />
              </ThemedView>

              <ThemedView style={styles.welcomeCard}>
                <ThemedText style={styles.welcomeText}>
                  ¡Bienvenido! Elige cómo quieres comenzar tu sesión de estudio:
                </ThemedText>
              </ThemedView>

              <ThemedView style={styles.cardsContainer}>
                {/* Card para entrar a salón existente */}
                <Pressable 
                  style={({ pressed }) => [
                    styles.card,
                    styles.studyCard,
                    { transform: [{ scale: pressed ? 0.98 : 1 }] }
                  ]}
                  onPress={handleEnterClass}
                >
                  <View style={styles.cardIcon}>
                    <Text style={styles.iconText}>📚</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Ir a Salón</Text>
                    <Text style={styles.cardSubtitle}>Matemáticas Avanzadas</Text>
                    <Text style={styles.cardDescription}>Continúa estudiando en tu salón actual</Text>
                  </View>
                  <View style={styles.cardArrow}>
                    <Text style={styles.arrowText}>→</Text>
                  </View>
                </Pressable>

                {/* Card para unirse a salón */}
                <Pressable 
                  style={({ pressed }) => [
                    styles.card,
                    styles.joinCard,
                    { transform: [{ scale: pressed ? 0.98 : 1 }] }
                  ]}
                  onPress={handleUnirseSalon}
                >
                  <View style={styles.cardIcon}>
                    <Text style={styles.iconText}>🚪</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Unirse a Salón</Text>
                    <Text style={styles.cardSubtitle}>Código de invitación</Text>
                    <Text style={styles.cardDescription}>Únete a un salón existente con código</Text>
                  </View>
                  <View style={styles.cardArrow}>
                    <Text style={styles.arrowText}>→</Text>
                  </View>
                </Pressable>

                {/* Card para crear salón */}
                <Pressable 
                  style={({ pressed }) => [
                    styles.card,
                    styles.createCard,
                    { transform: [{ scale: pressed ? 0.98 : 1 }] }
                  ]}
                  onPress={handleCrearSalon}
                >
                  <View style={styles.cardIcon}>
                    <Text style={styles.iconText}>✨</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Crear Salón</Text>
                    <Text style={styles.cardSubtitle}>Nuevo salón de estudio</Text>
                    <Text style={styles.cardDescription}>Crea tu propio salón colaborativo</Text>
                  </View>
                  <View style={styles.cardArrow}>
                    <Text style={styles.arrowText}>→</Text>
                  </View>
                </Pressable>
              </ThemedView>

              <ThemedView style={styles.footer}>
                <ThemedText style={styles.footerText}>
                  Desarrollado con ❤️ para estudiantes
                </ThemedText>
              </ThemedView>
            </ThemedView>
            
            {/* Botón de Logout mejorado */}
            <View style={styles.logoutContainer}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                disabled={loading}
              >
                <Text style={styles.logoutText}>Cerrar sesión</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          </SafeAreaView>
        </Animated.View>
      );
    }

    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: '#000',
      },
      content: {
        flex: 1,
        padding: 20,
      },
      header: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 60,
      },
      title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#fff',
      },
      subtitle: {
        fontSize: 16,
        opacity: 0.8,
        textAlign: 'center',
        color: '#fff',
      },
      headerDivider: {
        width: 60,
        height: 3,
        backgroundColor: '#007AFF',
        borderRadius: 2,
        marginTop: 15,
      },
      welcomeCard: {
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        padding: 20,
        borderRadius: 16,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(0, 122, 255, 0.2)',
      },
      welcomeText: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        color: '#fff',
      },
      cardsContainer: {
        gap: 16,
      },
      card: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
      studyCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
      },
      joinCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#34C759',
      },
      createCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#FF9500',
      },
      cardIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
      },
      iconText: {
        fontSize: 24,
      },
      cardContent: {
        flex: 1,
      },
      cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
      },
      cardSubtitle: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
        marginBottom: 6,
      },
      cardDescription: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        lineHeight: 20,
      },
      cardArrow: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
      },
      arrowText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
      },
      footer: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 20,
      },
      footerText: {
        fontSize: 14,
        opacity: 0.6,
        textAlign: 'center',
        color: '#fff',
      },
      logoutContainer: {
        padding: 20,
        paddingBottom: 30,
      },
      logoutButton: {
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 59, 48, 0.3)',
        gap: 10,
      },
      logoutIcon: {
        fontSize: 20,
      },
      logoutText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: '600',
      },
    });