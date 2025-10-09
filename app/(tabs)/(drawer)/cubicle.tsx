import { ScrollableTabView } from '@/components/scrollable-tab-view';
import { StyleSheet, Text, View } from 'react-native';
import { useClassroom } from '@/context/ClassroomContext';
import { MaterialIcons } from '@expo/vector-icons';

export default function CubicleScreen() {
  const { currentClassroom } = useClassroom();

  return (
    <ScrollableTabView contentContainerStyle={styles.container}>
      {currentClassroom ? (
        <View style={styles.content}>
          <View style={styles.header}>
            <MaterialIcons name="group" size={48} color="#FF9500" />
            <Text style={styles.headerTitle}>Cubículo - {currentClassroom.name}</Text>
            <Text style={styles.headerSubtitle}>Estudia con compañeros en tiempo real</Text>
          </View>
          
          <View style={styles.comingSoon}>
            <MaterialIcons name="construction" size={64} color="#666" />
            <Text style={styles.comingSoonTitle}>¡Próximamente!</Text>
            <Text style={styles.comingSoonText}>
              Aquí podrás estudiar con tus compañeros de clase en tiempo real,
              compartir notas, hacer videoconferencias y colaborar en proyectos.
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.noClassroom}>
          <MaterialIcons name="group-off" size={64} color="#666" />
          <Text style={styles.noClassroomText}>Selecciona un salón para acceder al cubículo</Text>
        </View>
      )}
    </ScrollableTabView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
    padding: 20,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FF9500',
    opacity: 0.8,
    textAlign: 'center',
  },
  comingSoon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  comingSoonTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
    marginBottom: 16,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  noClassroom: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  noClassroomText: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.6,
    textAlign: 'center',
  },
});