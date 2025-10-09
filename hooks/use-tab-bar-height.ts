import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Hook para obtener la altura del tab bar y evitar que tape el contenido
 * Úsalo en tus componentes para agregar padding bottom automáticamente
 */
export function useTabBarHeight() {
  const insets = useSafeAreaInsets();
  
  const tabBarHeight = Platform.select({
    ios: 49 + insets.bottom, // Altura estándar del tab bar iOS + safe area
    android: 56, // Altura estándar del tab bar Android
    web: 60, // Altura personalizada para web
    default: 56,
  });

  const contentInset = {
    paddingBottom: tabBarHeight,
  };

  const scrollViewInset = {
    contentInsetAdjustmentBehavior: 'automatic' as const,
    contentContainerStyle: {
      paddingBottom: tabBarHeight,
    },
  };

  return {
    tabBarHeight,
    contentInset,
    scrollViewInset,
  };
}