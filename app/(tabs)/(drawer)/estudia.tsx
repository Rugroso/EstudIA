import Search from '@/components/search';
import { ScrollableTabView } from '@/components/scrollable-tab-view';
import { StyleSheet, Text, View } from 'react-native';
import { useClassroom } from '@/context/ClassroomContext';

export default function EstudiaScreen() {
  const { currentClassroom } = useClassroom();
  
  return (
    <ScrollableTabView contentContainerStyle={styles.container}>
      {currentClassroom ? (
        <>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>EstudIA - {currentClassroom.name}</Text>
            <Text style={styles.headerSubtitle}>Inteligencia artificial para tu aprendizaje</Text>
          </View>
          <Search />
        </>
      ) : (
        <View style={styles.noClassroom}>
          <Text style={styles.noClassroomText}>Selecciona un salón para comenzar</Text>
        </View>
      )}
    </ScrollableTabView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16,
    backgroundColor: '#18181b'
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#007AFF',
    opacity: 0.8,
  },
  noClassroom: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noClassroomText: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.6,
    textAlign: 'center',
  },
});
