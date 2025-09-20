-- Agregar política RLS para permitir lectura de la tabla RENTABILIDAD
-- Proyecto: ADN Dashboard Demo

-- Crear política para permitir SELECT a todos los roles
CREATE POLICY "Allow read access to RENTABILIDAD" ON public."RENTABILIDAD"
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Verificar que RLS esté habilitado (debería estar ya)
-- ALTER TABLE public."RENTABILIDAD" ENABLE ROW LEVEL SECURITY;
