import CreateClassroom from '@/components/create-classroom';
import { ScrollableTabView } from '@/components/scrollable-tab-view';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function CreateClassroomPage() {
  const handleSuccess = (classroom: any) => {
    router.push(`/(tabs)/(drawer)/estudia`);
    console.log('Classroom created successfully:', classroom);
  };

  const handleCancel = () => {
    router.push('/');
  };

  return (
    <ScrollableTabView contentContainerStyle={styles.container}>
      <CreateClassroom 
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