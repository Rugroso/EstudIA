import React, { createContext, useContext, useMemo, useState } from 'react';

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
  selectedClassroom: Classroom | null;
  setSelectedClassroom: (c: Classroom | null) => void;
};

const ClassroomContext = createContext<ClassroomContextType | undefined>(undefined);

export function ClassroomProvider({ children }: { children: React.ReactNode }) {
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);

  const value = useMemo(() => ({ selectedClassroom, setSelectedClassroom }), [selectedClassroom]);

  return (
    <ClassroomContext.Provider value={value}>{children}</ClassroomContext.Provider>
  );
}

export function useClassroom() {
  const ctx = useContext(ClassroomContext);
  if (!ctx) throw new Error('useClassroom must be used within a ClassroomProvider');
  return ctx;
}
