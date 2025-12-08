import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role !== 'admin') {
    return (
      <div className="container">
        <div className="alert alert-error">
          <h2>Acceso denegado</h2>
          <p>No tienes permisos para acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;

