import CreateClassroom from '@/components/create-classroom';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function CreateClassroomPage() {
  const handleSuccess = (classroom: any) => {
    console.log('Classroom created successfully:', classroom);
    // Opcional: hacer algo adicional cuando se crea el salón
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <CreateClassroom 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});