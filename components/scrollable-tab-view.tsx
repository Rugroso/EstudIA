import React from 'react';
import { ScrollView, ViewStyle, ScrollViewProps } from 'react-native';
import { useTabBarHeight } from '@/hooks/use-tab-bar-height';

interface ScrollableTabViewProps extends Omit<ScrollViewProps, 'contentContainerStyle'> {
  children: React.ReactNode;
  contentContainerStyle?: ViewStyle;
  style?: ViewStyle;
}

/**
 * Componente ScrollView que añade automáticamente el padding necesario 
 * para evitar que el tab bar tape el contenido
 */
export function ScrollableTabView({ 
  children, 
  contentContainerStyle, 
  style,
  ...scrollViewProps 
}: ScrollableTabViewProps) {
  const { scrollViewInset } = useTabBarHeight();

  return (
    <ScrollView
      style={[{ flex: 1 }, style]}
      contentContainerStyle={[
        { flexGrow: 1 },
        scrollViewInset.contentContainerStyle,
        contentContainerStyle
      ]}
      showsVerticalScrollIndicator={false}
      {...scrollViewProps}
    >
      {children}
    </ScrollView>
  );
}