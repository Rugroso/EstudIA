import { useAuth } from "@/context/AuthContext"
import { useClassroom } from "@/context/ClassroomContext"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { MaterialIcons } from "@expo/vector-icons"

interface Flashcard {
  id: number
  type: "definition" | "concept" | "example" | "application"
  difficulty: "easy" | "medium" | "hard"
  front: string
  back: string
  category: string
  tags: string[]
}

interface FlashcardsMetadata {
  total_flashcards: number
  difficulty_distribution: {
    easy: number
    medium: number
    hard: number
  }
  categories: string[]
  types: {
    definition: number
    concept: number
    example: number
    application: number
  }
  classroom_id: string
  source_documents: number
  content_chunks_analyzed: number
}

interface FlashcardsAPIResponse {
  success: boolean
  message: string
  flashcards: Flashcard[]
  metadata: FlashcardsMetadata
}

export default function FlashcardsScreen() {
  const { user } = useAuth()
  const { currentClassroom } = useClassroom()
  
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [metadata, setMetadata] = useState<FlashcardsMetadata | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [flipAnimation] = useState(new Animated.Value(0))
  const [maxFlashcards, setMaxFlashcards] = useState(20)
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "mixed">("mixed")

  const handleGenerateFlashcards = async () => {
    if (!currentClassroom?.id) {
      Alert.alert("Error", "No hay un salón seleccionado")
      return
    }

    setLoading(true)
    console.log("🎴 Generando flashcards...")

    try {
      const response = await fetch(
        "https://u7jss6bicb.execute-api.us-east-2.amazonaws.com/generate-flashcards",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            classroom_id: currentClassroom.id,
            max_flashcards: maxFlashcards,
            difficulty_level: difficulty,
          }),
        }
      )

      console.log("📡 Response status:", response.status)

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`)
      }

      const apiResponse = await response.json()
      console.log("📦 API Response:", JSON.stringify(apiResponse, null, 2))

      // Validar estructura de respuesta
      if (!apiResponse.success || !apiResponse.data?.structuredContent) {
        throw new Error("Respuesta sin structuredContent")
      }

      const data: FlashcardsAPIResponse = apiResponse.data.structuredContent

      if (!data.success) {
        throw new Error(data.message || "Error al generar flashcards")
      }

      if (data.flashcards && data.flashcards.length > 0) {
        setFlashcards(data.flashcards)
        setMetadata(data.metadata)
        setCurrentIndex(0)
        setIsFlipped(false)
        console.log(`✅ ${data.flashcards.length} flashcards generadas exitosamente`)
      } else {
        Alert.alert("Sin contenido", "No se pudieron generar flashcards. Asegúrate de haber subido documentos al salón.")
      }
    } catch (error) {
      console.error("❌ Error generando flashcards:", error)
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Error al generar flashcards"
      )
    } finally {
      setLoading(false)
    }
  }

  const flipCard = () => {
    Animated.timing(flipAnimation, {
      toValue: isFlipped ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
    setIsFlipped(!isFlipped)
  }

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
      flipAnimation.setValue(0)
    }
  }

  const previousCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(false)
      flipAnimation.setValue(0)
    }
  }

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  })

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  })

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy":
        return "#10B981"
      case "medium":
        return "#F59E0B"
      case "hard":
        return "#EF4444"
      default:
        return "#6366F1"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "definition":
        return "menu-book"
      case "concept":
        return "lightbulb"
      case "example":
        return "psychology"
      case "application":
        return "build"
      default:
        return "style"
    }
  }

  const currentCard = flashcards[currentIndex]

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <MaterialIcons name="style" size={48} color="#fff" />
              <Text style={styles.title}>Flashcards</Text>
              <Text style={styles.subtitle}>
                {currentClassroom?.name || "Selecciona un salón"}
              </Text>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
              <View style={styles.controlRow}>
                <Text style={styles.controlLabel}>Cantidad:</Text>
                <View style={styles.buttonGroup}>
                  {[10, 20, 30].map((num) => (
                    <Pressable
                      key={num}
                      style={[
                        styles.optionButton,
                        maxFlashcards === num && styles.optionButtonActive,
                      ]}
                      onPress={() => setMaxFlashcards(num)}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          maxFlashcards === num && styles.optionButtonTextActive,
                        ]}
                      >
                        {num}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.controlRow}>
                <Text style={styles.controlLabel}>Dificultad:</Text>
                <View style={styles.buttonGroup}>
                  {(["easy", "medium", "hard", "mixed"] as const).map((diff) => (
                    <Pressable
                      key={diff}
                      style={[
                        styles.optionButton,
                        difficulty === diff && styles.optionButtonActive,
                      ]}
                      onPress={() => setDifficulty(diff)}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          difficulty === diff && styles.optionButtonTextActive,
                        ]}
                      >
                        {diff === "easy" ? "Fácil" : diff === "medium" ? "Media" : diff === "hard" ? "Difícil" : "Mixta"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.generateButton,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={handleGenerateFlashcards}
                disabled={loading}
              >
                <LinearGradient
                  colors={["#6366F1", "#8B5CF6"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.generateGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialIcons name="auto-awesome" size={20} color="#FFFFFF" />
                      <Text style={styles.generateButtonText}>Generar Flashcards</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>

            {/* Metadata */}
            {metadata && (
              <View style={styles.metadataCard}>
                <Text style={styles.metadataTitle}>📊 Estadísticas</Text>
                <View style={styles.metadataGrid}>
                  <View style={styles.metadataItem}>
                    <Text style={styles.metadataValue}>{metadata.total_flashcards}</Text>
                    <Text style={styles.metadataLabel}>Total</Text>
                  </View>
                  <View style={styles.metadataItem}>
                    <Text style={styles.metadataValue}>{metadata.source_documents}</Text>
                    <Text style={styles.metadataLabel}>Documentos</Text>
                  </View>
                  <View style={styles.metadataItem}>
                    <Text style={styles.metadataValue}>{metadata.content_chunks_analyzed}</Text>
                    <Text style={styles.metadataLabel}>Fragmentos</Text>
                  </View>
                </View>
                <View style={styles.difficultyBars}>
                  <View style={styles.difficultyBar}>
                    <View style={styles.difficultyBarHeader}>
                      <Text style={styles.difficultyBarLabel}>Fácil</Text>
                      <Text style={styles.difficultyBarValue}>{metadata.difficulty_distribution.easy}</Text>
                    </View>
                    <View style={styles.difficultyBarTrack}>
                      <View
                        style={[
                          styles.difficultyBarFill,
                          {
                            width: `${(metadata.difficulty_distribution.easy / metadata.total_flashcards) * 100}%`,
                            backgroundColor: "#10B981",
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <View style={styles.difficultyBar}>
                    <View style={styles.difficultyBarHeader}>
                      <Text style={styles.difficultyBarLabel}>Media</Text>
                      <Text style={styles.difficultyBarValue}>{metadata.difficulty_distribution.medium}</Text>
                    </View>
                    <View style={styles.difficultyBarTrack}>
                      <View
                        style={[
                          styles.difficultyBarFill,
                          {
                            width: `${(metadata.difficulty_distribution.medium / metadata.total_flashcards) * 100}%`,
                            backgroundColor: "#F59E0B",
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <View style={styles.difficultyBar}>
                    <View style={styles.difficultyBarHeader}>
                      <Text style={styles.difficultyBarLabel}>Difícil</Text>
                      <Text style={styles.difficultyBarValue}>{metadata.difficulty_distribution.hard}</Text>
                    </View>
                    <View style={styles.difficultyBarTrack}>
                      <View
                        style={[
                          styles.difficultyBarFill,
                          {
                            width: `${(metadata.difficulty_distribution.hard / metadata.total_flashcards) * 100}%`,
                            backgroundColor: "#EF4444",
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Flashcard */}
            {currentCard && (
              <View style={styles.cardContainer}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardCounter}>
                    {currentIndex + 1} / {flashcards.length}
                  </Text>
                  <View style={styles.cardBadges}>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: getDifficultyColor(currentCard.difficulty) },
                      ]}
                    >
                      <Text style={styles.badgeText}>
                        {currentCard.difficulty === "easy"
                          ? "Fácil"
                          : currentCard.difficulty === "medium"
                          ? "Media"
                          : "Difícil"}
                      </Text>
                    </View>
                    <View style={styles.badge}>
                      <MaterialIcons
                        name={getTypeIcon(currentCard.type) as any}
                        size={14}
                        color="#FFFFFF"
                      />
                      <Text style={styles.badgeText}>
                        {currentCard.type === "definition"
                          ? "Definición"
                          : currentCard.type === "concept"
                          ? "Concepto"
                          : currentCard.type === "example"
                          ? "Ejemplo"
                          : "Aplicación"}
                      </Text>
                    </View>
                  </View>
                </View>

                <Pressable onPress={flipCard} style={styles.cardPressable}>
                  <Animated.View
                    style={[
                      styles.card,
                      styles.cardFront,
                      {
                        transform: [{ rotateY: frontInterpolate }],
                        opacity: flipAnimation.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [1, 0, 0],
                        }),
                      },
                    ]}
                  >
                    <Text style={styles.cardLabel}>Pregunta</Text>
                    <Text style={styles.cardText}>{currentCard.front}</Text>
                    <Text style={styles.cardHint}>👆 Toca para voltear</Text>
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.card,
                      styles.cardBack,
                      {
                        transform: [{ rotateY: backInterpolate }],
                        opacity: flipAnimation.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0, 0, 1],
                        }),
                      },
                    ]}
                  >
                    <Text style={styles.cardLabel}>Respuesta</Text>
                    <Text style={styles.cardText}>{currentCard.back}</Text>
                    <View style={styles.cardTags}>
                      {currentCard.tags.slice(0, 3).map((tag, idx) => (
                        <View key={idx} style={styles.tag}>
                          <Text style={styles.tagText}>#{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </Animated.View>
                </Pressable>

                {/* Navigation */}
                <View style={styles.navigation}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.navButton,
                      currentIndex === 0 && styles.navButtonDisabled,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                    onPress={previousCard}
                    disabled={currentIndex === 0}
                  >
                    <MaterialIcons
                      name="chevron-left"
                      size={28}
                      color={currentIndex === 0 ? "#444" : "#FFFFFF"}
                    />
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.flipButton,
                      { opacity: pressed ? 0.8 : 1 },
                    ]}
                    onPress={flipCard}
                  >
                    <MaterialIcons name="flip" size={24} color="#FFFFFF" />
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.navButton,
                      currentIndex === flashcards.length - 1 && styles.navButtonDisabled,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                    onPress={nextCard}
                    disabled={currentIndex === flashcards.length - 1}
                  >
                    <MaterialIcons
                      name="chevron-right"
                      size={28}
                      color={currentIndex === flashcards.length - 1 ? "#444" : "#FFFFFF"}
                    />
                  </Pressable>
                </View>
              </View>
            )}

            {/* Empty State */}
            {!loading && flashcards.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Sin flashcards</Text>
                <Text style={styles.emptyDescription}>
                  Genera flashcards para estudiar el contenido de tu salón
                </Text>
              </View>
            )}
          </View>
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
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.2)',
  },
   title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
  },
  controls: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 16,
  },
  controlRow: {
    gap: 12,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  optionButtonActive: {
    backgroundColor: "#6366F1",
    borderColor: "#6366F1",
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.6)",
  },
  optionButtonTextActive: {
    color: "#FFFFFF",
  },
  generateButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
  },
  generateGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  metadataCard: {
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
    gap: 16,
  },
  metadataTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  metadataGrid: {
    flexDirection: "row",
    gap: 12,
  },
  metadataItem: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  metadataValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  metadataLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 4,
  },
  difficultyBars: {
    gap: 12,
  },
  difficultyBar: {
    gap: 6,
  },
  difficultyBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  difficultyBarLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
  },
  difficultyBarValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  difficultyBarTrack: {
    height: 6,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 3,
    overflow: "hidden",
  },
  difficultyBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  cardContainer: {
    gap: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardCounter: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.6)",
  },
  cardBadges: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(99, 102, 241, 0.3)",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  cardPressable: {
    height: 400,
    position: "relative",
  },
  card: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 24,
    padding: 32,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    backfaceVisibility: "hidden",
  },
  cardFront: {
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderWidth: 2,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  cardBack: {
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    borderWidth: 2,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.5)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 32,
  },
  cardHint: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.4)",
  },
  cardTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "600",
  },
  navigation: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  navButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  navButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  flipButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#8B5CF6",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  emptyDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
  },
})
