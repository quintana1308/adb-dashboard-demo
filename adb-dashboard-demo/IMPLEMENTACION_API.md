# Implementación de API para Sincronización Manual

## 📋 Archivos Creados

### 1. `api_sync.php` - Endpoint Principal
Endpoint REST que permite ejecutar la sincronización desde el frontend.

### 2. `.htaccess` - Configuración del Servidor
Configuración de seguridad y CORS para el directorio migrator.

## 🚀 Cómo Implementar en tu Frontend React

### 1. Función para Ejecutar Sincronización

```javascript
// utils/syncAPI.js
const API_BASE_URL = 'https://data-purolomo.com/migrator';

export const syncAPI = {
  // Ejecutar sincronización completa
  async syncAll() {
    const response = await fetch(`${API_BASE_URL}/api_sync.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return await response.json();
  },

  // Ejecutar sincronización de tabla específica
  async syncTable(tableName) {
    const response = await fetch(`${API_BASE_URL}/api_sync.php?table=${tableName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return await response.json();
  },

  // Verificar estado de sincronización
  async getStatus() {
    const response = await fetch(`${API_BASE_URL}/api_sync.php?status=true`);
    return await response.json();
  },

  // Obtener tablas disponibles
  async getTables() {
    const response = await fetch(`${API_BASE_URL}/api_sync.php?tables=true`);
    return await response.json();
  }
};
```

### 2. Componente React para el Botón de Sincronización

```jsx
// components/SyncButton.jsx
import React, { useState, useEffect } from 'react';
import { syncAPI } from '../utils/syncAPI';

const SyncButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [message, setMessage] = useState('');

  // Verificar estado cada 5 segundos cuando hay sincronización en curso
  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(async () => {
        try {
          const status = await syncAPI.getStatus();
          if (!status.running) {
            setIsLoading(false);
            setMessage('Sincronización completada');
          } else {
            setSyncStatus(status);
          }
        } catch (error) {
          console.error('Error checking sync status:', error);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSync = async () => {
    try {
      setIsLoading(true);
      setMessage('Iniciando sincronización...');
      
      const result = await syncAPI.syncAll();
      
      if (result.success) {
        setMessage('Sincronización iniciada correctamente');
      } else {
        setIsLoading(false);
        if (result.code === 'SYNC_IN_PROGRESS') {
          setMessage('Ya hay una sincronización en curso');
        } else {
          setMessage(`Error: ${result.error}`);
        }
      }
    } catch (error) {
      setIsLoading(false);
      setMessage(`Error de conexión: ${error.message}`);
    }
  };

  return (
    <div className="sync-button-container">
      <button 
        onClick={handleSync} 
        disabled={isLoading}
        className={`sync-button ${isLoading ? 'loading' : ''}`}
      >
        {isLoading ? 'Sincronizando...' : 'Sincronizar Datos'}
      </button>
      
      {message && (
        <div className={`sync-message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
      
      {syncStatus && syncStatus.running && (
        <div className="sync-progress">
          <p>Sincronización en curso...</p>
          <p>Duración: {Math.floor(syncStatus.duration / 60)}:{(syncStatus.duration % 60).toString().padStart(2, '0')}</p>
          {syncStatus.table && <p>Tabla: {syncStatus.table}</p>}
        </div>
      )}
    </div>
  );
};

export default SyncButton;
```

### 3. Estilos CSS Sugeridos

```css
/* styles/SyncButton.css */
.sync-button-container {
  margin: 20px 0;
}

.sync-button {
  background-color: #4CAF50;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

.sync-button:hover:not(:disabled) {
  background-color: #45a049;
}

.sync-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.sync-button.loading {
  background-color: #ff9800;
}

.sync-message {
  margin-top: 10px;
  padding: 10px;
  border-radius: 4px;
}

.sync-message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.sync-message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.sync-progress {
  margin-top: 15px;
  padding: 15px;
  background-color: #e3f2fd;
  border-radius: 6px;
  border-left: 4px solid #2196f3;
}
```

## 🔧 Comandos para Implementar

### 1. Subir archivos al servidor
```bash
# Copiar archivos al servidor Plesk
scp api_sync.php usuario@data-purolomo.com:/httpdocs/migrator/
scp .htaccess usuario@data-purolomo.com:/httpdocs/migrator/
```

### 2. Verificar permisos en el servidor
```bash
# Conectar al servidor y verificar permisos
chmod 755 /httpdocs/migrator/api_sync.php
chmod 644 /httpdocs/migrator/.htaccess
chmod 755 /httpdocs/migrator/logs/
```

### 3. Probar el endpoint
```bash
# Probar estado de sincronización
curl "https://data-purolomo.com/migrator/api_sync.php?status=true"

# Probar tablas disponibles
curl "https://data-purolomo.com/migrator/api_sync.php?tables=true"

# Ejecutar sincronización (POST)
curl -X POST "https://data-purolomo.com/migrator/api_sync.php"
```

## 📊 Endpoints Disponibles

| Método | URL | Descripción |
|--------|-----|-------------|
| `GET` | `/api_sync.php?status=true` | Verificar estado de sincronización |
| `GET` | `/api_sync.php?tables=true` | Obtener tablas disponibles |
| `POST` | `/api_sync.php` | Ejecutar sincronización completa |
| `POST` | `/api_sync.php?table=TABLA` | Sincronizar tabla específica |

## 🛡️ Características de Seguridad

- **Bloqueo de ejecuciones simultáneas**: Evita múltiples sincronizaciones al mismo tiempo
- **Timeout automático**: Los procesos colgados se liberan automáticamente después de 30 minutos
- **Logging completo**: Todas las operaciones se registran en logs
- **Validación de tablas**: Solo permite sincronizar tablas autorizadas
- **CORS configurado**: Permite llamadas desde tu frontend React

## 🚨 Consideraciones Importantes

1. **Tiempo de ejecución**: La sincronización puede tomar varios minutos
2. **Recursos del servidor**: Monitorea el uso de CPU y memoria durante la sincronización
3. **Logs**: Revisa regularmente los logs en `/httpdocs/migrator/logs/`
4. **Backup**: Mantén respaldos antes de hacer sincronizaciones masivas

## 🔍 Troubleshooting

### Error "SYNC_IN_PROGRESS"
- Otra sincronización está en curso
- Espera a que termine o elimina manualmente el archivo `logs/sync.lock`

### Error de permisos
- Verifica que PHP tenga permisos de escritura en el directorio `logs/`
- Ejecuta: `chmod 755 logs/`

### Error de CORS
- Verifica que el archivo `.htaccess` esté en su lugar
- Confirma que mod_headers esté habilitado en Apache
