import MyClassroom from '@/components/my-classroom';
import { useRouter } from 'expo-router';
import { Button, View } from 'react-native';

export default function MyClassroomScreen() {
    const router = useRouter();
    const handleVolverHome = () => {
        router.push('/');
    };
        return (
            <View >
                <MyClassroom />
                <Button
                    title="Volver al Inicio"
                    onPress={handleVolverHome}
                    color="#444"
                />
                
            </View>
            
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