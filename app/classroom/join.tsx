import JoinClassroom from '@/components/join-classroom';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function JoinClassroomPage() {
  const handleSuccess = (classroom: any) => {
    console.log('Successfully joined classroom:', classroom);
  };

  const handleCancel = () => {
    router.push('/');
  };

  return (
    <View style={styles.container}>
      <JoinClassroom 
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