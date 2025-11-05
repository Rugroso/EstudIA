"use client"

import { useState, useEffect } from "react"
import { ScrollableTabView } from "@/components/scrollable-tab-view"
import { Text, View, StyleSheet, Pressable, Modal, ActivityIndicator, Alert } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useClassroom } from "@/context/ClassroomContext"
import { useAuth } from "@/context/AuthContext"

interface KeyConcept {
  concept: string
  definition: string
  importance: string
}

interface Exercise {
  exercise: string
  difficulty: string
  objective: string
}

interface GeneratedResources {
  summary: string
  key_concepts: KeyConcept[]
  study_tips: string[]
  suggested_exercises: Exercise[]
  recommended_readings: string[]
}

interface ResourcesAPIResponse {
  success: boolean
  data: {
    content: Array<{
      type: string
      text: string
    }>
    structuredContent: {
      success: boolean
      message?: string
      error?: string
      resources?: GeneratedResources
      classroom_id?: string
      chunks_analyzed?: number
    }
    isError: boolean
  }
  source: string
  timestamp: string
  metadata: {
    classroom_id: string
    resource_type: string
    user_id: string
    topic: string
  }
}

interface FlashCard {
  id: string
  question: string
  answer: string
  category: string
}

interface MindMap {
  id: string
  title: string
  topic: string
  nodes: number
}

