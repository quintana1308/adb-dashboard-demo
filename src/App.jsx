import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import VentasConsolidadoGeneral from './components/VentasConsolidadoGeneral'
import VentasDetallado from './components/VentasDetallado'
import VentasRegionGrupoTipo from './components/VentasRegionGrupoTipo'
import VentasRegionAliadoSku from './components/VentasRegionAliadoSku'
import ActivacionAliadosDepartamentos from './components/ActivacionAliadosDepartamentos'
import ActivacionAliadosGrupos from './components/ActivacionAliadosGrupos'
import ActivacionAliadosMarcas from './components/ActivacionAliadosMarcas'
import ActivacionAliadosSku from './components/ActivacionAliadosSku'
import FinanzasRentabilidad from './components/FinanzasRentabilidad'
import FinanzasCobranza from './components/FinanzasCobranza'
import FinanzasEgresos from './components/FinanzasEgresos'

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }
  
  return user ? children : <Navigate to="/login" />
}

// Componente para rutas públicas (solo accesibles si no está autenticado)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }
  
  return user ? <Navigate to="/dashboard" /> : children
}

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/ventas/consolidado-general" 
            element={
              <ProtectedRoute>
                <VentasConsolidadoGeneral />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/ventas/ventas" 
            element={
              <ProtectedRoute>
                <VentasDetallado />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/ventas/region-grupo-tipo" 
            element={
              <ProtectedRoute>
                <VentasRegionGrupoTipo />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/ventas/region-aliado-sku" 
            element={
              <ProtectedRoute>
                <VentasRegionAliadoSku />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/activacion/departamentos" 
            element={
              <ProtectedRoute>
                <ActivacionAliadosDepartamentos />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/activacion/grupos" 
            element={
              <ProtectedRoute>
                <ActivacionAliadosGrupos />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/activacion/marcas" 
            element={
              <ProtectedRoute>
                <ActivacionAliadosMarcas />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/activacion/sku" 
            element={
              <ProtectedRoute>
                <ActivacionAliadosSku />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/finanzas/rentabilidad" 
            element={
              <ProtectedRoute>
                <FinanzasRentabilidad />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/finanzas/cobranza" 
            element={
              <ProtectedRoute>
                <FinanzasCobranza />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/finanzas/egresos" 
            element={
              <ProtectedRoute>
                <FinanzasEgresos />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
