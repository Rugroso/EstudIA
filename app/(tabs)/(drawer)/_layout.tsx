import { Ionicons } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
import React from 'react';

import { Colors } from '@/constants/theme';

type DrawerIconProps = {
  color: string;
  size: number;
};

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        drawerActiveTintColor: Colors.dark.tint,
        drawerInactiveTintColor: Colors.dark.text,
        drawerStyle: {
          backgroundColor: Colors.dark.background,
        },
        headerStyle: {
          backgroundColor: Colors.dark.background,
        },
        headerTintColor: Colors.dark.text,
      }}>
      <Drawer.Screen
        name="overview"
        options={{
          title: 'Resumen',
          drawerIcon: ({ color, size }: DrawerIconProps) => (
            <Ionicons name="analytics-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="estudia"
        options={{
          title: 'EstudIA',
          drawerIcon: ({ color, size }: DrawerIconProps) => (
            <Ionicons name="school-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="resources"
        options={{
          title: 'Recursos',
          drawerIcon: ({ color, size }: DrawerIconProps) => (
            <Ionicons name="library-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="cubicle"
        options={{
          title: 'Cubículo',
          drawerIcon: ({ color, size }: DrawerIconProps) => (
            <Ionicons name="business-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}
