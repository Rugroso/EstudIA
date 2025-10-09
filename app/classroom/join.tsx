import JoinClassroom from '@/components/join-classroom';
import { ScrollableTabView } from '@/components/scrollable-tab-view';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function JoinClassroomPage() {
  const handleSuccess = (classroom: any) => {
    console.log('Successfully joined classroom:', classroom);
  };

  const handleCancel = () => {
    router.push('/');
  };

  return (
    <ScrollableTabView contentContainerStyle={styles.container}>
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
  },
});