CREATE TABLE IF NOT EXISTS analisis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  resultado JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE analisis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve sus análisis"
  ON analisis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuario crea sus análisis"
  ON analisis FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuario actualiza sus análisis"
  ON analisis FOR UPDATE
  USING (auth.uid() = user_id);

GRANT ALL ON TABLE public.analisis TO authenticated;

