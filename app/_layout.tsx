import "react-native-gesture-handler";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "../context/AuthContext";
import { ClassroomProvider } from "../context/ClassroomContext";
import { KeyboardAvoidingView } from "react-native";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DarkTheme}>
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0A0A0F' }} behavior="padding">
        <AuthProvider>
          <ClassroomProvider>
            <SafeAreaProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
              </Stack>
            </SafeAreaProvider>
            <StatusBar style="light" />
          </ClassroomProvider>
        </AuthProvider>
        </KeyboardAvoidingView>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
