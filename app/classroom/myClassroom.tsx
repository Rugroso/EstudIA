import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function MyClassroom() {
    const router = useRouter();
    const handleVolverHome = () => {
        router.push('/');
    };
        return (
            <View >
                <Text>My Classroom Screen</Text>
                <Pressable 
                          style={[styles.button, styles.backButton]}
                          onPress={handleVolverHome}
                        >
                          <Text style={styles.buttonTextBack}>← Volver al Inicio</Text>
                        </Pressable>
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