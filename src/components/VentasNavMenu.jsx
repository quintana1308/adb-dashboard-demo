import { useNavigate } from 'react-router-dom'

const VentasNavMenu = ({ currentPage }) => {
  const navigate = useNavigate()

  const menuItems = [
    {
      key: 'consolidado-general',
      label: 'Consolidado General',
      path: '/dashboard/ventas/consolidado-general'
    },
    {
      key: 'ventas',
      label: 'Ventas',
      path: '/dashboard/ventas/ventas'
    },
    {
      key: 'region-grupo-tipo',
      label: 'Región - Grupo - Tipo de Negocio',
      path: '/dashboard/ventas/region-grupo-tipo'
    },
    {
      key: 'region-aliado-sku',
      label: 'Región - Aliado - SKU',
      path: '/dashboard/ventas/region-aliado-sku'
    }
  ]

  return (
    <>
      {/* Menú Desktop */}
      <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
        {menuItems.map((item) => (
          <button
            key={item.key}
            className={
              currentPage === item.key
                ? "text-white border-b-2 border-white pb-1 font-semibold"
                : "text-white/80 hover:text-white transition-colors"
            }
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Menú Móvil */}
      <div className="md:hidden">
        <select 
          className="bg-transparent border border-white/30 rounded px-2 py-1 text-sm text-white"
          onChange={(e) => {
            const selectedItem = menuItems.find(item => item.key === e.target.value)
            if (selectedItem) {
              navigate(selectedItem.path)
            }
          }}
          value={currentPage}
        >
          {menuItems.map((item) => (
            <option key={item.key} value={item.key} className="text-black">
              {item.label}
            </option>
          ))}
        </select>
      </div>
    </>
  )
}

export default VentasNavMenu
