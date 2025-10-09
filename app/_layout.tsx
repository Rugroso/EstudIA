// 👇 Este import DEBE ir antes que todo lo que use gestos
import "react-native-gesture-handler";

import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider } from "../context/AuthContext";
import { ClassroomProvider } from "../context/ClassroomContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DarkTheme}>
        <AuthProvider>
          <ClassroomProvider>
            <SafeAreaProvider>
              <Stack screenOptions={{ headerShown: false }}>
                {/* index existe por default */}
                <Stack.Screen name="index" />
                {/* (tabs) es un route group válido */}
                <Stack.Screen name="(tabs)" />
                {/* <Stack.Screen name="classroom" /> */}
              </Stack>
            </SafeAreaProvider>
            <StatusBar style="light" />
          </ClassroomProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
