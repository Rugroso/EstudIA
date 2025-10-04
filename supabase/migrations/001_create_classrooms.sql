-- Tabla para los salones de clase
CREATE TABLE IF NOT EXISTS classrooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  subject VARCHAR(50) NOT NULL,
  description TEXT,
  code VARCHAR(6) UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Tabla para los miembros de los salones
CREATE TABLE IF NOT EXISTS classroom_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(classroom_id, user_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_classrooms_code ON classrooms(code);
CREATE INDEX IF NOT EXISTS idx_classrooms_created_by ON classrooms(created_by);
CREATE INDEX IF NOT EXISTS idx_classroom_members_classroom_id ON classroom_members(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_members_user_id ON classroom_members(user_id);

-- RLS (Row Level Security) para seguridad
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_members ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para classrooms
CREATE POLICY "Users can view classrooms they are members of" ON classrooms
  FOR SELECT USING (
    id IN (
      SELECT classroom_id FROM classroom_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create classrooms" ON classrooms
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update their classrooms" ON classrooms
  FOR UPDATE USING (
    id IN (
      SELECT classroom_id FROM classroom_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas de seguridad para classroom_members
CREATE POLICY "Users can view members of their classrooms" ON classroom_members
  FOR SELECT USING (
    classroom_id IN (
      SELECT classroom_id FROM classroom_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can add members to their classrooms" ON classroom_members
  FOR INSERT WITH CHECK (
    classroom_id IN (
      SELECT classroom_id FROM classroom_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can join classrooms" ON classroom_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en classrooms
CREATE TRIGGER update_classrooms_updated_at 
  BEFORE UPDATE ON classrooms 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos de ejemplo (opcional)
-- INSERT INTO classrooms (name, subject, description, code, created_by) 
-- VALUES ('Matemáticas Avanzadas', 'Cálculo', 'Grupo de estudio para cálculo diferencial e integral', 'MATH01', auth.uid());