export default function ResourcesScreen() {
  const { currentClassroom } = useClassroom()
  const { user } = useAuth()
  const [selectedTab, setSelectedTab] = useState<"summary" | "concepts" | "exercises">("summary")
  const [selectedCard, setSelectedCard] = useState<FlashCard | null>(null)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showCardModal, setShowCardModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resources, setResources] = useState<GeneratedResources | null>(null)
  const [selectedConcept, setSelectedConcept] = useState<KeyConcept | null>(null)
  const [showConceptModal, setShowConceptModal] = useState(false)

  // Función para generar recursos con IA
  const handleGenerateResources = async () => {
    if (!currentClassroom?.id) {
      Alert.alert('Error', 'No hay salón seleccionado')
      return
    }

    if (!user?.id) {
      Alert.alert('Error', 'Usuario no autenticado')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('https://d8pgui6dhb.execute-api.us-east-2.amazonaws.com/generate-resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          //classroom_id: currentClassroom.id,
          //resource_type: "pdf",
          //user_id: user.id,
          //topic: currentClassroom.name || "Material del salón",
          //source_document_ids: [] // Array vacío por ahora, se puede llenar después
          "classroom_id": "0185c8b6-6774-4cd2-b0aa-76a018f072a7",
          "resource_type": "pdf",
          "user_id": "789e0123-e89b-12d3-a456-426614174999",
          "topic": "",
          "source_document_ids": []
        })
      })

      const apiResponse: ResourcesAPIResponse = await response.json()

      console.log('📄 [Resources] API Response:', apiResponse)

      // Verificar si la respuesta externa fue exitosa
      if (!apiResponse.success) {
        Alert.alert('Error', 'Error al conectar con el servidor')
        return
      }

      // Verificar si hay error en los datos
      if (apiResponse.data.isError) {
        Alert.alert('Error', 'Ocurrió un error al generar los recursos')
        return
      }

      // Verificar el contenido estructurado
      const structuredContent = apiResponse.data.structuredContent

      if (!structuredContent.success) {
        const errorMessage = structuredContent.error || structuredContent.message || 'Error desconocido'
        Alert.alert('Error', `No se pudieron generar los recursos: ${errorMessage}`)
        return
      }

      // Verificar que tenemos los recursos
      if (!structuredContent.resources) {
        Alert.alert('Error', 'No se recibieron recursos del servidor')
        return
      }

      // Todo bien, guardar los recursos
      setResources(structuredContent.resources)
      Alert.alert(
        '¡Éxito!', 
        `Recursos generados exitosamente${structuredContent.chunks_analyzed ? ` basados en ${structuredContent.chunks_analyzed} documentos` : ''}`
      )

    } catch (error) {
      console.error('❌ [Resources] Error:', error)
      Alert.alert('Error', 'No se pudieron generar los recursos. Verifica tu conexión.')
    } finally {
      setLoading(false)
    }
  }

  const handleConceptPress = (concept: KeyConcept) => {
    setSelectedConcept(concept)
    setShowConceptModal(true)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'fácil':
        return '#10B981'
      case 'intermedio':
        return '#F59E0B'
      case 'avanzado':
        return '#EF4444'
      default:
        return '#6366F1'
    }
  }

  if (!currentClassroom) {
    return (
      <ScrollableTabView contentContainerStyle={styles.noClassroomContainer}>
        <MaterialIcons name="folder-off" size={64} color="rgba(255, 255, 255, 0.3)" />
        <Text style={styles.noClassroomText}>Selecciona un salón para ver recursos</Text>
      </ScrollableTabView>
    )
  }

  return (
    <ScrollableTabView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialIcons name="summarize" size={48} color="#FFF" />
        <Text style={styles.headerTitle}> Recursos de Estudio</Text>
        <Text style={styles.headerSubtitle}>Generados con Inteligencia Artificial</Text>
      </View>

      {/* Botón de generar con IA */}
      <Pressable
        style={styles.generateButton}
        onPress={handleGenerateResources}
        disabled={loading}
      >
        <LinearGradient 
          colors={loading ? ["#4B5563", "#6B7280"] : ["#6366F1", "#8B5CF6"]} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }} 
          style={styles.generateGradient}
        >
          {loading ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.generateButtonText}>Generando recursos...</Text>
            </>
          ) : (
            <>
              <MaterialIcons name="auto-awesome" size={24} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>Generar Recursos con IA</Text>
            </>
          )}
        </LinearGradient>
      </Pressable>

      {!resources ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="lightbulb-outline" size={80} color="rgba(255, 255, 255, 0.2)" />
          <Text style={styles.emptyTitle}>No hay recursos generados</Text>
          <Text style={styles.emptySubtitle}>
            Presiona el botón de arriba para generar recursos de estudio personalizados con IA
          </Text>
        </View>
      ) : (
        <>
          {/* Tabs */}
          <View style={styles.tabs}>
            <Pressable
              style={[styles.tab, selectedTab === "summary" && styles.tabActive]}
              onPress={() => setSelectedTab("summary")}
            >
              <MaterialIcons
                name="subject"
                size={20}
                color={selectedTab === "summary" ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)"}
              />
              <Text style={[styles.tabText, selectedTab === "summary" && styles.tabTextActive]}>Resumen</Text>
            </Pressable>

            <Pressable
              style={[styles.tab, selectedTab === "concepts" && styles.tabActive]}
              onPress={() => setSelectedTab("concepts")}
            >
              <MaterialIcons
                name="lightbulb"
                size={20}
                color={selectedTab === "concepts" ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)"}
              />
              <Text style={[styles.tabText, selectedTab === "concepts" && styles.tabTextActive]}>
                Conceptos ({resources.key_concepts.length})
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tab, selectedTab === "exercises" && styles.tabActive]}
              onPress={() => setSelectedTab("exercises")}
            >
              <MaterialIcons
                name="fitness-center"
                size={20}
                color={selectedTab === "exercises" ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)"}
              />
              <Text style={[styles.tabText, selectedTab === "exercises" && styles.tabTextActive]}>
                Ejercicios ({resources.suggested_exercises.length})
              </Text>
            </Pressable>
          </View>

          {/* Contenido según tab seleccionado */}
          {selectedTab === "summary" && (
            <View style={styles.content}>
              <Text style={styles.sectionTitle}>� Resumen</Text>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryText}>{resources.summary}</Text>
              </View>

              <Text style={styles.sectionTitle}>💡 Tips de Estudio</Text>
              {resources.study_tips.map((tip, index) => (
                <View key={index} style={styles.tipCard}>
                  <View style={styles.tipNumber}>
                    <Text style={styles.tipNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}

              <Text style={styles.sectionTitle}>📖 Lecturas Recomendadas</Text>
              {resources.recommended_readings.map((reading, index) => (
                <View key={index} style={styles.readingCard}>
                  <MaterialIcons name="menu-book" size={24} color="#6366F1" />
                  <Text style={styles.readingText}>{reading}</Text>
                </View>
              ))}
            </View>
          )}

          {selectedTab === "concepts" && (
            <View style={styles.content}>
              <Text style={styles.sectionTitle}>🎯 Conceptos Clave</Text>
              <View style={styles.conceptsGrid}>
                {resources.key_concepts.map((concept, index) => (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [styles.conceptCard, { opacity: pressed ? 0.8 : 1 }]}
                    onPress={() => handleConceptPress(concept)}
                  >
                    <View style={styles.conceptHeader}>
                      <MaterialIcons name="star" size={20} color="#F59E0B" />
                      <Text style={styles.conceptTitle}>{concept.concept}</Text>
                    </View>
                    <Text style={styles.conceptDefinition} numberOfLines={3}>
                      {concept.definition}
                    </Text>
                    <View style={styles.conceptFooter}>
                      <Text style={styles.conceptFooterText}>Toca para ver más</Text>
                      <MaterialIcons name="arrow-forward" size={16} color="rgba(255, 255, 255, 0.4)" />
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {selectedTab === "exercises" && (
            <View style={styles.content}>
              <Text style={styles.sectionTitle}>🏋️ Ejercicios Sugeridos</Text>
              {resources.suggested_exercises.map((exercise, index) => (
                <View key={index} style={styles.exerciseCard}>
                  <View style={styles.exerciseHeader}>
                    <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(exercise.difficulty) + '33' }]}>
                      <Text style={[styles.difficultyText, { color: getDifficultyColor(exercise.difficulty) }]}>
                        {exercise.difficulty}
                      </Text>
                    </View>
                    <MaterialIcons name="assignment" size={20} color="rgba(255, 255, 255, 0.6)" />
                  </View>
                  <Text style={styles.exerciseText}>{exercise.exercise}</Text>
                  <View style={styles.exerciseObjective}>
                    <MaterialIcons name="flag" size={16} color="#6366F1" />
                    <Text style={styles.exerciseObjectiveText}>{exercise.objective}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {/* Modal de Concepto */}
      <Modal visible={showConceptModal} transparent animationType="fade" onRequestClose={() => setShowConceptModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Pressable style={styles.modalClose} onPress={() => setShowConceptModal(false)}>
              <MaterialIcons name="close" size={24} color="#FFFFFF" />
            </Pressable>

            {selectedConcept && (
              <View style={styles.modalCard}>
                <View style={styles.modalConceptHeader}>
                  <MaterialIcons name="star" size={32} color="#F59E0B" />
                  <Text style={styles.modalConceptTitle}>{selectedConcept.concept}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionLabel}>DEFINICIÓN</Text>
                  <Text style={styles.modalSectionText}>{selectedConcept.definition}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionLabel}>IMPORTANCIA</Text>
                  <Text style={styles.modalSectionText}>{selectedConcept.importance}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollableTabView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: "#0A0A0F",
  },
  noClassroomContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A0A0F",
    gap: 16,
  },
  noClassroomText: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.2)',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
  },
  tabs: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  tabActive: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    borderColor: "rgba(99, 102, 241, 0.5)",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.6)",
  },
  tabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  generateButton: {
    marginBottom: 32,
    borderRadius: 16,
    overflow: "hidden",
  },
  generateGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  content: {
    gap: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  cardsGrid: {
    gap: 16,
  },
  flashCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardCategory: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  cardCategoryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6366F1",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardQuestion: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    lineHeight: 26,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardFooterText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.4)",
    fontStyle: "italic",
  },
  mindMapsList: {
    gap: 16,
  },
  mindMapCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  mindMapGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  mindMapIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  mindMapInfo: {
    flex: 1,
    gap: 6,
  },
  mindMapTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  mindMapTopic: {
    fontSize: 14,
    color: "#6366F1",
    fontWeight: "600",
  },
  mindMapStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  mindMapNodes: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.5)",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 500,
    position: "relative",
  },
  modalClose: {
    position: "absolute",
    top: -50,
    right: 0,
    zIndex: 10,
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  modalCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  // Nuevos estilos
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    maxWidth: 300,
    lineHeight: 24,
  },
  summaryCard: {
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  summaryText: {
    fontSize: 16,
    color: "#FFFFFF",
    lineHeight: 26,
  },
  tipCard: {
    flexDirection: "row",
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  tipNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(139, 92, 246, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  tipNumberText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#8B5CF6",
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    color: "#FFFFFF",
    lineHeight: 22,
  },
  readingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  readingText: {
    flex: 1,
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  conceptsGrid: {
    gap: 16,
  },
  conceptCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  conceptHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  conceptTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  conceptDefinition: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 22,
    marginBottom: 16,
  },
  conceptFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  conceptFooterText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.4)",
    fontStyle: "italic",
  },
  exerciseCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 12,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  difficultyBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  exerciseText: {
    fontSize: 16,
    color: "#FFFFFF",
    lineHeight: 24,
  },
  exerciseObjective: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    padding: 12,
    borderRadius: 12,
  },
  exerciseObjectiveText: {
    flex: 1,
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 20,
  },
  modalConceptHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  modalConceptTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.5)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  modalSectionText: {
    fontSize: 16,
    color: "#FFFFFF",
    lineHeight: 26,
  },
})
