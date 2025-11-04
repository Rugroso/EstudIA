import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

interface Classroom {
  id: string;
  name: string;
  subject: string;
  description?: string;
  code: string;
  created_by: string;
  is_active: boolean;
  created_at: string;
}

interface ClassroomContextType {
  currentClassroom: Classroom | null;
  setCurrentClassroom: (classroom: Classroom | null) => void;
  loadClassroom: (id: string) => Promise<boolean>;
  clearCurrentClassroom: () => void;
  getSavedClassroomId: () => Promise<string | null>;
  loading: boolean;
}

const ClassroomContext = createContext<ClassroomContextType | undefined>(undefined);

export function ClassroomProvider({ children }: { children: React.ReactNode }) {
  const [currentClassroom, setCurrentClassroom] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(false);

  // Cargar salón desde AsyncStorage al inicializar
  useEffect(() => {
    loadSavedClassroom();
  }, []);

  const loadSavedClassroom = async () => {
    try {
      const savedClassroomId = await AsyncStorage.getItem('currentClassroomId');
      if (savedClassroomId) {
        await loadClassroom(savedClassroomId);
      }
    } catch (error) {
      console.error('Error loading saved classroom:', error);
    }
  };

  const getSavedClassroomId = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem('currentClassroomId');
    } catch (error) {
      console.error('Error getting saved classroom ID:', error);
      return null;
    }
  };

  const loadClassroom = async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('classrooms')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('Error loading classroom:', error);
        setCurrentClassroom(null);
        await AsyncStorage.removeItem('currentClassroomId');
        return false;
      }
      
      setCurrentClassroom(data);
      await AsyncStorage.setItem('currentClassroomId', id);
      return true;
    } catch (error) {
      console.error('Error loading classroom:', error);
      setCurrentClassroom(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearCurrentClassroom = async () => {
    setCurrentClassroom(null);
    await AsyncStorage.removeItem('currentClassroomId');
  };

  return (
    <ClassroomContext.Provider value={{
      currentClassroom,
      setCurrentClassroom,
      loadClassroom,
      clearCurrentClassroom,
      getSavedClassroomId,
      loading
    }}>
      {children}
    </ClassroomContext.Provider>
  );
}

export function useClassroom() {
  const context = useContext(ClassroomContext);
  if (context === undefined) {
    throw new Error('useClassroom must be used within a ClassroomProvider');
  }
  return context;
}