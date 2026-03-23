CREATE TABLE IF NOT EXISTS tareas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  completada BOOLEAN DEFAULT FALSE,
  urgencia TEXT DEFAULT 'media',
  categoria TEXT DEFAULT 'operaciones',
  tiempo_estimado TEXT DEFAULT '1 hora',
  vence_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve sus tareas"
  ON tareas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuario crea sus tareas"
  ON tareas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuario actualiza sus tareas"
  ON tareas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuario elimina sus tareas"
  ON tareas FOR DELETE
  USING (auth.uid() = user_id);

GRANT ALL ON TABLE public.tareas TO authenticated;

CREATE TABLE IF NOT EXISTS tareas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  completada BOOLEAN DEFAULT FALSE,
  vence_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve sus tareas"
  ON tareas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuario crea sus tareas"
  ON tareas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuario actualiza sus tareas"
  ON tareas FOR UPDATE
  USING (auth.uid() = user_id);

GRANT ALL ON TABLE public.tareas TO authenticated;

