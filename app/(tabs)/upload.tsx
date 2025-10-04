import { ThemedText } from '@/components/themed-text';
import UploadText from '@/components/upload-text';
import { router } from 'expo-router';
import { Button, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ModalScreen() {

  return (
    <SafeAreaView style={styles.container}>
      <ThemedText type="title">Aqui van a ir todas las formas de subir archivos</ThemedText>
      <UploadText />
      <Button title="Regresar" onPress={() => router.back()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});