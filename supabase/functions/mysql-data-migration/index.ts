import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Client } from "https://deno.land/x/mysql@v2.12.1/mod.ts";
// Configuración de conexión MySQL
const MYSQL_CONFIG = {
  hostname: "198.251.71.50",
  username: "purolomoDash",
  password: "13@v2Mqk6",
  db: "purolomo",
  port: 3306
};
// Configuración ultra-conservadora para una sola tabla
const BATCH_SIZE = 300; // Lotes muy pequeños
const MAX_EXECUTION_TIME = 5 * 60 * 1000; // 5 minutos máximo
const MAX_RECORDS_PER_EXECUTION = 10000; // Máximo 10k registros por ejecución
// Mapeo de claves primarias
const TABLE_PRIMARY_KEYS = {
  'api_enterprise': 'etr_id',
  'user': 'id',
  'dashboard': 'id',
  'api_logjson': 'json_id',
  'HOMOLOGACIONACT': [
    'aliadoid',
    'sucursalid',
    'mesid',
    'codigo'
  ],
  'HOMOLOGACIONVTA': [
    'aliadoid',
    'sucursalid',
    'mesid',
    'skuid'
  ],
  'HOMOLOGACIONACT_P21': [
    'aliadoid',
    'sucursalid',
    'mesid',
    'codigo'
  ],
  'HOMOLOGACIONACT_P22': [
    'aliadoid',
    'sucursalid',
    'mesid',
    'codigo'
  ],
  'HOMOLOGACIONVTA_P21': [
    'aliadoid',
    'sucursalid',
    'mesid',
    'skuid'
  ],
  'HOMOLOGACIONVTA_P22': [
    'aliadoid',
    'sucursalid',
    'mesid',
    'skuid'
  ]
};
// Tablas disponibles para migración
const AVAILABLE_TABLES = [
  'api_enterprise',
  'user',
  'dashboard',
  'api_logjson',
  'HOMOLOGACIONACT',
  'HOMOLOGACIONVTA',
  'HOMOLOGACIONACT_P21',
  'HOMOLOGACIONACT_P22',
  'HOMOLOGACIONVTA_P21',
  'HOMOLOGACIONVTA_P22'
];
serve(async (req)=>{
  const startTime = Date.now();
  let mysqlClient = null;
  let supabaseClient = null;
  try {
    // Obtener parámetros de la solicitud
    const url = new URL(req.url);
    const tableName = url.searchParams.get('table') || 'all';
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const limit = parseInt(url.searchParams.get('limit') || MAX_RECORDS_PER_EXECUTION.toString());
    console.log(`🎯 Migración solicitada - Tabla: ${tableName}, Offset: ${offset}, Limit: ${limit}`);
    // Inicializar clientes
    console.log('🔌 Inicializando conexiones...');
    mysqlClient = await new Client().connect(MYSQL_CONFIG);
    console.log('✅ Conexión MySQL establecida');
    supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    console.log('✅ Conexión Supabase establecida');
    // Determinar qué tablas procesar
    let tablesToProcess = [];
    if (tableName === 'all') {
      // Procesar solo tablas pequeñas cuando se solicita 'all'
      tablesToProcess = [
        'api_enterprise',
        'user',
        'dashboard',
        'api_logjson'
      ];
    } else if (tableName === 'small') {
      // Procesar solo tablas del sistema
      tablesToProcess = [
        'api_enterprise',
        'user',
        'dashboard',
        'api_logjson'
      ];
    } else if (tableName === 'partitions') {
      // Procesar solo particiones
      tablesToProcess = [
        'HOMOLOGACIONACT_P21',
        'HOMOLOGACIONACT_P22',
        'HOMOLOGACIONVTA_P21',
        'HOMOLOGACIONVTA_P22'
      ];
    } else if (AVAILABLE_TABLES.includes(tableName)) {
      // Procesar tabla específica
      tablesToProcess = [
        tableName
      ];
    } else {
      throw new Error(`Tabla no válida: ${tableName}. Disponibles: ${AVAILABLE_TABLES.join(', ')}, 'all', 'small', 'partitions'`);
    }
    console.log(`📋 Procesando tablas: ${tablesToProcess.join(', ')}`);
    const results = [];
    // Procesar cada tabla
    for (const table of tablesToProcess){
      const tableStartTime = Date.now();
      // Verificar timeout global
      if (Date.now() - startTime > MAX_EXECUTION_TIME) {
        results.push({
          table: table,
          status: 'timeout',
          processed: 0,
          inserted: 0,
          updated: 0,
          deleted: 0,
          message: 'Timeout global alcanzado',
          duration: Date.now() - tableStartTime,
          total_records: 0,
          remaining_records: 0
        });
        break;
      }
      console.log(`\n📊 Procesando tabla: ${table}`);
      try {
        const result = await migrateSingleTable(mysqlClient, supabaseClient, table, offset, limit, tableStartTime);
        results.push(result);
        console.log(`✅ ${table}: ${result.message}`);
        // Pausa entre tablas
        await new Promise((resolve)=>setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ Error en tabla ${table}:`, error);
        results.push({
          table: table,
          status: 'error',
          processed: 0,
          inserted: 0,
          updated: 0,
          deleted: 0,
          message: `Error: ${error.message}`,
          duration: Date.now() - tableStartTime,
          total_records: 0,
          remaining_records: 0
        });
      }
    }
    // Registrar resultado en logs
    await logMigrationResult(supabaseClient, results, Date.now() - startTime, tableName, offset, limit);
    return new Response(JSON.stringify({
      success: true,
      duration: Date.now() - startTime,
      table_requested: tableName,
      offset: offset,
      limit: limit,
      results: results,
      summary: {
        total_tables: results.length,
        successful: results.filter((r)=>r.status === 'success').length,
        errors: results.filter((r)=>r.status === 'error').length,
        timeouts: results.filter((r)=>r.status === 'timeout').length,
        partial: results.filter((r)=>r.status === 'partial').length
      },
      next_steps: generateNextSteps(results, tableName, offset, limit)
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('💥 Error crítico en migración:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } finally{
    // Cerrar conexiones
    if (mysqlClient) {
      await mysqlClient.close();
      console.log('🔌 Conexión MySQL cerrada');
    }
  }
});
async function migrateSingleTable(mysqlClient, supabaseClient, tableName, startOffset, maxLimit, startTime) {
  let processed = 0;
  let inserted = 0;
  let updated = 0;
  let deleted = 0;
  // Obtener clave primaria
  const primaryKey = TABLE_PRIMARY_KEYS[tableName];
  const isCompositePK = Array.isArray(primaryKey);
  console.log(`📋 Tabla ${tableName}: PK = ${Array.isArray(primaryKey) ? primaryKey.join(', ') : primaryKey}`);
  // Obtener total de registros en MySQL
  const totalCountQuery = `SELECT COUNT(*) as total FROM \`${tableName}\``;
  const totalResult = await mysqlClient.execute(totalCountQuery);
  const totalRecords = totalResult.rows?.[0]?.total || 0;
  console.log(`📊 Total registros en MySQL: ${totalRecords}`);
  if (totalRecords === 0) {
    // Limpiar tabla en Supabase si está vacía en MySQL
    const { error: deleteError } = await supabaseClient.from(tableName).delete().neq(isCompositePK ? primaryKey[0] : primaryKey, 'impossible_value_to_delete_all');
    return {
      table: tableName,
      status: 'success',
      processed: 0,
      inserted: 0,
      updated: 0,
      deleted: 0,
      message: 'Tabla vacía en MySQL, limpiada en Supabase',
      duration: Date.now() - startTime,
      total_records: 0,
      remaining_records: 0
    };
  }
  // Calcular límites de procesamiento
  const recordsToProcess = Math.min(maxLimit, totalRecords - startOffset);
  const endOffset = startOffset + recordsToProcess;
  console.log(`🎯 Procesando registros ${startOffset + 1} a ${endOffset} de ${totalRecords}`);
  // Para tablas con clave compuesta, usar estrategia simplificada
  if (isCompositePK) {
    return await migrateSingleTableComposite(mysqlClient, supabaseClient, tableName, primaryKey, startOffset, recordsToProcess, totalRecords, startTime);
  }
  // Para tablas con clave simple
  return await migrateSingleTableSimple(mysqlClient, supabaseClient, tableName, primaryKey, startOffset, recordsToProcess, totalRecords, startTime);
}
async function migrateSingleTableSimple(mysqlClient, supabaseClient, tableName, primaryKey, startOffset, recordsToProcess, totalRecords, startTime) {
  let processed = 0;
  let inserted = 0;
  let updated = 0;
  // Si es el primer lote (offset = 0), obtener IDs existentes para comparación
  let existingIdsSet = new Set();
  if (startOffset === 0) {
    const { data: existingIds, error: idsError } = await supabaseClient.from(tableName).select(primaryKey).limit(5000); // Limitar para evitar memoria excesiva
    if (!idsError) {
      existingIdsSet = new Set(existingIds?.map((row)=>row[primaryKey]) || []);
    }
  }
  // Procesar datos en lotes pequeños
  let offset = startOffset;
  const endOffset = startOffset + recordsToProcess;
  while(offset < endOffset){
    // Verificar timeout
    if (Date.now() - startTime > 4 * 60 * 1000) {
      return {
        table: tableName,
        status: 'partial',
        processed,
        inserted,
        updated,
        deleted: 0,
        message: `Timeout - procesados ${processed} de ${recordsToProcess} registros solicitados`,
        duration: Date.now() - startTime,
        total_records: totalRecords,
        remaining_records: totalRecords - (startOffset + processed)
      };
    }
    const currentBatchSize = Math.min(BATCH_SIZE, endOffset - offset);
    console.log(`📦 Lote: registros ${offset + 1}-${offset + currentBatchSize}`);
    // Obtener lote de MySQL
    const batchQuery = `SELECT * FROM \`${tableName}\` LIMIT ${currentBatchSize} OFFSET ${offset}`;
    const batchResult = await mysqlClient.execute(batchQuery);
    const batchRows = batchResult.rows || [];
    if (batchRows.length === 0) break;
    // Procesar lote
    const batchData = [];
    const updateData = [];
    for (const row of batchRows){
      const recordId = row[primaryKey];
      const supabaseData = convertMySQLToSupabase(row);
      if (existingIdsSet.has(recordId)) {
        updateData.push({
          id: recordId,
          data: supabaseData
        });
      } else {
        batchData.push(supabaseData);
      }
    }
    // Insertar nuevos registros
    if (batchData.length > 0) {
      const { error: insertError } = await supabaseClient.from(tableName).insert(batchData);
      if (!insertError) {
        inserted += batchData.length;
      }
    }
    // Actualizar registros existentes
    for (const update of updateData){
      const { error: updateError } = await supabaseClient.from(tableName).update(update.data).eq(primaryKey, update.id);
      if (!updateError) {
        updated++;
      }
    }
    processed += batchRows.length;
    offset += currentBatchSize;
    // Pausa para liberar recursos
    await new Promise((resolve)=>setTimeout(resolve, 50));
  }
  return {
    table: tableName,
    status: processed === recordsToProcess ? 'success' : 'partial',
    processed,
    inserted,
    updated,
    deleted: 0,
    message: `Procesados: ${processed}, Insertados: ${inserted}, Actualizados: ${updated}`,
    duration: Date.now() - startTime,
    total_records: totalRecords,
    remaining_records: totalRecords - (startOffset + processed)
  };
}
async function migrateSingleTableComposite(mysqlClient, supabaseClient, tableName, primaryKeys, startOffset, recordsToProcess, totalRecords, startTime) {
  let processed = 0;
  let inserted = 0;
  console.log(`🔑 Tabla con clave compuesta: ${tableName} (${primaryKeys.join(', ')})`);
  // Para tablas con clave compuesta, solo insertar (no actualizar)
  // Si es el primer lote, limpiar tabla
  if (startOffset === 0) {
    const { error: deleteAllError } = await supabaseClient.from(tableName).delete().neq(primaryKeys[0], 'impossible_value_to_delete_all');
  }
  // Procesar datos en lotes muy pequeños
  let offset = startOffset;
  const endOffset = startOffset + recordsToProcess;
  const compositeBatchSize = 150; // Lotes extra pequeños para claves compuestas
  while(offset < endOffset){
    // Verificar timeout
    if (Date.now() - startTime > 4 * 60 * 1000) {
      return {
        table: tableName,
        status: 'partial',
        processed,
        inserted,
        updated: 0,
        deleted: 0,
        message: `Timeout - procesados ${processed} de ${recordsToProcess} registros solicitados`,
        duration: Date.now() - startTime,
        total_records: totalRecords,
        remaining_records: totalRecords - (startOffset + processed)
      };
    }
    const currentBatchSize = Math.min(compositeBatchSize, endOffset - offset);
    console.log(`📦 Lote: registros ${offset + 1}-${offset + currentBatchSize}`);
    // Obtener lote de MySQL
    const batchQuery = `SELECT * FROM \`${tableName}\` LIMIT ${currentBatchSize} OFFSET ${offset}`;
    const batchResult = await mysqlClient.execute(batchQuery);
    const batchRows = batchResult.rows || [];
    if (batchRows.length === 0) break;
    // Preparar datos para Supabase
    const batchData = batchRows.map((row)=>convertMySQLToSupabase(row));
    // Insertar lote
    const { error: insertError } = await supabaseClient.from(tableName).insert(batchData);
    if (!insertError) {
      inserted += batchData.length;
    }
    processed += batchRows.length;
    offset += currentBatchSize;
    // Pausa más larga para tablas complejas
    await new Promise((resolve)=>setTimeout(resolve, 100));
  }
  return {
    table: tableName,
    status: processed === recordsToProcess ? 'success' : 'partial',
    processed,
    inserted,
    updated: 0,
    deleted: 0,
    message: `Procesados: ${processed}, Insertados: ${inserted} (clave compuesta)`,
    duration: Date.now() - startTime,
    total_records: totalRecords,
    remaining_records: totalRecords - (startOffset + processed)
  };
}
function convertMySQLToSupabase(row) {
  const converted = {};
  for (const [key, value] of Object.entries(row)){
    if (value === null || value === undefined) {
      converted[key] = null;
    } else if (value instanceof Date) {
      converted[key] = value.toISOString();
    } else if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
      converted[key] = new Date(value).toISOString();
    } else {
      converted[key] = value;
    }
  }
  return converted;
}
function generateNextSteps(results, tableName, offset, limit) {
  const nextSteps = [];
  for (const result of results){
    if (result.remaining_records > 0) {
      const nextOffset = offset + result.processed;
      nextSteps.push(`Continuar ${result.table}: ?table=${result.table}&offset=${nextOffset}&limit=${limit}`);
    }
  }
  if (tableName === 'small' && results.every((r)=>r.status === 'success')) {
    nextSteps.push('Procesar particiones: ?table=partitions&offset=0&limit=10000');
  }
  if (tableName === 'partitions' && results.every((r)=>r.status === 'success')) {
    nextSteps.push('Procesar tabla principal HOMOLOGACIONACT: ?table=HOMOLOGACIONACT&offset=0&limit=10000');
    nextSteps.push('Procesar tabla principal HOMOLOGACIONVTA: ?table=HOMOLOGACIONVTA&offset=0&limit=10000');
  }
  return nextSteps;
}
async function logMigrationResult(supabaseClient, results, totalDuration, tableName, offset, limit) {
  if (!supabaseClient) return;
  try {
    await supabaseClient.from('api_logjson').insert({
      json_enterprise: 'SYSTEM',
      json_type: 'MIGRATION_SINGLE_TABLE',
      json_value: JSON.stringify({
        timestamp: new Date().toISOString(),
        table_requested: tableName,
        offset: offset,
        limit: limit,
        total_duration: totalDuration,
        results: results.map((r)=>({
            table: r.table,
            status: r.status,
            processed: r.processed,
            inserted: r.inserted,
            updated: r.updated,
            deleted: r.deleted,
            total_records: r.total_records,
            remaining_records: r.remaining_records,
            duration: r.duration
          }))
      }),
      json_response: JSON.stringify({
        success: results.filter((r)=>r.status === 'success').length,
        errors: results.filter((r)=>r.status === 'error').length,
        timeouts: results.filter((r)=>r.status === 'timeout').length,
        partial: results.filter((r)=>r.status === 'partial').length
      }),
      json_fechahora: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error registrando log:', error);
  }
}
