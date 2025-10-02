import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="estudia"
        options={{
          title: 'EstudIA',
        }}
      />
      <Tabs.Screen
        name="resources"
        options={{
          title: 'Recursos',
        }}
      />
      <Tabs.Screen
        name="cubicle"
        options={{
          title: 'Cubículo',
        }}
      />
    </Tabs>
  );
}
