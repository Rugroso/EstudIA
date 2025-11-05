"use client"

import { useState } from "react"
import { ScrollableTabView } from "@/components/scrollable-tab-view"
import { Text, View, StyleSheet, Pressable, ActivityIndicator, Alert, Linking } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useClassroom } from "@/context/ClassroomContext"
import { useAuth } from "@/context/AuthContext"

interface ResourcesAPIResponse {
  success: boolean
  data: {
    content: Array<{
      type: string
      text: string
    }>
    structuredContent: {
      success: boolean
      message: string
      resource_id: string
      resource_type: string
      title: string
      storage_path: string
      bucket: string
      personalized: boolean
      user_name: string
      file_size_bytes: number
      public_url: string
      sections_count: number
      concepts_count: number
      source_documents: number
    }
    isError: boolean
  }
  source: string
  timestamp: string
  metadata: {
    classroom_id: string
    resource_type: string
    user_id: string
    topic: string | null
  }
}

export default function ResourcesScreen() {
  const { currentClassroom } = useClassroom()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [generatedPDF, setGeneratedPDF] = useState<{
    url: string
    title: string
    resource_id: string
    file_size_bytes: number
    sections_count: number
    concepts_count: number
  } | null>(null)

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
      console.log('🚀 Enviando petición al endpoint de recursos:', {
        classroom_id: currentClassroom.id,
        resource_type: "pdf",
        user_id: user.id
      })

      const response = await fetch('https://u7jss6bicb.execute-api.us-east-2.amazonaws.com/generate-resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classroom_id: currentClassroom.id,
          resource_type: "pdf",
          user_id: user.id
        })
      })

      // Verificar si la respuesta HTTP fue exitosa
      if (!response.ok) {
        throw new Error('Error al conectar con el servidor')
      }

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
        const errorMessage = structuredContent.message || 'Error desconocido'
        Alert.alert('Error', `No se pudieron generar los recursos: ${errorMessage}`)
        return
      }

      // Todo bien, guardar la información del PDF generado
      setGeneratedPDF({
        url: structuredContent.public_url,
        title: structuredContent.title,
        resource_id: structuredContent.resource_id,
        file_size_bytes: structuredContent.file_size_bytes,
        sections_count: structuredContent.sections_count,
        concepts_count: structuredContent.concepts_count
      })

      Alert.alert(
        '¡Éxito!', 
        `PDF "${structuredContent.title}" generado exitosamente\n\n` +
        `📊 ${structuredContent.sections_count} secciones\n` +
        `💡 ${structuredContent.concepts_count} conceptos clave\n` +
        `📄 ${structuredContent.source_documents} documento(s) fuente\n\n` +
        `¿Deseas abrirlo ahora?`,
        [
          { text: 'Después', style: 'cancel' },
          { 
            text: 'Abrir PDF', 
            onPress: () => Linking.openURL(structuredContent.public_url)
          }
        ]
      )

    } catch (error) {
      console.error('❌ [Resources] Error:', error)
      Alert.alert(
        'Error', 
        error instanceof Error ? error.message : 'No se pudieron generar los recursos. Verifica tu conexión.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleOpenPDF = () => {
    if (generatedPDF?.url) {
      Linking.openURL(generatedPDF.url)
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
        <MaterialIcons name="picture-as-pdf" size={48} color="#FFF" />
        <Text style={styles.headerTitle}>Recursos de Estudio</Text>
        <Text style={styles.headerSubtitle}>PDF personalizado generado con IA</Text>
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
              <Text style={styles.generateButtonText}>Generando PDF...</Text>
            </>
          ) : (
            <>
              <MaterialIcons name="auto-awesome" size={24} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>
                {generatedPDF ? 'Generar Nuevo PDF' : 'Generar PDF con IA'}
              </Text>
            </>
          )}
        </LinearGradient>
      </Pressable>

      {!generatedPDF ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="description" size={80} color="rgba(255, 255, 255, 0.2)" />
          <Text style={styles.emptyTitle}>No hay PDF generado</Text>
          <Text style={styles.emptySubtitle}>
            Presiona el botón de arriba para generar un PDF de estudio personalizado con IA basado en los documentos de tu salón
          </Text>
        </View>
      ) : (
        <View style={styles.pdfContainer}>
          {/* Tarjeta del PDF generado */}
          <View style={styles.pdfCard}>
            <View style={styles.pdfIconContainer}>
              <MaterialIcons name="picture-as-pdf" size={48} color="#EF4444" />
            </View>
            
            <View style={styles.pdfInfo}>
              <Text style={styles.pdfTitle}>{generatedPDF.title}</Text>
              
              <View style={styles.pdfStats}>
                <View style={styles.statItem}>
                  <MaterialIcons name="article" size={16} color="#6366F1" />
                  <Text style={styles.statText}>{generatedPDF.sections_count} secciones</Text>
                </View>
                
                <View style={styles.statItem}>
                  <MaterialIcons name="lightbulb" size={16} color="#8B5CF6" />
                  <Text style={styles.statText}>{generatedPDF.concepts_count} conceptos</Text>
                </View>
                
                <View style={styles.statItem}>
                  <MaterialIcons name="insert-drive-file" size={16} color="#10B981" />
                  <Text style={styles.statText}>
                    {(generatedPDF.file_size_bytes / 1024).toFixed(1)} KB
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Botón para abrir el PDF */}
          <Pressable style={styles.openPDFButton} onPress={handleOpenPDF}>
            <LinearGradient 
              colors={["#EF4444", "#DC2626"]} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 1 }} 
              style={styles.openPDFGradient}
            >
              <MaterialIcons name="open-in-new" size={24} color="#FFFFFF" />
              <Text style={styles.openPDFButtonText}>Abrir PDF</Text>
            </LinearGradient>
          </Pressable>

          {/* Info adicional */}
          <View style={styles.infoBox}>
            <MaterialIcons name="info-outline" size={20} color="#6366F1" />
            <Text style={styles.infoText}>
              El PDF se ha guardado y está disponible para su descarga. 
              Contiene un resumen personalizado basado en los documentos de tu salón.
            </Text>
          </View>
        </View>
      )}
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
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
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
  pdfContainer: {
    gap: 20,
  },
  pdfCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  pdfIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  pdfInfo: {
    flex: 1,
    justifyContent: "center",
    gap: 12,
  },
  pdfTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 24,
  },
  pdfStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "600",
  },
  openPDFButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  openPDFGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  openPDFButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 20,
  },
})
