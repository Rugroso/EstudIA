import MyClassroom from '@/components/my-classroom';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';

export default function MyClassroomScreen() {
    const router = useRouter();
    const handleVolverHome = () => {
        router.push('/');
    };
    
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable 
                    style={styles.backButton}
                    onPress={handleVolverHome}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                    <Text style={styles.backButtonText}>Volver al Inicio</Text>
                </Pressable>
            </View>
            
            <MyClassroom 
                onClassroomSelect={() => console.log('Leave class')}
            />
        </View>
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