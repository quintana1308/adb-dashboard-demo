import { useState } from 'react';
import { User, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logoImg from '../assets/logo-demo-login.svg';
import Footer from './Footer';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await signIn(formData.email, formData.password);
      
      if (error) {
        setError('Credenciales inválidas. Por favor, verifica tu email y contraseña.');
      } else if (data.user) {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Error de conexión. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative" style={{ backgroundColor: '#f8fafc' }}>
      {/* Patrón de fondo sutil */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233b82f6' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 relative">
        {/* Elementos decorativos minimalistas */}
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full opacity-10" style={{ backgroundColor: '#3b82f6' }}></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 rounded-full opacity-10" style={{ backgroundColor: '#10b981' }}></div>
        
        {/* Tarjeta de login */}
        <div className="relative bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10 w-full max-w-md">
          {/* Barra decorativa superior */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-1 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
          
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src={logoImg} 
              alt="Demo Dashboard" 
              className="h-16 mx-auto mb-6"
            />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Bienvenido</h1>
            <p className="text-gray-500 text-sm">Ingresa tus credenciales para continuar</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Usuario */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="tu@email.com"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-opacity-50 outline-none transition-all bg-gray-50 hover:bg-white focus:bg-white text-gray-800"
                  style={{ 
                    '--tw-ring-color': '#3b82f6'
                  }}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Campo Clave */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-opacity-50 outline-none transition-all bg-gray-50 hover:bg-white focus:bg-white text-gray-800"
                  style={{ 
                    '--tw-ring-color': '#3b82f6'
                  }}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Botón Entrar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purolomo-red text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Iniciando sesión...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Login;
