import MyClassroom from '@/components/my-classroom';
import { useRouter } from 'expo-router';
import { Button, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

export default function MyClassroomScreen() {
    const router = useRouter();
    const handleVolverHome = () => {
        router.push('/');
    };
        return (
            <ScrollView>
                
                <Button
                    title="Volver al Inicio"
                    onPress={handleVolverHome}
                    color="#444"
                />
                <MyClassroom 
                    onClassroomSelect={() => console.log('Leave class')}
                />
                
            </ScrollView>
            
        );
    }


const styles = {
    button: {
      padding: 15,
      borderRadius: 8,
      alignItems: 'center' as const,
      marginTop: 20,
    },
    backButton: {   
        backgroundColor: '#444',
    },
    buttonTextBack: {
        color: '#fff',
        fontWeight: "bold",
        fontSize: 16,
    },
  };