import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

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
            className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer bg-transparent border-none p-0"
            type="button"
          >
            Centro Cultural
          </button>
          <div className="flex items-center gap-6">
            {user?.role === 'admin' ? (
              <>
                <button
                  onClick={() => navigate('/admin')}
                  className="text-gray-700 font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0"
                  type="button"
                >
                  Admin
                </button>
                <button
                  onClick={() => navigate('/admin/users/pending')}
                  className="text-gray-700 font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0"
                  type="button"
                >
                  Usuarios Pendientes
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
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/activities')}
                  className="text-gray-700 font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0"
                  type="button"
                >
                  Actividades
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

