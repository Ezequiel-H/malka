import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-light-bg">
        <div className="spinner" />
        <p className="mt-4 text-gray-600">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-light-bg px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-lg min-w-0">
          <div className="alert alert-error">
            <h2 className="text-lg font-semibold sm:text-xl">Acceso denegado</h2>
            <p className="mt-2 text-base">No tienes permisos para acceder a esta sección.</p>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;

