import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import UploadText from '@/components/upload-text';
import { StyleSheet, ScrollView } from 'react-native';

export default function UploadScreen() {
  return (
    <ScrollView
      contentContainerStyle={{ 
        flexGrow: 1,
        padding: 20,
      }}
    >
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Agregar contenido al salón
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Escribe o pega tu contenido para crear embeddings y agregar conocimiento al salón actual.
        </ThemedText>

        <UploadText />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    color: '#FFFFFF',
    lineHeight: 24,
  },
});