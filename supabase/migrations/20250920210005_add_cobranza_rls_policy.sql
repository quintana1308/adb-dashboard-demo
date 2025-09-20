-- Crear política RLS para la tabla COBRANZA
CREATE POLICY "Allow authenticated users to read COBRANZA" ON "COBRANZA"
FOR SELECT TO authenticated
USING (true);
