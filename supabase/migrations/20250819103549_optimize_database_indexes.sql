-- Optimización de índices para mejorar rendimiento de consultas
-- Basado en análisis de patrones de uso en querys-ventas.md

-- ============================================================================
-- TABLA HOMOLOGACIONVTA - Índices de optimización
-- ============================================================================

-- Índice para consultas GROUP BY mes, gpo (muy frecuente)
CREATE INDEX IF NOT EXISTS idx_homologacionvta_mes_gpo 
ON public."HOMOLOGACIONVTA" (mes, gpo) 
WHERE mes IS NOT NULL AND gpo IS NOT NULL;

-- Índice para consultas GROUP BY estado (mapa de Venezuela)
CREATE INDEX IF NOT EXISTS idx_homologacionvta_estado 
ON public."HOMOLOGACIONVTA" (estado) 
WHERE estado IS NOT NULL;

-- Índice para consultas GROUP BY gpo (gráficos de barras)
CREATE INDEX IF NOT EXISTS idx_homologacionvta_gpo 
ON public."HOMOLOGACIONVTA" (gpo) 
WHERE gpo IS NOT NULL;

-- Índice para consultas GROUP BY tipocliente
CREATE INDEX IF NOT EXISTS idx_homologacionvta_tipocliente 
ON public."HOMOLOGACIONVTA" (tipocliente) 
WHERE tipocliente IS NOT NULL;

-- Índice para consultas GROUP BY sku
CREATE INDEX IF NOT EXISTS idx_homologacionvta_sku 
ON public."HOMOLOGACIONVTA" (sku) 
WHERE sku IS NOT NULL;

-- Índice para consultas GROUP BY region
CREATE INDEX IF NOT EXISTS idx_homologacionvta_region 
ON public."HOMOLOGACIONVTA" (region) 
WHERE region IS NOT NULL;

-- Índice compuesto para filtros múltiples (región, grupo, tipo cliente)
CREATE INDEX IF NOT EXISTS idx_homologacionvta_region_gpo_tipocliente 
ON public."HOMOLOGACIONVTA" (region, gpo, tipocliente) 
WHERE region IS NOT NULL AND gpo IS NOT NULL AND tipocliente IS NOT NULL;

-- Índice para columnas de peso (optimiza SUM operations)
CREATE INDEX IF NOT EXISTS idx_homologacionvta_pesos 
ON public."HOMOLOGACIONVTA" (pesoanterior, pesoactual) 
WHERE pesoanterior IS NOT NULL OR pesoactual IS NOT NULL;

-- Índice para columnas de cajas (optimiza SUM operations)
CREATE INDEX IF NOT EXISTS idx_homologacionvta_cajas 
ON public."HOMOLOGACIONVTA" (cajasanterior, cajasactual) 
WHERE cajasanterior IS NOT NULL OR cajasactual IS NOT NULL;

-- Índice para ratio_act (usado en mapa de Venezuela)
CREATE INDEX IF NOT EXISTS idx_homologacionvta_ratio_act 
ON public."HOMOLOGACIONVTA" (ratio_act) 
WHERE ratio_act IS NOT NULL;

-- Índice para filtros DISTINCT más comunes
CREATE INDEX IF NOT EXISTS idx_homologacionvta_filtros_comunes 
ON public."HOMOLOGACIONVTA" (dep, marca, ver, presentacion) 
WHERE dep IS NOT NULL OR marca IS NOT NULL OR ver IS NOT NULL OR presentacion IS NOT NULL;

-- Índice para columna cat (consumo masivo) - usado en múltiples funciones
CREATE INDEX IF NOT EXISTS idx_homologacionvta_cat 
ON public."HOMOLOGACIONVTA" (cat) 
WHERE cat IS NOT NULL;

-- Índice para columna aliado - usado frecuentemente en filtros
CREATE INDEX IF NOT EXISTS idx_homologacionvta_aliado 
ON public."HOMOLOGACIONVTA" (aliado) 
WHERE aliado IS NOT NULL;

-- Índice para columna sucursal - usado en filtros
CREATE INDEX IF NOT EXISTS idx_homologacionvta_sucursal 
ON public."HOMOLOGACIONVTA" (sucursal) 
WHERE sucursal IS NOT NULL;

-- Índice compuesto para consultas con múltiples filtros (mes, aliado, marca)
CREATE INDEX IF NOT EXISTS idx_homologacionvta_mes_aliado_marca 
ON public."HOMOLOGACIONVTA" (mes, aliado, marca) 
WHERE mes IS NOT NULL AND aliado IS NOT NULL AND marca IS NOT NULL;

-- Índice compuesto para consultas con filtros de región y sucursal
CREATE INDEX IF NOT EXISTS idx_homologacionvta_region_sucursal 
ON public."HOMOLOGACIONVTA" (region, sucursal) 
WHERE region IS NOT NULL AND sucursal IS NOT NULL;

-- Índice para consultas que usan pesoactual > 0 (muy común en las RPC)
CREATE INDEX IF NOT EXISTS idx_homologacionvta_pesoactual_positivo 
ON public."HOMOLOGACIONVTA" (pesoactual) 
WHERE pesoactual > 0;

