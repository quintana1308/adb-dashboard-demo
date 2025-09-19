// Configuración de la API de sincronización
const API_BASE_URL = 'https://data-purolomo.com/migrator';

export const syncAPI = {
  // Ejecutar sincronización completa
  async syncAll() {
    try {
      console.log('Iniciando sincronización...', API_BASE_URL);
      const response = await fetch(`${API_BASE_URL}/api_sync.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Respuesta recibida:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Resultado de sincronización:', result);
      return result;
    } catch (error) {
      console.error('Error en syncAll:', error);
      throw error;
    }
  },

  // Ejecutar sincronización de tabla específica
  async syncTable(tableName) {
    try {
      const response = await fetch(`${API_BASE_URL}/api_sync.php?table=${tableName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en syncTable:', error);
      throw error;
    }
  },

  // Verificar estado de sincronización
  async getStatus() {
    try {
      console.log('Verificando estado de sincronización...');
      
      // Agregar timeout de 10 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${API_BASE_URL}/api_sync.php?status=true`, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      console.log('Estado response:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Estado resultado:', result);
      return result;
    } catch (error) {
      console.error('Error en getStatus:', error);
      // Si es timeout o error de red, devolver estado por defecto
      if (error.name === 'AbortError' || error.message.includes('fetch')) {
        console.log('Timeout o error de red, asumiendo que no hay sincronización activa');
        return { running: false, duration: 0 };
      }
      throw error;
    }
  },

  // Obtener tablas disponibles
  async getTables() {
    try {
      const response = await fetch(`${API_BASE_URL}/api_sync.php?tables=true`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en getTables:', error);
      throw error;
    }
  }
};
