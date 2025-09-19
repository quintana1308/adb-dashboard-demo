const Footer = () => {
  return (
    <footer className="bg-transparent mt-auto">
      <div className="max-w-full px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs sm:text-sm text-gray-600 space-y-2 sm:space-y-0">
          <div className="text-center sm:text-left font-medium">
            © 2025, Desarrollado por ADN Software
          </div>
          <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-6 text-center">
            <a 
              href="https://sistemasadn.com/software-gestion/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-gray-800 transition-colors font-medium"
            >
              Software de Gestión
            </a>
            <a 
              href="https://sistemasadn.com/contacto/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-gray-800 transition-colors font-medium"
            >
              Contacto
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
