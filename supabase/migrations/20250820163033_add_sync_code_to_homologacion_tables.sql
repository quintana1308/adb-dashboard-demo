-- Agregar campo sync_code a las tablas HOMOLOGACIONVTA y HOMOLOGACIONACT
-- Este campo almacenará un código único generado en cada sincronización
-- para identificar qué registros fueron sincronizados en cada proceso

-- Agregar sync_code a la tabla HOMOLOGACIONVTA
ALTER TABLE "HOMOLOGACIONVTA"
ADD COLUMN IF NOT EXISTS sync_code TEXT;

-- Agregar sync_code a la tabla HOMOLOGACIONACT
ALTER TABLE "HOMOLOGACIONACT" 
ADD COLUMN IF NOT EXISTS sync_code TEXT;

-- Crear índices para mejorar el rendimiento de consultas por sync_code
CREATE INDEX IF NOT EXISTS idx_homologacionvta_sync_code ON "HOMOLOGACIONVTA" (sync_code);
CREATE INDEX IF NOT EXISTS idx_homologacionact_sync_code ON "HOMOLOGACIONACT" (sync_code);

-- Comentarios para documentar el propósito del campo
COMMENT ON COLUMN "HOMOLOGACIONVTA".sync_code IS 'Código único generado en cada sincronización para identificar registros sincronizados';
COMMENT ON COLUMN "HOMOLOGACIONACT".sync_code IS 'Código único generado en cada sincronización para identificar registros sincronizados';