-- Índice para consultas que usan pesoanterior > 0
CREATE INDEX IF NOT EXISTS idx_homologacionvta_pesoanterior_positivo 
ON public."HOMOLOGACIONVTA" (pesoanterior) 
WHERE pesoanterior > 0;

-- Índice compuesto para sincronización (aliadoid, sucursalid) - usado en get_sincronizacion_ventas
CREATE INDEX IF NOT EXISTS idx_homologacionvta_aliado_sucursal_ids 
ON public."HOMOLOGACIONVTA" (aliadoid, sucursalid, aliado, sucursal);

-- Índice para upd (fecha de actualización) - usado en sincronización
CREATE INDEX IF NOT EXISTS idx_homologacionvta_upd 
ON public."HOMOLOGACIONVTA" (upd DESC) 
WHERE upd IS NOT NULL;

-- ============================================================================
-- TABLA HOMOLOGACIONACT - Índices de optimización
-- ============================================================================

-- Índice para consultas por tipo y mes (patrones comunes)
CREATE INDEX IF NOT EXISTS idx_homologacionact_tipo_mes 
ON public."HOMOLOGACIONACT" (tipo, mesid) 
WHERE tipo IS NOT NULL AND mesid IS NOT NULL;

-- Índice para consultas por región y estado
CREATE INDEX IF NOT EXISTS idx_homologacionact_region_estado 
ON public."HOMOLOGACIONACT" (regionid, estadoid) 
WHERE regionid IS NOT NULL AND estadoid IS NOT NULL;

-- Índice para columnas de años (optimiza consultas de activación)
CREATE INDEX IF NOT EXISTS idx_homologacionact_anos 
ON public."HOMOLOGACIONACT" (a2023, a2024, a2025, c2023, c2024, c2025);

-- Índice para promedios
CREATE INDEX IF NOT EXISTS idx_homologacionact_promedios 
ON public."HOMOLOGACIONACT" (prom2024, prom2025) 
WHERE prom2024 > 0 OR prom2025 > 0;

-- ============================================================================
-- ÍNDICES PARA SINCRONIZACIÓN Y PERFORMANCE GENERAL
-- ============================================================================

-- Optimizar consultas de sincronización por fecha
CREATE INDEX IF NOT EXISTS idx_homologacionvta_sync_date 
ON public."HOMOLOGACIONVTA" (last_sync_at DESC, sync_status) 
WHERE last_sync_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_homologacionact_sync_date 
ON public."HOMOLOGACIONACT" (last_sync_at DESC, sync_status) 
WHERE last_sync_at IS NOT NULL;

-- Índice para upd_sincro (usado en sincronización)
CREATE INDEX IF NOT EXISTS idx_homologacionvta_upd_sincro 
ON public."HOMOLOGACIONVTA" (upd_sincro DESC) 
WHERE upd_sincro > '1970-01-01 00:00:00';

CREATE INDEX IF NOT EXISTS idx_homologacionact_upd_sincro 
ON public."HOMOLOGACIONACT" (upd_sincro DESC) 
WHERE upd_sincro > '1970-01-01 00:00:00';

-- ============================================================================
-- ESTADÍSTICAS Y MANTENIMIENTO
-- ============================================================================

-- Actualizar estadísticas de las tablas para el optimizador de consultas
ANALYZE public."HOMOLOGACIONVTA";
ANALYZE public."HOMOLOGACIONACT";

-- Comentarios para documentación
COMMENT ON INDEX idx_homologacionvta_mes_gpo IS 'Optimiza consultas GROUP BY mes, gpo - usado en gráficos principales';
COMMENT ON INDEX idx_homologacionvta_estado IS 'Optimiza consultas del mapa de Venezuela';
COMMENT ON INDEX idx_homologacionvta_gpo IS 'Optimiza consultas GROUP BY gpo - gráficos de barras';
COMMENT ON INDEX idx_homologacionvta_tipocliente IS 'Optimiza consultas GROUP BY tipocliente';
COMMENT ON INDEX idx_homologacionvta_region_gpo_tipocliente IS 'Optimiza filtros múltiples en panel región-grupo-tipo';
COMMENT ON INDEX idx_homologacionvta_pesos IS 'Optimiza operaciones SUM en columnas de peso';
COMMENT ON INDEX idx_homologacionvta_sync_date IS 'Optimiza consultas de sincronización por fecha';
COMMENT ON INDEX idx_homologacionvta_cat IS 'Optimiza filtros por consumo masivo (cat)';
COMMENT ON INDEX idx_homologacionvta_aliado IS 'Optimiza filtros por aliado - muy usado en RPC functions';
COMMENT ON INDEX idx_homologacionvta_sucursal IS 'Optimiza filtros por sucursal';
COMMENT ON INDEX idx_homologacionvta_mes_aliado_marca IS 'Optimiza consultas con filtros múltiples mes+aliado+marca';
COMMENT ON INDEX idx_homologacionvta_pesoactual_positivo IS 'Optimiza consultas WHERE pesoactual > 0 - patrón muy común';
COMMENT ON INDEX idx_homologacionvta_aliado_sucursal_ids IS 'Optimiza get_sincronizacion_ventas GROUP BY';
COMMENT ON INDEX idx_homologacionvta_upd IS 'Optimiza consultas por fecha de actualización (upd)';