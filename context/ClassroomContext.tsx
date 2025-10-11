import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export type Classroom = {
  id: string;
  name: string;
  subject: string;
  description?: string | null;
  code: string;
  created_by: string;
  created_at: string;
  is_active: boolean;
  // Optional extras often used in UI lists
  role?: 'admin' | 'member';
  member_count?: number;
  joined_at?: string;
};

type ClassroomContextType = {
  // Nuevo API usado en drawer/overview
  currentClassroom: Classroom | null;
  loadClassroom: (id: string) => Promise<boolean>;
  getSavedClassroomId: () => Promise<string | null>;
  setCurrentClassroom: (c: Classroom | null) => Promise<void>;
  // Compatibilidad hacia atrás con código existente
  selectedClassroom: Classroom | null;
  setSelectedClassroom: (c: Classroom | null) => void;
};

const ClassroomContext = createContext<ClassroomContextType | undefined>(undefined);

export function ClassroomProvider({ children }: { children: React.ReactNode }) {
  const [selectedClassroom, _setSelectedClassroom] = useState<Classroom | null>(null);

  const STORAGE_KEY = 'estudia.currentClassroomId';

  // Persistencia multiplataforma simple
  const saveId = async (id: string | null) => {
    try {
      if (Platform.OS === 'web') {
        if (id) window.localStorage.setItem(STORAGE_KEY, id);
        else window.localStorage.removeItem(STORAGE_KEY);
      } else {
        if (id) await AsyncStorage.setItem(STORAGE_KEY, id);
        else await AsyncStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  };

  const getSavedClassroomId = async (): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') return window.localStorage.getItem(STORAGE_KEY);
      return await AsyncStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  };

  const setCurrentClassroom = async (c: Classroom | null) => {
    _setSelectedClassroom(c);
    await saveId(c?.id ?? null);
  };

  // Carga por id desde Supabase y fija en contexto
  const loadClassroom = async (id: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('classrooms')
        .select('id,name,subject,description,code,created_by,created_at,is_active')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) return false;
      await setCurrentClassroom(data as Classroom);
      return true;
    } catch {
      return false;
    }
  };

  // Compatibilidad API anterior
  const setSelectedClassroom = (c: Classroom | null) => {
    void setCurrentClassroom(c);
  };

  const currentClassroom = selectedClassroom;

  const value: ClassroomContextType = useMemo(
    () => ({
      currentClassroom,
      loadClassroom,
      getSavedClassroomId,
      setCurrentClassroom,
      selectedClassroom,
      setSelectedClassroom,
    }),
    [currentClassroom]
  );

  return (
    <ClassroomContext.Provider value={value}>{children}</ClassroomContext.Provider>
  );
}

export function useClassroom() {
  const ctx = useContext(ClassroomContext);
  if (!ctx) throw new Error('useClassroom must be used within a ClassroomProvider');
  return ctx;
}
