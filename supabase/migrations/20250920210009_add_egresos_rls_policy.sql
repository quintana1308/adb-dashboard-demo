-- Crear política RLS para la tabla EGRESOS
CREATE POLICY "Allow authenticated users to read EGRESOS" ON "EGRESOS"
FOR SELECT TO authenticated
USING (true);
