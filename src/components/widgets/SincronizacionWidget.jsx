import React from 'react'

const SincronizacionWidget = () => {
  // Datos estáticos basados en la imagen 2
  const aliadosEstaticos = [
    { nombre: 'Agropecuaria Los Llanos Demo C.A:', fecha: '01/07/2024' },
    { nombre: 'Avicola Horinzonte Demo C.A:', fecha: '02/09/2024' },
    { nombre: 'Comercial Valle Demo C.A:', fecha: '17/03/2024' },
    { nombre: 'Corporativo Estrella Demo C.A:', fecha: '01/10/2022' },
    { nombre: 'Distribuciones Norte Demo C.A:', fecha: '01/08/2021' },
    { nombre: 'Mercado Central Demo CA:', fecha: '01/05/2024' },
    { nombre: 'Distribuidora Mas Dos Demo CA:', fecha: '01/01/2024' }
  ]

  return (
    <div className="p-4 rounded-lg shadow-lg bg-white">
      <div className="mb-3">
        <h3 className="text-grey-600 text-lg font-bold">INICIO DE SINCRONIZACIÓN</h3>
      </div>
      
      <div className="space-y-1">
        {aliadosEstaticos.map((aliado, index) => (
          <div key={index} className="flex justify-between items-center py-1">
            <span className="text-gray-700 text-sm font-medium truncate mr-2">
              {aliado.nombre}
            </span>
            <span className="text-gray-600 text-sm">
              {aliado.fecha}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SincronizacionWidget
