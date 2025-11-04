-- Habilitar la extensión de vectores si no está habilitada
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabla para documentos con embeddings
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(768), -- Gemini text-embedding-004 usa 768 dimensiones
  file_path TEXT, -- Ruta en Storage si es un archivo
  file_name TEXT, -- Nombre original del archivo
  file_type VARCHAR(50), -- 'text', 'pdf', 'image'
  metadata JSONB, -- Información adicional (tamaño, páginas, etc)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_documents_classroom_id ON documents(classroom_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_file_type ON documents(file_type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

-- Índice para búsqueda por similitud de vectores (HNSW es más rápido que IVFFlat)
CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents 
USING hnsw (embedding vector_cosine_ops);

-- RLS (Row Level Security)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para documents
CREATE POLICY "Users can view documents from their classrooms" ON documents
  FOR SELECT USING (
    classroom_id IN (
      SELECT classroom_id FROM classroom_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create documents in their classrooms" ON documents
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    classroom_id IN (
      SELECT classroom_id FROM classroom_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own documents" ON documents
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own documents" ON documents
  FOR DELETE USING (user_id = auth.uid());

-- Trigger para actualizar updated_at
CREATE TRIGGER update_documents_updated_at 
  BEFORE UPDATE ON documents 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para buscar documentos similares
CREATE OR REPLACE FUNCTION search_documents(
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  p_classroom_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  file_name TEXT,
  file_type VARCHAR,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    d.file_name,
    d.file_type,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM documents d
  WHERE 
    (p_classroom_id IS NULL OR d.classroom_id = p_classroom_id)
    AND d.embedding IS NOT NULL
    AND 1 - (d.embedding <=> query_embedding) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Comentarios para documentación
COMMENT ON TABLE documents IS 'Almacena documentos con sus embeddings para búsqueda semántica';
COMMENT ON COLUMN documents.embedding IS 'Vector de embedding generado por Gemini (768 dimensiones)';
COMMENT ON COLUMN documents.file_path IS 'Ruta del archivo en Supabase Storage';
COMMENT ON FUNCTION search_documents IS 'Busca documentos similares usando similitud de coseno';
