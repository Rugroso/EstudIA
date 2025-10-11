import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from "../context/AuthContext";
import { ClassroomProvider } from "../context/ClassroomContext";


export default function RootLayout() {

  return (
    <ThemeProvider value={DarkTheme}>
      <AuthProvider>
      <ClassroomProvider>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="classroom" />
        </Stack>
      </SafeAreaProvider>
      <StatusBar style="light" />
      </ClassroomProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
