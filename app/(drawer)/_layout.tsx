import { Ionicons } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
import { useLocalSearchParams, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useClassroom } from '@/context/ClassroomContext';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

function CustomDrawerContent() {
  const { logout, user } = useAuth();
  const { currentClassroom } = useClassroom();

  const handleLogout = async () => {
    if (Haptics?.impactAsync) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert("Cerrar sesión", "¿Estás seguro que deseas cerrar sesión?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            router.replace("/login");
          } catch (error) {
            Alert.alert("Error", "No se pudo cerrar sesión");
          }
        },
      },
    ]);
  };

  const menuItems = [
    { title: "Resumen", path: "/(drawer)/overview", icon: "analytics-outline" },
    { title: "EstudIA", path: "/(drawer)/estudia", icon: "school-outline" },
    { title: "Recursos", path: "/(drawer)/resources", icon: "library-outline" },
    { title: "Cubículo", path: "/(drawer)/(stackcubicle)", icon: "business-outline" },
    { title: "Subir Documentos", path: "/(drawer)/upload", icon: "cloud-upload-outline" },
  ];

  return (
    <View style={styles.drawerContainer}>
      <View style={styles.titleContainer}>
        <View style={styles.headerContainer}>
          <View style={styles.logoSection}>
            <Text style={styles.titleText}>EstudIA</Text>
          </View>
          {currentClassroom && (
            <Text style={styles.classroomText}>{currentClassroom.name}</Text>
          )}
        </View>

        <View>
          <View style={styles.divider} />
          {menuItems.map((item, index) => (
            <View key={index}>
              <TouchableOpacity 
                style={styles.menuItemContainer}
                onPress={() => {
                  if (Haptics?.impactAsync) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  if (item.path === "/homepage") {
                    router.replace("/homepage");
                  } else {
                    router.navigate(item.path as any);
                  }
                }}
              >
                <Ionicons name={item.icon as any} size={20} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.drawerItem}>{item.title}</Text>
              </TouchableOpacity>
              {index < menuItems.length - 1 && <View style={styles.dividerItems} />}
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.bottomButtons}>
        <Pressable
          onPress={() => {
            if (Haptics?.impactAsync) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            router.replace("/homepage");
          }}
          style={({ pressed }) => [styles.homeButton, pressed ? styles.homeButtonPressed : {}]}
        >
          <Ionicons name='home' size={20} color="#6366F1" />
          <Text style={styles.homeText}>← Regresar al Inicio</Text>
        </Pressable>
        
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [styles.logoutButton, pressed ? styles.logoutButtonPressed : {}]}
        >
          <Ionicons name='log-out-outline' size={20} color="white" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </Pressable>
      </View>
    </View>
  );
}

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
        headerStyle: {
          backgroundColor: '#0A0A0F',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(99, 102, 241, 0.2)',
        },
        headerTintColor: '#FFFFFF',
        headerTitle: headerTitle,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
      }}
      drawerContent={() => <CustomDrawerContent />}
    >
      <Drawer.Screen name="overview" />
      <Drawer.Screen name="estudia" />
      <Drawer.Screen name="resources" />
      <Drawer.Screen name="(stackcubicle)" />
      <Drawer.Screen name="upload" />
      <Drawer.Screen name="[classroomId]" />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
    backgroundColor: "#0A0A0F",
  },
  titleContainer: {
    marginTop: 40,
  },
  headerContainer: {
    marginBottom: 10,
  },
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  logoEmoji: {
    fontSize: 28,
  },
  titleText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  classroomText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(99, 102, 241, 0.3)",
    marginVertical: 15,
  },
  dividerItems: {
    height: 1,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    marginVertical: 10,
  },
  menuItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 12,
  },
  drawerItem: {
    fontSize: 16, 
    fontWeight: "600", 
    color: "#FFFFFF",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  logoutButtonPressed: {
    backgroundColor: "rgba(239, 68, 68, 0.8)",
  },
  logoutText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  bottomButtons: {
    gap: 12,
  },
  homeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  homeButtonPressed: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
  },
  homeText: {
    color: "#6366F1",
    fontSize: 16,
    fontWeight: "700",
  },
});
