import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { Client } from "https://deno.land/x/mysql@v2.12.1/mod.ts";
// Configuración de conexión MySQL
const MYSQL_CONFIG = {
  hostname: '198.251.71.50',
  port: 3306,
  db: 'purolomo',
  username: 'purolomoDash',
  password: '13@v2Mqk6'
};
// Crear cliente Supabase
const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
// Función para generar hash determinista usando TODAS las columnas
function generateRecordHash(record, primaryKeys) {
  // Crear string con TODOS los valores del registro (excluyendo campos de control)
  const excludeFields = [
    'sync_hash',
    'last_sync_at',
    'sync_status'
  ];
  const allValues = Object.keys(record).filter((key)=>!excludeFields.includes(key)).sort() // Ordenar para consistencia
  .map((key)=>`${key}:${String(record[key] || '')}`).join('|');
  // Generar hash determinista usando algoritmo de hash de string
  let hash = 0;
  for(let i = 0; i < allValues.length; i++){
    const char = allValues.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convertir a 32-bit integer
  }
  // Crear hash secundario para más variabilidad
  let hash2 = 5381;
  for(let i = 0; i < allValues.length; i++){
    hash2 = (hash2 << 5) + hash2 + allValues.charCodeAt(i);
  }
  // Combinar ambos hashes y convertir a hexadecimal
  const hashStr1 = Math.abs(hash).toString(16).padStart(8, '0');
  const hashStr2 = Math.abs(hash2).toString(16).padStart(8, '0');
  // Crear hash final de 32 caracteres
  const finalHash = (hashStr1 + hashStr2 + allValues.length.toString(16).padStart(16, '0')).substring(0, 32);
  return finalHash;
}
// Mapeo de esquemas por tabla
const TABLE_SCHEMAS = {
  'HOMOLOGACIONACT': {
    type: 'ACT',
    primaryKey: [
      'aliadoid',
      'sucursalid',
      'tipo',
      'mesid',
      'codigo'
    ],
    upsertKey: 'sync_hash',
    columns: [
      'aliadoid',
      'aliado',
      'sucursalid',
      'sucursal',
      'regionid',
      'region',
      'estadoid',
      'estado',
      'tipo',
      'mesid',
      'mes',
      'codigo',
      'descri',
      'a2023',
      'c2023',
      'a2024',
      'c2024',
      'a2025',
      'c2025',
      'prom2024',
      'prom2025',
      'upd_sincro',
      'sync_hash',
      'last_sync_at',
      'sync_status'
    ]
  },
  'HOMOLOGACIONACT_P21': {
    type: 'ACT',
    primaryKey: [
      'aliadoid',
      'sucursalid',
      'tipo',
      'mesid',
      'codigo'
    ],
    upsertKey: 'sync_hash',
    columns: [
      'aliadoid',
      'aliado',
      'sucursalid',
      'sucursal',
      'regionid',
      'region',
      'estadoid',
      'estado',
      'tipo',
      'mesid',
      'mes',
      'codigo',
      'descri',
      'a2023',
      'c2023',
      'a2024',
      'c2024',
      'a2025',
      'c2025',
      'prom2024',
      'prom2025',
      'upd_sincro',
      'sync_hash',
      'last_sync_at',
      'sync_status'
    ]
  },
  'HOMOLOGACIONACT_P22': {
    type: 'ACT',
    primaryKey: [
      'aliadoid',
      'sucursalid',
      'tipo',
      'mesid',
      'codigo'
    ],
    upsertKey: 'sync_hash',
    columns: [
      'aliadoid',
      'aliado',
      'sucursalid',
      'sucursal',
      'regionid',
      'region',
      'estadoid',
      'estado',
      'tipo',
      'mesid',
      'mes',
      'codigo',
      'descri',
      'a2023',
      'c2023',
      'a2024',
      'c2024',
      'a2025',
      'c2025',
      'prom2024',
      'prom2025',
      'upd_sincro',
      'sync_hash',
      'last_sync_at',
      'sync_status'
    ]
  },
  'HOMOLOGACIONVTA': {
    type: 'VTA',
    primaryKey: [
      'mesid',
      'aliadoid',
      'sucursalid',
      'skuid'
    ],
    upsertKey: 'sync_hash',
    columns: [
      'mesid',
      'mes',
      'estadoid',
      'estado',
      'aliadoid',
      'aliado',
      'sucursalid',
      'sucursal',
      'regionid',
      'region',
      'tipoclienteid',
      'tipocliente',
      'skuid',
      'sku',
      'depid',
      'dep',
      'marcaid',
      'marca',
      'gpoid',
      'gpo',
      'catid',
      'cat',
      'verid',
      'ver',
      'pesoanterior',
      'pesoactual',
      'cajasanterior',
      'cajasactual',
      'diffpeso',
      'diffcaja',
      'presentacion',
      'upd',
      'ratio_ant',
      'ratio_act',
      'upd_sincro',
      'sync_hash',
      'last_sync_at',
      'sync_status'
    ]
  },
  'HOMOLOGACIONVTA_P21': {
    type: 'VTA',
    primaryKey: [
      'mesid',
      'aliadoid',
      'sucursalid',
      'skuid'
    ],
    upsertKey: 'sync_hash',
    columns: [
      'mesid',
      'mes',
      'estadoid',
      'estado',
      'aliadoid',
      'aliado',
      'sucursalid',
      'sucursal',
      'regionid',
      'region',
      'tipoclienteid',
      'tipocliente',
      'skuid',
      'sku',
      'depid',
      'dep',
      'marcaid',
      'marca',
      'gpoid',
      'gpo',
      'catid',
      'cat',
      'verid',
      'ver',
      'pesoanterior',
      'pesoactual',
      'cajasanterior',
      'cajasactual',
      'diffpeso',
      'diffcaja',
      'presentacion',
      'upd',
      'ratio_ant',
      'ratio_act',
      'upd_sincro',
      'sync_hash',
      'last_sync_at',
      'sync_status'
    ]
  },
  'HOMOLOGACIONVTA_P22': {
    type: 'VTA',
    primaryKey: [
      'mesid',
      'aliadoid',
      'sucursalid',
      'skuid'
    ],
    upsertKey: 'sync_hash',
    columns: [
      'mesid',
      'mes',
      'estadoid',
      'estado',
      'aliadoid',
      'aliado',
      'sucursalid',
      'sucursal',
      'regionid',
      'region',
      'tipoclienteid',
      'tipocliente',
      'skuid',
      'sku',
      'depid',
      'dep',
      'marcaid',
      'marca',
      'gpoid',
      'gpo',
      'catid',
      'cat',
      'verid',
      'ver',
      'pesoanterior',
      'pesoactual',
      'cajasanterior',
      'cajasactual',
      'diffpeso',
      'diffcaja',
      'presentacion',
      'upd',
      'ratio_ant',
      'ratio_act',
      'upd_sincro',
      'sync_hash',
      'last_sync_at',
      'sync_status'
    ]
  }
};
// Función para convertir nombres de columnas de MySQL a minúsculas
function convertMySQLRowToSupabase(row, tableType) {
  const converted = {};
  // Convertir todas las claves a minúsculas para coincidir con Supabase
  for (const [key, value] of Object.entries(row)){
    const lowerKey = key.toLowerCase();
    // Convertir tipos de datos según sea necesario
    if (value instanceof Date) {
      converted[lowerKey] = value.toISOString();
    } else if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
      // Ya es un timestamp ISO
      converted[lowerKey] = value;
    } else {
      converted[lowerKey] = value;
    }
  }
  return converted;
}
// Función para contar total de registros en MySQL
async function countMySQLRecords(table) {
  let connection;
  try {
    console.log(`Contando registros totales en MySQL para tabla ${table}`);
    // Crear conexión a MySQL
    connection = await new Client().connect(MYSQL_CONFIG);
    // Ejecutar query de conteo
    const query = `SELECT COUNT(*) as total FROM ${table}`;
    console.log(`Ejecutando query de conteo: ${query}`);
    const result = await connection.execute(query);
    const totalRecords = parseInt(result.rows[0].total);
    console.log(`Total de registros en ${table}: ${totalRecords}`);
    return totalRecords;
  } catch (error) {
    console.error('Error contando registros de MySQL:', error);
    throw new Error(`Error contando registros en MySQL: ${error.message}`);
  } finally{
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error('Error cerrando conexión MySQL:', closeError);
      }
    }
  }
}
// Función para obtener datos reales de MySQL
async function fetchMySQLDataReal(table, start, end) {
  let connection;
  try {
    console.log(`Conectando a MySQL para obtener datos de ${table}`);
    // Crear conexión a MySQL
    connection = await new Client().connect(MYSQL_CONFIG);
    console.log('Conexión a MySQL establecida exitosamente');
    // Construir query con LIMIT y OFFSET
    // Nota: end es inclusivo, por lo que necesitamos +1 para el límite correcto
    const limit = end - start + 1;
    const offset = start;
    const query = `SELECT * FROM ${table} LIMIT ${limit} OFFSET ${offset}`;
    console.log(`Ejecutando query: ${query} (rango: ${start}-${end}, registros esperados: ${limit})`);
    // Ejecutar query
    const result = await connection.execute(query);
    console.log(`Query ejecutado exitosamente. Registros obtenidos: ${result.rows.length}`);
    // Obtener esquema de la tabla
    const schema = TABLE_SCHEMAS[table];
    if (!schema) {
      throw new Error(`Esquema no encontrado para tabla ${table}`);
    }
    // Convertir filas de MySQL al formato de Supabase
    const convertedRows = result.rows.map((row)=>{
      const converted = convertMySQLRowToSupabase(row, schema.type);
      // Agregar sync_status = true para todos los registros de MySQL
      converted.sync_status = true;
      // Generar hash basado en las claves primarias
      converted.sync_hash = generateRecordHash(converted, schema.primaryKey);
      // Agregar timestamp de sincronización
      converted.last_sync_at = new Date().toISOString();
      return converted;
    });
    console.log(`Convertidos ${convertedRows.length} registros de MySQL`);
    console.log('Primer registro convertido:', JSON.stringify(convertedRows[0], null, 2));
    return convertedRows;
  } catch (error) {
    console.error('Error obteniendo datos de MySQL:', error);
    throw new Error(`Error conectando a MySQL: ${error.message}`);
  } finally{
    if (connection) {
      try {
        await connection.close();
        console.log('Conexión MySQL cerrada');
      } catch (closeError) {
        console.error('Error cerrando conexión MySQL:', closeError);
      }
    }
  }
}
// Función para limpiar tabla antes de insertar (opcional)
async function clearTable(table) {
  try {
    console.log(`Limpiando tabla ${table}...`);
    const { error } = await supabase.from(table).delete().neq('aliadoid', 'NEVER_MATCH'); // Eliminar todos los registros
    if (error) {
      console.error('Error limpiando tabla:', error);
      throw new Error(`Error limpiando tabla ${table}: ${error.message}`);
    }
    console.log(`Tabla ${table} limpiada exitosamente`);
    return true;
  } catch (error) {
    console.error('Error en clearTable:', error);
    throw error;
  }
}
// Función para marcar todos los registros como no sincronizados al inicio (en lotes para evitar timeout)
async function markAllAsNotSynced(table) {
  try {
    console.log(`Marcando todos los registros de ${table} como sync_status = false (procesando en lotes)`);
    let totalUpdated = 0;
    let batchSize = 5000; // Procesar en lotes de 5000 registros
    let hasMoreRecords = true;
    while(hasMoreRecords){
      // Actualizar un lote de registros que tengan sync_status = true
      const { data, error, count } = await supabase.from(table).update({
        sync_status: false
      }).eq('sync_status', true).limit(batchSize);
      if (error) {
        console.error('Error marcando lote como no sincronizado:', error);
        throw new Error(`Error marcando registros en ${table}: ${error.message}`);
      }
      // Si no se actualizó ningún registro, significa que no hay más registros con sync_status = true
      if (!data || data.length === 0) {
        hasMoreRecords = false;
      } else {
        totalUpdated += data.length;
        console.log(`Lote procesado: ${data.length} registros marcados como false (total: ${totalUpdated})`);
        // Pequeña pausa para no sobrecargar la base de datos
        await new Promise((resolve)=>setTimeout(resolve, 100));
      }
      // Si el lote fue menor que batchSize, probablemente no hay más registros
      if (data && data.length < batchSize) {
        hasMoreRecords = false;
      }
    }
    console.log(`Completado: ${totalUpdated} registros de ${table} marcados como sync_status = false`);
    return true;
  } catch (error) {
    console.error('Error en markAllAsNotSynced:', error);
    throw error;
  }
}
// Función para eliminar registros no sincronizados
async function deleteUnsyncedRecords(table) {
  try {
    console.log(`Eliminando registros no sincronizados de ${table}`);
    const { data, error } = await supabase.from(table).delete().eq('sync_status', false);
    if (error) {
      console.error('Error eliminando registros no sincronizados:', error);
      throw new Error(`Error eliminando registros de ${table}: ${error.message}`);
    }
    console.log(`Registros no sincronizados eliminados de ${table}`);
    return true;
  } catch (error) {
    console.error('Error en deleteUnsyncedRecords:', error);
    throw error;
  }
}
// Función para obtener conteo de registros en Supabase
async function getSupabaseRecordCount(table) {
  try {
    console.log(`Contando registros en Supabase para tabla ${table}`);
    const { count, error } = await supabase.from(table).select('*', {
      count: 'exact',
      head: true
    });
    if (error) {
      console.error('Error contando registros en Supabase:', error);
      throw new Error(`Error contando registros en Supabase: ${error.message}`);
    }
    console.log(`Total de registros en Supabase ${table}: ${count}`);
    return count || 0;
  } catch (error) {
    console.error('Error en getSupabaseRecordCount:', error);
    throw error;
  }
}
// Función para realizar auditoría de sincronización
async function auditSynchronization(table, mysqlTotalRecords) {
  try {
    console.log(`🔍 INICIANDO AUDITORÍA DE SINCRONIZACIÓN PARA: ${table}`);
    console.log('='.repeat(60));
    // Obtener conteo de Supabase
    const supabaseCount = await getSupabaseRecordCount(table);
    // Mostrar resultados de la auditoría
    console.log(`📊 RESULTADOS DE AUDITORÍA:`);
    console.log(`   MySQL (origen): ${mysqlTotalRecords} registros`);
    console.log(`   Supabase (destino): ${supabaseCount} registros`);
    // Verificar consistencia
    const isConsistent = mysqlTotalRecords === supabaseCount && mysqlTotalRecords > 0;
    const difference = Math.abs(mysqlTotalRecords - supabaseCount);
    const auditResult = {
      table: table,
      mysql_count: mysqlTotalRecords,
      supabase_count: supabaseCount,
      is_consistent: isConsistent,
      difference: difference,
      sync_percentage: mysqlTotalRecords > 0 ? (supabaseCount / mysqlTotalRecords * 100).toFixed(2) : 0,
      status: isConsistent ? 'SUCCESS' : 'DISCREPANCY_DETECTED'
    };
    if (isConsistent) {
      console.log(`✅ AUDITORÍA EXITOSA: Los conteos coinciden perfectamente`);
      console.log(`   Sincronización: 100% completa`);
    } else {
      console.log(`❌ DISCREPANCIA DETECTADA:`);
      console.log(`   Diferencia: ${difference} registros`);
      if (supabaseCount < mysqlTotalRecords) {
        console.log(`   ⚠️  FALTAN ${mysqlTotalRecords - supabaseCount} registros en Supabase`);
        console.log(`   📉 Sincronización: ${auditResult.sync_percentage}% completa`);
      } else {
        console.log(`   ⚠️  HAY ${supabaseCount - mysqlTotalRecords} registros EXTRA en Supabase`);
        console.log(`   📈 Registros adicionales detectados`);
      }
      console.log(`   🔧 RECOMENDACIÓN: Revisar la lógica de sincronización`);
    }
    console.log('='.repeat(60));
    console.log(`🏁 AUDITORÍA COMPLETADA PARA: ${table}`);
    return auditResult;
  } catch (error) {
    console.error('Error en auditoría de sincronización:', error);
    return {
      table: table,
      mysql_count: mysqlTotalRecords,
      supabase_count: -1,
      is_consistent: false,
      difference: -1,
      sync_percentage: 0,
      status: 'AUDIT_ERROR',
      error: error.message
    };
  }
}
// Función para hacer UPSERT de datos en Supabase
async function upsertToSupabase(table, data, clearFirst = false) {
  if (data.length === 0) {
    return {
      success: true,
      count: 0
    };
  }
  try {
    console.log(`Haciendo UPSERT de ${data.length} registros en tabla ${table}`);
    console.log('Primer registro a procesar:', JSON.stringify(data[0], null, 2));
    // Limpiar tabla si se solicita (solo para pruebas)
    if (clearFirst) {
      await clearTable(table);
    }
    // Obtener esquema de la tabla
    const schema = TABLE_SCHEMAS[table];
    if (!schema || !schema.upsertKey) {
      throw new Error(`Esquema o clave de upsert no encontrada para tabla ${table}`);
    }
    // Usar upsert con sync_hash como clave única
    const { data: result, error } = await supabase.from(table).upsert(data, {
      onConflict: schema.upsertKey,
      ignoreDuplicates: false
    });
    if (error) {
      console.error('Error de Supabase en UPSERT:', error);
      throw new Error(`Error haciendo UPSERT en ${table}: ${error.message}`);
    }
    console.log(`UPSERT exitoso de ${data.length} registros`);
    return {
      success: true,
      count: data.length
    };
  } catch (error) {
    console.error('Error en upsertToSupabase:', error);
    throw error;
  }
}
Deno.serve(async (req)=>{
  try {
    // Manejar CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
    // Verificar método HTTP
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({
        error: 'Método no permitido. Use POST.'
      }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    // Obtener parámetros de la URL
    const url = new URL(req.url);
    const table = url.searchParams.get('table');
    const startParam = url.searchParams.get('start');
    const endParam = url.searchParams.get('end');
    const clearFirst = url.searchParams.get('clear') === 'true';
    console.log(`Recibida petición: table=${table}, start=${startParam}, end=${endParam}, clear=${clearFirst}`);
    // Validar parámetros
    if (!table || !startParam || !endParam) {
      return new Response(JSON.stringify({
        error: 'Parámetros requeridos: table, start, end',
        received: {
          table,
          start: startParam,
          end: endParam
        }
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    const start = parseInt(startParam);
    const end = parseInt(endParam);
    if (isNaN(start) || isNaN(end) || start >= end) {
      return new Response(JSON.stringify({
        error: 'start y end deben ser números válidos y start < end'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    // Validar tabla soportada
    if (!TABLE_SCHEMAS[table]) {
      return new Response(JSON.stringify({
        error: `Tabla '${table}' no soportada`,
        supported_tables: Object.keys(TABLE_SCHEMAS)
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    console.log(`Procesando migración: tabla=${table}, start=${start}, end=${end}`);
    // Si es el primer lote (start = 0), marcar todos los registros como no sincronizados
    if (start === 0) {
      console.log('Primer lote detectado, marcando todos los registros como no sincronizados');
      await markAllAsNotSynced(table);
    }
    // Contar total de registros en MySQL para detectar si es el último lote
    const totalRecords = await countMySQLRecords(table);
    const isLastBatch = end >= totalRecords;
    console.log(`Total registros en MySQL: ${totalRecords}, Rango actual: ${start}-${end}, ¿Es último lote?: ${isLastBatch}`);
    // Obtener datos reales de MySQL
    const mysqlData = await fetchMySQLDataReal(table, start, end);
    console.log(`Obtenidos ${mysqlData.length} registros reales de MySQL`);
    // Hacer UPSERT en Supabase (insertar si no existe, actualizar si existe)
    const upsertResult = await upsertToSupabase(table, mysqlData, clearFirst);
    console.log(`UPSERT completado: ${upsertResult.count} registros procesados en Supabase`);
    // Si es el último lote, eliminar registros no sincronizados y hacer auditoría
    let auditResult = null;
    if (isLastBatch) {
      console.log('Último lote detectado, eliminando registros no sincronizados');
      await deleteUnsyncedRecords(table);
      // Realizar auditoría de sincronización
      console.log('Realizando auditoría de sincronización...');
      auditResult = await auditSynchronization(table, totalRecords);
    }
    const response = {
      success: true,
      message: `Migración exitosa: ${upsertResult.count} registros reales procesados para tabla ${table}${isLastBatch ? ' (último lote - registros huérfanos eliminados)' : ''}`,
      processed: upsertResult.count,
      audit: auditResult,
      debug: {
        table,
        table_type: TABLE_SCHEMAS[table].type,
        start,
        end,
        limit: end - start,
        mysql_total_records: totalRecords,
        mysql_records: mysqlData.length,
        supabase_upserted: upsertResult.count,
        cleared_first: clearFirst,
        is_first_batch: start === 0,
        is_last_batch: isLastBatch,
        columns_count: TABLE_SCHEMAS[table].columns.length,
        data_source: 'MySQL Real Connection',
        audit_performed: auditResult !== null
      }
    };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error('Error en migración:', error);
    const errorResponse = {
      success: false,
      message: `Error en migración: ${error.message}`,
      processed: 0,
      errors: [
        error.message
      ],
      debug: {
        error_type: error.constructor.name,
        error_stack: error.stack
      }
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});
