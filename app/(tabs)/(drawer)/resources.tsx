"use client"

import { useState } from "react"
import { ScrollableTabView } from "@/components/scrollable-tab-view"
import { Text, View, StyleSheet, Pressable, Modal } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useClassroom } from "@/context/ClassroomContext"

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
  const [selectedTab, setSelectedTab] = useState<"flashcards" | "mindmaps">("flashcards")
  const [selectedCard, setSelectedCard] = useState<FlashCard | null>(null)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showCardModal, setShowCardModal] = useState(false)

  // Datos dummy de flash cards
  const flashCards: FlashCard[] = [
    {
      id: "1",
      question: "¿Qué es React Native?",
      answer:
        "React Native es un framework de desarrollo móvil que permite crear aplicaciones nativas para iOS y Android usando JavaScript y React.",
      category: "Desarrollo Móvil",
    },
    {
      id: "2",
      question: "¿Qué es una función asíncrona?",
      answer:
        "Una función asíncrona es una función que opera de manera asíncrona mediante el event loop, usando una sintaxis async/await para manejar promesas.",
      category: "JavaScript",
    },
    {
      id: "3",
      question: "¿Qué es un hook en React?",
      answer:
        "Los hooks son funciones especiales que permiten usar estado y otras características de React sin escribir una clase. Ejemplos: useState, useEffect.",
      category: "React",
    },
    {
      id: "4",
      question: "¿Qué es TypeScript?",
      answer:
        "TypeScript es un superset de JavaScript que añade tipado estático opcional. Compila a JavaScript puro y mejora la detección de errores.",
      category: "TypeScript",
    },
    {
      id: "5",
      question: "¿Qué es una API REST?",
      answer:
        "API REST es un estilo arquitectónico para servicios web que usa HTTP y sus métodos (GET, POST, PUT, DELETE) para interactuar con recursos.",
      category: "Backend",
    },
    {
      id: "6",
      question: "¿Qué es Supabase?",
      answer:
        "Supabase es una alternativa open-source a Firebase que proporciona base de datos PostgreSQL, autenticación, storage y realtime subscriptions.",
      category: "Backend",
    },
  ]

  // Datos dummy de mapas mentales
  const mindMaps: MindMap[] = [
    {
      id: "1",
      title: "Arquitectura de React Native",
      topic: "Desarrollo Móvil",
      nodes: 12,
    },
    {
      id: "2",
      title: "Conceptos de JavaScript ES6+",
      topic: "JavaScript",
      nodes: 18,
    },
    {
      id: "3",
      title: "Hooks de React",
      topic: "React",
      nodes: 10,
    },
    {
      id: "4",
      title: "Tipos avanzados en TypeScript",
      topic: "TypeScript",
      nodes: 15,
    },
    {
      id: "5",
      title: "Patrones de diseño REST",
      topic: "Backend",
      nodes: 8,
    },
  ]

  const handleCardPress = (card: FlashCard) => {
    setSelectedCard(card)
    setIsFlipped(false)
    setShowCardModal(true)
  }

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped)
  }

  const handleGenerateFlashCards = () => {
    // Aquí se conectaría con la IA para generar flash cards
    console.log("Generando flash cards con IA...")
  }

  const handleGenerateMindMap = () => {
    // Aquí se conectaría con la IA para generar mapas mentales
    console.log("Generando mapa mental con IA...")
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
        <Text style={styles.headerTitle}>📚 Recursos de Estudio</Text>
        <Text style={styles.headerSubtitle}>Generados con Inteligencia Artificial</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, selectedTab === "flashcards" && styles.tabActive]}
          onPress={() => setSelectedTab("flashcards")}
        >
          <MaterialIcons
            name="style"
            size={20}
            color={selectedTab === "flashcards" ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)"}
          />
          <Text style={[styles.tabText, selectedTab === "flashcards" && styles.tabTextActive]}>Flash Cards</Text>
        </Pressable>

        <Pressable
          style={[styles.tab, selectedTab === "mindmaps" && styles.tabActive]}
          onPress={() => setSelectedTab("mindmaps")}
        >
          <MaterialIcons
            name="account-tree"
            size={20}
            color={selectedTab === "mindmaps" ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)"}
          />
          <Text style={[styles.tabText, selectedTab === "mindmaps" && styles.tabTextActive]}>Mapas Mentales</Text>
        </Pressable>
      </View>

      {/* Botón de generar con IA */}
      <Pressable
        style={styles.generateButton}
        onPress={selectedTab === "flashcards" ? handleGenerateFlashCards : handleGenerateMindMap}
      >
        <LinearGradient colors={["#6366F1", "#8B5CF6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.generateGradient}>
          <MaterialIcons name="auto-awesome" size={24} color="#FFFFFF" />
          <Text style={styles.generateButtonText}>
            Generar {selectedTab === "flashcards" ? "Flash Cards" : "Mapa Mental"} con IA
          </Text>
        </LinearGradient>
      </Pressable>

      {/* Contenido según tab seleccionado */}
      {selectedTab === "flashcards" ? (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>💡 Tus Flash Cards ({flashCards.length})</Text>
          <View style={styles.cardsGrid}>
            {flashCards.map((card) => (
              <Pressable
                key={card.id}
                style={({ pressed }) => [styles.flashCard, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => handleCardPress(card)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardCategory}>
                    <Text style={styles.cardCategoryText}>{card.category}</Text>
                  </View>
                  <MaterialIcons name="flip" size={20} color="rgba(255, 255, 255, 0.4)" />
                </View>
                <Text style={styles.cardQuestion} numberOfLines={3}>
                  {card.question}
                </Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardFooterText}>Toca para voltear</Text>
                  <MaterialIcons name="touch-app" size={16} color="rgba(255, 255, 255, 0.4)" />
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>🧠 Tus Mapas Mentales ({mindMaps.length})</Text>
          <View style={styles.mindMapsList}>
            {mindMaps.map((mindMap) => (
              <Pressable
                key={mindMap.id}
                style={({ pressed }) => [styles.mindMapCard, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => console.log("Ver mapa mental:", mindMap.id)}
              >
                <LinearGradient
                  colors={["rgba(99, 102, 241, 0.2)", "rgba(139, 92, 246, 0.2)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.mindMapGradient}
                >
                  <View style={styles.mindMapIcon}>
                    <MaterialIcons name="account-tree" size={32} color="#6366F1" />
                  </View>
                  <View style={styles.mindMapInfo}>
                    <Text style={styles.mindMapTitle}>{mindMap.title}</Text>
                    <Text style={styles.mindMapTopic}>{mindMap.topic}</Text>
                    <View style={styles.mindMapStats}>
                      <MaterialIcons name="blur-on" size={14} color="rgba(255, 255, 255, 0.5)" />
                      <Text style={styles.mindMapNodes}>{mindMap.nodes} nodos</Text>
                    </View>
                  </View>
                  <MaterialIcons name="arrow-forward" size={24} color="rgba(255, 255, 255, 0.4)" />
                </LinearGradient>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Modal de Flash Card */}
      <Modal visible={showCardModal} transparent animationType="fade" onRequestClose={() => setShowCardModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Pressable style={styles.modalClose} onPress={() => setShowCardModal(false)}>
              <MaterialIcons name="close" size={24} color="#FFFFFF" />
            </Pressable>

            {selectedCard && (
              <Pressable style={styles.modalCard} onPress={handleFlipCard}>
                <View style={styles.modalCardCategory}>
                  <Text style={styles.modalCardCategoryText}>{selectedCard.category}</Text>
                </View>

                <View style={styles.modalCardContent}>
                  <Text style={styles.modalCardLabel}>{isFlipped ? "RESPUESTA" : "PREGUNTA"}</Text>
                  <Text style={styles.modalCardText}>{isFlipped ? selectedCard.answer : selectedCard.question}</Text>
                </View>

                <View style={styles.modalCardFooter}>
                  <MaterialIcons name="flip" size={20} color="rgba(255, 255, 255, 0.6)" />
                  <Text style={styles.modalCardFooterText}>Toca para voltear</Text>
                </View>
              </Pressable>
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
    marginBottom: 24,
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
    minHeight: 300,
    justifyContent: "space-between",
  },
  modalCardCategory: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 24,
  },
  modalCardCategoryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6366F1",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalCardContent: {
    flex: 1,
    justifyContent: "center",
    gap: 20,
  },
  modalCardLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.5)",
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
  },
  modalCardText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    lineHeight: 32,
    textAlign: "center",
  },
  modalCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
  },
  modalCardFooterText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    fontStyle: "italic",
  },
})
