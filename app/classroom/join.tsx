import JoinClassroom from '@/components/join-classroom';
import { ScrollableTabView } from '@/components/scrollable-tab-view';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { View, Pressable, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function JoinClassroomPage() {
  const handleSuccess = (classroom: any) => {
    console.log('Successfully joined classroom:', classroom);
  };

  const handleCancel = () => {
    router.push('/');
  };

  return (
    <ScrollableTabView contentContainerStyle={styles.container}>
      <View style={styles.header}>
                <Pressable 
                    style={styles.backButton}
                    onPress={handleCancel}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                    <Text style={styles.backButtonText}>Volver al Inicio</Text>
                </Pressable>
            </View>
      <JoinClassroom 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </ScrollableTabView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  header: {
        padding: 10,
        paddingTop: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(99, 102, 241, 0.2)',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.3)',
        alignSelf: 'flex-start',
    },
    backButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
});