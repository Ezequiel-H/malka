import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PrivateRoute = ({ children, requireApproved = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-light-bg flex flex-col items-center justify-center">
        <div className="spinner"></div>
        <p className="mt-4 text-gray-600">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Mostrar cartel de validación si el usuario no está aprobado (excepto admins)
  if (user.role !== 'admin' && user.estado !== 'approved') {
    return (
      <div className="min-h-screen bg-light-bg py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="card">
            <h1 className="text-3xl font-bold mb-6 text-primary">
              Bienvenido, {user?.nombre} {user?.apellido}
            </h1>
            <div className="alert alert-info">
              <h2 className="text-xl font-semibold mb-2">Tu usuario está siendo validado</h2>
              <p className="text-base">Tu cuenta está siendo validada por nuestro equipo. Este proceso puede tardar unos días. Podrás acceder a las actividades una vez que tu cuenta sea aprobada.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default PrivateRoute;

