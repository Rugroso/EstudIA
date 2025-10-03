import { router } from 'expo-router';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function ClassroomOverview() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido a Matematicas</Text>
       <Text style={styles.title} >Aqui va a estar un overview de contenido de la clase</Text>
      <Text style={styles.title}>Tipo companeros, posts o nose</Text>
      <Button title="Regresar" onPress={() => router.push('/')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16,
    backgroundColor: '#18181b'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
});
