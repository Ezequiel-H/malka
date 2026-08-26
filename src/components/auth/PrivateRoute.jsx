import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { setAuthRedirect } from '../../utils/authRedirect';
import LoadingScreen from '../layout/LoadingScreen';
import { Alert, Card } from '../ui';

const PrivateRoute = ({ children, requireApproved = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    const returnPath = `${location.pathname}${location.search}`;
    setAuthRedirect(returnPath);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const needsApproval = requireApproved && user.role !== 'admin' && user.estado !== 'approved';

  if (needsApproval) {
    return (
      <div className="min-h-screen bg-surface-page px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto min-w-0 max-w-4xl">
          <Card>
            <h1 className="mb-5 break-words text-2xl font-semibold tracking-tight text-ink sm:mb-6 sm:text-3xl">
              Te damos la bienvenida, {user?.nombre} {user?.apellido}
            </h1>
            <Alert tone="info" title="Tu usuario está siendo validado" titleAs="h2">
              Tu cuenta está siendo validada por nuestro equipo. Este proceso puede tardar unos
              días. Una vez aprobada, vas a poder inscribirte en las actividades.
            </Alert>
          </Card>
        </div>
      </div>
    );
  }

  return children;
};

export default PrivateRoute;

