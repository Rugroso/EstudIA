import CreateClassroom from '@/components/create-classroom';
import { router } from 'expo-router';
import { StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { View, Pressable, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function CreateClassroomPage() {
  const handleSuccess = (classroom: any) => {
    router.push(`/(drawer)?classroomId=${classroom.id}`);
    console.log('Classroom created successfully:', classroom);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
                  <Pressable 
                      style={styles.backButton}
                      onPress={handleCancel}
                  >
                      <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                      <Text style={styles.backButtonText}>Volver al Inicio</Text>
                  </Pressable>
              </View>
        <CreateClassroom 
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  container: {
    flexGrow: 1,
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