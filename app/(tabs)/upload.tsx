import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import UploadText from '@/components/upload-text';
import { StyleSheet } from 'react-native';

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Aqui van a ir todas las formas de subir archivos</ThemedText>
      <UploadText />
    </ThemedView>
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