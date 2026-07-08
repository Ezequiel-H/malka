import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingScreen from '../layout/LoadingScreen';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
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

