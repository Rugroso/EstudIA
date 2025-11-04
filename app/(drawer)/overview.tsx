"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { useClassroom } from "@/context/ClassroomContext"
import { ScrollableTabView } from "@/components/scrollable-tab-view"
import { Text, View, StyleSheet, ActivityIndicator, Alert, Pressable } from "react-native"
import { router } from "expo-router"
import { MaterialIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"

interface Classroom {
  id: string
  name: string
  subject: string
  description?: string
  code: string
  created_by: string
  is_active: boolean
  created_at: string
}

interface ClassroomMember {
  role: "admin" | "member"
  joined_at: string
}

export default function ClassroomOverview() {
  const { user } = useAuth()
  const { currentClassroom, getSavedClassroomId } = useClassroom()
  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [memberInfo, setMemberInfo] = useState<ClassroomMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeClassroom = async () => {
      setLoading(true)
      try {
        console.log("Current classroom from context:", currentClassroom)

        if (currentClassroom) {
          setClassroom(currentClassroom)
          if (user) {
            await fetchMemberInfo(currentClassroom.id)
          }
        } else if (user) {
          const savedClassroomId = await getSavedClassroomId()
          console.log("Saved classroom ID:", savedClassroomId)
          if (savedClassroomId) {
            await fetchClassroomData(savedClassroomId)
          } else {
            setError("Salón no encontrado")
          }
        } else {
          setError("Debes iniciar sesión")
        }
      } catch (e) {
        console.error(e)
        setError("Error inicializando el salón")
      } finally {
        setLoading(false)
      }
    }

    initializeClassroom()
  }, [currentClassroom, user])

  const fetchMemberInfo = async (classroomId: string) => {
    console.log("Fetching member info for classroom ID:", classroomId)
    try {
      const { data: memberData, error } = await supabase
        .from("classroom_members")
        .select("role, joined_at")
        .eq("classroom_id", classroomId)
        .eq("user_id", user?.id)
        .maybeSingle()

      if (error) {
        console.error(error)
        setError("No tienes acceso a este salón")
        return
      }
      if (!memberData) {
        setError("No eres miembro de este salón")
        return
      }

      setMemberInfo({
        role: memberData.role,
        joined_at: memberData.joined_at,
      })
    } catch (err) {
      console.error("Error fetching member info:", err)
      setError("Error al cargar información del miembro")
    }
  }

  const fetchClassroomData = async (classroomId: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data: memberData, error } = await supabase
        .from("classroom_members")
        .select(`
        role,
        joined_at,
        classrooms!inner (
          id,
          name,
          subject,
          description,
          code,
          created_by,
          is_active,
          created_at
        )
      `)
        .eq("classroom_id", classroomId)
        .eq("user_id", user?.id)
        .maybeSingle()

      if (error) {
        console.error(error)
        setError("No tienes acceso a este salón o no existe")
        return
      }
      if (!memberData) {
        setError("No eres miembro de este salón")
        return
      }

      setMemberInfo({
        role: memberData.role,
        joined_at: memberData.joined_at,
      })
      setClassroom(
        (memberData.classrooms && Array.isArray(memberData.classrooms)
          ? memberData.classrooms[0]
          : memberData.classrooms) as Classroom,
      )
    } catch (err) {
      console.error("Error fetching classroom:", err)
      setError("Error al cargar el salón")
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = () => {
    if (classroom?.code) {
      Alert.alert("Código copiado", `El código ${classroom.code} ha sido copiado al portapapeles`, [{ text: "OK" }])
    }
  }

  const handleGoBack = () => {
    router.replace("/homepage")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <ScrollableTabView contentContainerStyle={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Cargando salón...</Text>
        </View>
      </ScrollableTabView>
    )
  }

  if (error || !classroom) {
    return (
      <ScrollableTabView contentContainerStyle={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Pressable style={styles.errorButtonTop} onPress={() => router.push("/homepage")}>
            <MaterialIcons name="arrow-back" size={20} color="#FFFFFF" />
            <Text style={styles.errorButtonTopText}>Volver</Text>
          </Pressable>
          
          <View style={styles.errorIconContainer}>
            <MaterialIcons name="error-outline" size={64} color="#EF4444" />
          </View>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>{error || "Salón no encontrado"}</Text>
        </View>
      </ScrollableTabView>
    )
  }

  return (
    <ScrollableTabView contentContainerStyle={styles.container}>
      {/* Hero Header con gradiente */}
      <LinearGradient
        colors={["#6366F1", "#8B5CF6", "#A855F7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroHeader}
      >
        <View style={styles.heroContent}>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, classroom.is_active && styles.statusDotActive]} />
            <Text style={styles.statusText}>{classroom.is_active ? "Activo" : "Inactivo"}</Text>
          </View>
          <Text style={styles.heroTitle}>{classroom.name}</Text>
          <View style={styles.subjectBadge}>
            <MaterialIcons name="school" size={16} color="#FFFFFF" />
            <Text style={styles.subjectText}>{classroom.subject}</Text>
          </View>
          {classroom.description && <Text style={styles.heroDescription}>{classroom.description}</Text>}
        </View>
      </LinearGradient>

      {/* Código del salón - Destacado */}
      <View style={styles.codeSection}>
        <LinearGradient
          colors={["rgba(99, 102, 241, 0.15)", "rgba(139, 92, 246, 0.15)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.codeCard}
        >
          <View style={styles.codeHeader}>
            <View style={styles.codeHeaderLeft}>
              <MaterialIcons name="vpn-key" size={20} color="#6366F1" />
              <Text style={styles.codeLabel}>Código de invitación</Text>
            </View>
            <Pressable style={styles.copyButton} onPress={handleCopyCode}>
              <MaterialIcons name="content-copy" size={18} color="#6366F1" />
              <Text style={styles.copyButtonText}>Copiar</Text>
            </Pressable>
          </View>
          <Text style={styles.codeText}>{classroom.code}</Text>
          <Text style={styles.codeHint}>Comparte este código para invitar estudiantes</Text>
        </LinearGradient>
      </View>

      {/* Tu información */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="person" size={22} color="#6366F1" />
          <Text style={styles.sectionTitle}>Tu información</Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <View style={styles.infoIconContainer}>
              <MaterialIcons
                name={memberInfo?.role === "admin" ? "admin-panel-settings" : "person"}
                size={24}
                color={memberInfo?.role === "admin" ? "#F59E0B" : "#10B981"}
              />
            </View>
            <Text style={styles.infoCardLabel}>Rol</Text>
            <Text style={[styles.infoCardValue, memberInfo?.role === "admin" ? styles.adminText : styles.memberText]}>
              {memberInfo?.role === "admin" ? "Administrador" : "Miembro"}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIconContainer}>
              <MaterialIcons name="event" size={24} color="#6366F1" />
            </View>
            <Text style={styles.infoCardLabel}>Te uniste</Text>
            <Text style={styles.infoCardValue}>
              {memberInfo?.joined_at ? formatDate(memberInfo.joined_at).split(" de ")[0] : "N/A"}
            </Text>
          </View>
        </View>
      </View>

      {/* Acciones rápidas */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="bolt" size={22} color="#6366F1" />
          <Text style={styles.sectionTitle}>Acciones rápidas</Text>
        </View>

        <View style={styles.actionsGrid}>
          <Pressable
            style={[styles.actionCard, styles.actionCardPrimary]}
            onPress={() => router.push("/(drawer)/estudia")}
          >
            <LinearGradient
              colors={["#6366F1", "#8B5CF6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionGradient}
            >
              <MaterialIcons name="psychology" size={32} color="#FFFFFF" />
              <Text style={styles.actionCardTitle}>EstudIA</Text>
              <Text style={styles.actionCardDescription}>Estudia con IA</Text>
            </LinearGradient>
          </Pressable>

          <Pressable style={styles.actionCard} onPress={() => router.push("/(drawer)/resources")}>
            <View style={[styles.actionCardContent, styles.actionCardSecondary]}>
              <MaterialIcons name="library-books" size={28} color="#10B981" />
              <Text style={[styles.actionCardTitle, styles.actionCardTitleDark]}>Recursos</Text>
              <Text style={[styles.actionCardDescription, styles.actionCardDescriptionDark]}>Ver materiales</Text>
            </View>
          </Pressable>

          <Pressable style={styles.actionCard} onPress={() => router.push("/(drawer)/cubicle")}>
            <View style={[styles.actionCardContent, styles.actionCardTertiary]}>
              <MaterialIcons name="groups" size={28} color="#F59E0B" />
              <Text style={[styles.actionCardTitle, styles.actionCardTitleDark]}>Cubículo</Text>
              <Text style={[styles.actionCardDescription, styles.actionCardDescriptionDark]}>Colabora</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Botón de volver */}
      <Pressable style={styles.backButton} onPress={handleGoBack}>
        <MaterialIcons name="arrow-back" size={20} color="rgba(255, 255, 255, 0.7)" />
        <Text style={styles.backButtonText}>Volver a inicio</Text>
      </Pressable>
    </ScrollableTabView>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    backgroundColor: "#0A0A0F",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A0A0F",
  },
  loadingContent: {
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A0A0F",
    padding: 20,
  },
  errorContent: {
    alignItems: "center",
    gap: 16,
    maxWidth: 320,
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  errorText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  errorButtonTop: {
    position: "absolute",
    top: 20,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  errorButtonTopText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  errorButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#6366F1",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    marginTop: 8,
  },
  errorButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  heroHeader: {
    padding: 24,
    paddingTop: 32,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroContent: {
    gap: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  statusDotActive: {
    backgroundColor: "#10B981",
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  subjectBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  subjectText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  heroDescription: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 24,
    marginTop: 4,
  },
  codeSection: {
    padding: 20,
    paddingTop: 24,
  },
  codeCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  codeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  codeHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  codeLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "600",
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  copyButtonText: {
    color: "#6366F1",
    fontSize: 13,
    fontWeight: "600",
  },
  codeText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#6366F1",
    fontFamily: "monospace",
    textAlign: "center",
    letterSpacing: 4,
    marginBottom: 12,
  },
  codeHint: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
  },
  section: {
    padding: 20,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  infoGrid: {
    flexDirection: "row",
    gap: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    gap: 8,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  infoCardLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: "500",
  },
  infoCardValue: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "700",
    textAlign: "center",
  },
  adminText: {
    color: "#F59E0B",
  },
  memberText: {
    color: "#10B981",
  },
  actionsGrid: {
    gap: 12,
  },
  actionCard: {
    borderRadius: 20,
    overflow: "hidden",
  },
  actionCardPrimary: {
    height: 160,
  },
  actionGradient: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  actionCardContent: {
    padding: 24,
    alignItems: "center",
    gap: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  actionCardSecondary: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  actionCardTertiary: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  actionCardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  actionCardTitleDark: {
    color: "#FFFFFF",
  },
  actionCardDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  actionCardDescriptionDark: {
    color: "rgba(255, 255, 255, 0.6)",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginHorizontal: 20,
    marginTop: 8,
  },
  backButtonText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 15,
    fontWeight: "600",
  },
})
