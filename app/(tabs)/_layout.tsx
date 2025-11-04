import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: '(tabs)',
};

const isWeb = Platform.OS === 'web';

export default function TabsLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <NativeTabs>
        <NativeTabs.Trigger name="(drawer)">
          <Label>Estudiar</Label>
          {Platform.select({
            ios: <Icon sf={{ default: "book", selected: "book.fill" }} />,
            android: <Icon src={<VectorIcon family={MaterialIcons} name="school" />} />,
            web: <VectorIcon family={MaterialIcons} name="school" />,
          })}
        </NativeTabs.Trigger>
        {!isWeb ? (
          <NativeTabs.Trigger name="upload">
            <Label>Subir</Label>
            {Platform.select({
              ios: <Icon sf={{ default: "icloud.and.arrow.up", selected: "icloud.and.arrow.up.fill" }} />,
              android: <Icon src={<VectorIcon family={MaterialIcons} name="cloud-upload" />} />,
            })}
          </NativeTabs.Trigger>
        ) : (
          <NativeTabs.Trigger name="upload">
            <Label>Subir Datos</Label>
            <VectorIcon family={MaterialIcons} name="cloud-upload" />
          </NativeTabs.Trigger>
        )}
      </NativeTabs>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}