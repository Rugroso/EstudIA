import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function TabsLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DarkTheme}>
      <NativeTabs>
        <NativeTabs.Trigger name="study" />
        <NativeTabs.Trigger name="upload"/>
      </NativeTabs>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}