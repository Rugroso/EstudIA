import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Redirect } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

export default function Homepage() {
  const [showTabs, setShowTabs] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleEnterApp = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowTabs(true);
    });
  };

  if (showTabs) {
    return <Redirect href="/(tabs)/study" />;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText style={styles.title}>EstudIA</ThemedText>
          <ThemedText style={styles.subtitle}>
            App colaborativa de estudio con IA
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.content}>
          <ThemedText style={styles.description}>
            Bienvenido a EstudIA, Aqui te van a salir diferentes salones, crear salon, unirte, configuracion
          </ThemedText>

          <Pressable 
            style={({ pressed }) => [
              styles.enterButton,
              { opacity: pressed ? 0.8 : 1 }
            ]}
            onPress={handleEnterApp}
          >
            <Text style={styles.enterButtonText}>Ir a x salon (Matematicas)</Text>
          </Pressable>


          <ThemedView style={styles.footer}>
            <ThemedText style={styles.footerText}>
              Desarrollado con ❤️ para estudiantes
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    opacity: 0.8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  enterButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 40,
  },
  enterButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  features: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  featureItem: {
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
});