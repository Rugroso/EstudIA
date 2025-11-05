import Search from '@/components/search';
import { ScrollableTabView } from '@/components/scrollable-tab-view';
import { StyleSheet, Text, View } from 'react-native';
import { useClassroom } from '@/context/ClassroomContext';
import { MaterialIcons } from '@expo/vector-icons';

export default function EstudiaScreen() {
  const { currentClassroom } = useClassroom();
  
  return (
    <ScrollableTabView contentContainerStyle={styles.container}>
      {currentClassroom ? (
        <>
          <View style={styles.header}>
            <MaterialIcons name="border-color" size={48} color="#FFF" />
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
    padding: 20,
    backgroundColor: '#0A0A0F'
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
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  noClassroom: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0F',
  },
  noClassroomText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});
