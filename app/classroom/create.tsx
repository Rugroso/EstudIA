import CreateClassroom from '@/components/create-classroom';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function CreateClassroomPage() {
  const handleSuccess = (classroom: any) => {
    router.push(`/(tabs)/(drawer)/estudia`);
    console.log('Classroom created successfully:', classroom);
  };

  const handleCancel = () => {
    router.push('/');
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