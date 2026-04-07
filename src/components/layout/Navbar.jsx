import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logoMalka from '../../assets/logo-malka-positivo.png';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md mb-8 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-5 py-4">
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 cursor-pointer bg-transparent border-none p-0"
            type="button"
          >
            <img src={logoMalka} alt="Malka" className="h-10 w-auto" />
            <span className="sr-only">Malka</span>
          </button>
          <div className="flex items-center gap-6">
            {user?.role === 'admin' ? (
              <>
                <button
                  onClick={() => navigate('/admin/users')}
                  className="text-gray-700 font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0"
                  type="button"
                >
                  Usuarios
                </button>
                <button
                  onClick={() => navigate('/admin/activities')}
                  className="text-gray-700 font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0"
                  type="button"
                >
                  Actividades
                </button>
                <button
                  onClick={() => navigate('/admin/inscriptions')}
                  className="text-gray-700 font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0"
                  type="button"
                >
                  Inscripciones
                </button>
                <button
                  onClick={() => navigate('/admin/tags')}
                  className="text-gray-700 font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0"
                  type="button"
                >
                  Tags
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/my-profile')}
                  className="text-gray-700 font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0"
                  type="button"
                >
                  Mi perfil
                </button>
                <button
                  onClick={() => navigate('/activities')}
                  className="text-gray-700 font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0"
                  type="button"
                >
                  Actividades
                </button>
                <button
                  onClick={() => navigate('/my-interests')}
                  className="text-gray-700 font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0"
                  type="button"
                >
                  Mis intereses
                </button>
                <button
                  onClick={() => navigate('/my-inscriptions')}
                  className="text-gray-700 font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0"
                  type="button"
                >
                  Mis Inscripciones
                </button>
              </>
            )}
            <span className="ml-4 text-gray-600 font-medium">
              {user?.nombre} {user?.apellido}
            </span>
            <button onClick={handleLogout} className="btn btn-secondary">
              Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

