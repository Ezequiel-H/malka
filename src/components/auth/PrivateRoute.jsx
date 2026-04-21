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

  const needsApproval = requireApproved && user.role !== 'admin' && user.estado !== 'approved';

  if (needsApproval) {
    return (
      <div className="min-h-screen bg-light-bg py-8 sm:py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl min-w-0">
          <div className="card">
            <h1 className="mb-5 text-2xl font-bold text-primary sm:mb-6 sm:text-3xl md:text-4xl break-words">
              Bienvenido, {user?.nombre} {user?.apellido}
            </h1>
            <div className="alert alert-info">
              <h2 className="mb-2 text-lg font-semibold sm:text-xl">Tu usuario está siendo validado</h2>
              <p className="text-base">
                Tu cuenta está siendo validada por nuestro equipo. Este proceso puede tardar unos días. Podrás
                acceder a las actividades una vez que tu cuenta sea aprobada.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default PrivateRoute;

