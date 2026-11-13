import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingScreen from '../layout/LoadingScreen';
import { Alert } from '../ui';

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
      <div className="min-h-screen bg-surface-page px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto min-w-0 max-w-lg">
          <Alert tone="danger" title="Acceso denegado">
            No tenés permisos para acceder a esta sección.
          </Alert>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;

