"use client"
import { useAuth } from "@/context/AuthContext"
import { useClassroom } from "@/context/ClassroomContext"
import { Redirect, router } from "expo-router"
import { useRef, useState } from "react"
import { Alert, Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"

export default function Homepage() {
  const [enterClass, setEnterClass] = useState(false)
  const [unirseSalon, setUnirseSalon] = useState(false)
  const [crearSalon, setCrearSalon] = useState(false)
  const [verSalon, setVerSalon] = useState(false)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current

  const { logout, loading } = useAuth()
  const { getSavedClassroomId, currentClassroom } = useClassroom()

  useState(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start()
  })

  const handleEnterClass = async () => {
    try {
      const savedClassroomId = await getSavedClassroomId()

      if (savedClassroomId) {
        router.push(`/(tabs)/(drawer)/overview` as any)
      } else {
        setVerSalon(true)
      }
    } catch (error) {
      console.error("Error loading saved classroom:", error)
      setVerSalon(true)
    }
  }

  const handleUnirseSalon = () => {
    setUnirseSalon(true)
  }

  const handleCrearSalon = () => {
    setCrearSalon(true)
  }

  const handleVerSalon = () => {
    setVerSalon(true)
  }

  const handleLogout = async () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro que deseas cerrar sesión?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async () => {
          try {
            await logout()
            router.replace("/login")
          } catch (error) {
            Alert.alert("Error", "No se pudo cerrar sesión")
          }
        },
      },
    ])
  }

  if (enterClass) {
    return <Redirect href="/(tabs)/(drawer)/overview" />
  }
  if (unirseSalon) {
    return <Redirect href="/classroom/join" />
  }
  if (crearSalon) {
    return <Redirect href="/classroom/create" />
  }
  if (verSalon) {
    return <Redirect href="/classroom/myClassroom" />
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <View style={styles.logoIcon}>
                  <Text style={styles.logoEmoji}>🎓</Text>
                  <View style={styles.aiIndicator}>
                    <Text style={styles.aiText}>AI</Text>
                  </View>
                </View>
                <View>
                  <Text style={styles.title}>EstudIA</Text>
                  <Text style={styles.subtitle}>Aprende más inteligente</Text>
                </View>
              </View>
              
              <Pressable
                style={({ pressed }) => [styles.logoutButton, { opacity: pressed ? 0.7 : 1 }]}
                onPress={handleLogout}
                disabled={loading}
              >
                <Text style={styles.logoutText}>Cerrar sesión</Text>
              </Pressable>
            </View>

            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>¡Hola de nuevo! 👋</Text>
              <Text style={styles.welcomeDescription}>Continúa tu viaje de aprendizaje o explora nuevos salones</Text>
            </View>

            <View style={styles.cardsContainer}>
              {/* Card principal destacada */}
              {currentClassroom && (
                <Pressable
                  style={({ pressed }) => [styles.featuredCard, { opacity: pressed ? 0.9 : 1 }]}
                  onPress={handleEnterClass}
                >
                  <LinearGradient
                    colors={["#6366F1", "#8B5CF6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.featuredGradient}
                  >
                    <View style={styles.featuredContent}>
                      <View style={styles.featuredHeader}>
                        <View style={styles.featuredIconContainer}>
                          <Text style={styles.featuredIcon}>📚</Text>
                        </View>
                        <View style={styles.featuredBadge}>
                          <Text style={styles.featuredBadgeText}>Continuar</Text>
                        </View>
                      </View>
                      <Text style={styles.featuredTitle}>{currentClassroom.name}</Text>
                      <Text style={styles.featuredSubject}>{currentClassroom.subject}</Text>
                      <View style={styles.featuredFooter}>
                        <Text style={styles.featuredAction}>Ir al salón →</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </Pressable>
              )}

              {/* Grid de acciones rápidas */}
              <View style={styles.actionsGrid}>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionCard,
                    styles.actionCardPrimary,
                    { transform: [{ scale: pressed ? 0.97 : 1 }] },
                  ]}
                  onPress={handleVerSalon}
                >
                  <View style={styles.actionIconContainer}>
                    <Text style={styles.actionIcon}>📖</Text>
                  </View>
                  <Text style={styles.actionTitle}>Mis Salones</Text>
                  <Text style={styles.actionDescription}>Ver todos</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.actionCard,
                    styles.actionCardSecondary,
                    { transform: [{ scale: pressed ? 0.97 : 1 }] },
                  ]}
                  onPress={handleCrearSalon}
                >
                  <View style={styles.actionIconContainer}>
                    <Text style={styles.actionIcon}>✨</Text>
                  </View>
                  <Text style={styles.actionTitle}>Crear</Text>
                  <Text style={styles.actionDescription}>Nuevo salón</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.actionCard,
                    styles.actionCardTertiary,
                    { transform: [{ scale: pressed ? 0.97 : 1 }] },
                  ]}
                  onPress={handleUnirseSalon}
                >
                  <View style={styles.actionIconContainer}>
                    <Text style={styles.actionIcon}>🚪</Text>
                  </View>
                  <Text style={styles.actionTitle}>Unirse</Text>
                  <Text style={styles.actionDescription}>Con código</Text>
                </Pressable>

                {!currentClassroom && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionCard,
                      styles.actionCardQuaternary,
                      { transform: [{ scale: pressed ? 0.97 : 1 }] },
                    ]}
                    onPress={handleEnterClass}
                  >
                    <View style={styles.actionIconContainer}>
                      <Text style={styles.actionIcon}>🎯</Text>
                    </View>
                    <Text style={styles.actionTitle}>Explorar</Text>
                    <Text style={styles.actionDescription}>Descubrir</Text>
                  </Pressable>
                )}
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Potenciado por IA • Hecho con ❤️</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0F",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  logoIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  logoEmoji: {
    fontSize: 28,
  },
  aiIndicator: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#6366F1",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: "#0A0A0F",
  },
  aiText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 2,
  },
  welcomeSection: {
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  welcomeDescription: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    lineHeight: 24,
  },
  cardsContainer: {
    gap: 20,
    marginBottom: 40,
  },
  featuredCard: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#6366F1",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  featuredGradient: {
    padding: 24,
  },
  featuredContent: {
    gap: 12,
  },
  featuredHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  featuredIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  featuredIcon: {
    fontSize: 24,
  },
  featuredBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  featuredBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  featuredTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 8,
  },
  featuredSubject: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  featuredFooter: {
    marginTop: 8,
  },
  featuredAction: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: "47%",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  actionCardPrimary: {
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  actionCardSecondary: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  actionCardTertiary: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderColor: "rgba(59, 130, 246, 0.3)",
  },
  actionCardQuaternary: {
    backgroundColor: "rgba(236, 72, 153, 0.1)",
    borderColor: "rgba(236, 72, 153, 0.3)",
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionIcon: {
    fontSize: 20,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  actionDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
  },
  footer: {
    alignItems: "center",
    gap: 20,
    paddingBottom: 40,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  logoutIcon: {
    fontSize: 16,
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "700",
  },
  footerText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.4)",
    textAlign: "center",
  },
})
