import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTabBarHeight } from '@/hooks/use-tab-bar-height';

interface TabSafeViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Componente wrapper que añade automáticamente el padding necesario 
 * para evitar que el tab bar tape el contenido
 */
export function TabSafeView({ children, style }: TabSafeViewProps) {
  const { contentInset } = useTabBarHeight();

  return (
    <View style={[{ flex: 1 }, contentInset, style]}>
      {children}
    </View>
  );
}