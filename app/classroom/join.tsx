import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ClassroomPage() {
  const [salonName, setSalonName] = useState('');
  const [codigoSalon, setCodigoSalon] = useState('');

  const handleCrearSalon = () => {
    // Aquí implementarías la lógica para crear un salón
    console.log('Crear salón:', salonName);
    // Por ahora redirigir a las tabs de estudio
    router.push('/(tabs)/upload');
  };

  const handleVolverHome = () => {
    router.push('/');
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedView style={styles.header}>
          <ThemedText style={styles.title}>🏫 Gestión de Salones</ThemedText>
          <ThemedText style={styles.subtitle}>
            Crea un nuevo salón de estudio colaborativo
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.formContainer}>
          <ThemedText style={styles.sectionTitle}>Crear Nuevo Salón</ThemedText>
          
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Nombre del Salón</ThemedText>
            <TextInput
              style={styles.input}
              value={salonName}
              onChangeText={setSalonName}
              placeholder="ej: Matemáticas Avanzadas"
              placeholderTextColor="#666"
            />
          </View>

          <Pressable 
            style={[styles.button, styles.primaryButton]}
            onPress={handleCrearSalon}
          >
            <Text style={styles.buttonText}>✨ Crear Salón</Text>
          </Pressable>
        </ThemedView>

        <ThemedView style={styles.divider} />

        <ThemedView style={styles.formContainer}>
          <ThemedText style={styles.sectionTitle}>Unirse a Salón Existente</ThemedText>
          
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Código del Salón</ThemedText>
            <TextInput
              style={styles.input}
              value={codigoSalon}
              onChangeText={setCodigoSalon}
              placeholder="Ingresa el código de 6 dígitos"
              placeholderTextColor="#666"
              maxLength={6}
            />
          </View>

          <Pressable 
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.push('/(tabs)/upload')}
          >
            <Text style={styles.buttonTextSecondary}>🚪 Unirse al Salón</Text>
          </Pressable>
        </ThemedView>

        <Pressable 
          style={[styles.button, styles.backButton]}
          onPress={handleVolverHome}
        >
          <Text style={styles.buttonTextBack}>← Volver al Inicio</Text>
        </Pressable>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 10,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonTextBack: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 20,
  },
});