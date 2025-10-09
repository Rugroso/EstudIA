import { Ionicons } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useClassroom } from '@/context/ClassroomContext';

import { Colors } from '@/constants/theme';

type DrawerIconProps = {
  color: string;
  size: number;
};

export default function DrawerLayout() {
  const { classroomId } = useLocalSearchParams();
  const { user } = useAuth();
  const { currentClassroom, loadClassroom } = useClassroom();
  const [classroomName, setClassroomName] = useState('EstudIA');

  useEffect(() => {
    if (classroomId && user) {
      loadClassroomData();
    } else if (!classroomId && currentClassroom) {
      setClassroomName(currentClassroom.name);
    } else {
      setClassroomName('EstudIA');
    }
  }, [classroomId, user, currentClassroom]);

  const loadClassroomData = async () => {
    try {
      if (typeof classroomId === 'string') {
        const success = await loadClassroom(classroomId);
        if (success && currentClassroom) {
          setClassroomName(currentClassroom.name);
        }
      }
    } catch (error) {
      console.error('Error loading classroom in drawer:', error);
    }
  };

  const isInClassroom = classroomId && typeof classroomId === 'string';
  const headerTitle = isInClassroom ? classroomName : 'EstudIA';

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
        headerTitle: headerTitle,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
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
      <Drawer.Screen
        name="[classroomId]"
        options={{
          drawerItemStyle: { display: 'none' }, // Ocultar en drawer ya que es dinámico
        }}
      />
    </Drawer>
  );
}
