import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import PageContainer from '../components/layout/PageContainer';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.estado === 'approved') {
        navigate('/activities');
      }
    }
  }, [user, navigate]);

  return (
    <PageContainer maxWidth="4xl">
        <div className="card">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-5 sm:mb-6 text-primary break-words">
            Bienvenido, {user?.nombre} {user?.apellido}
          </h1>
          {user?.estado === 'pending' && (
            <div className="alert alert-info">
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Tu usuario está siendo validado</h2>
              <p className="text-base mb-4">
                Tu cuenta está siendo validada por nuestro equipo. Este proceso puede tardar unos días. Podrás acceder a
                las actividades una vez que tu cuenta sea aprobada.
              </p>
              <Link to="/my-interests" className="btn btn-secondary w-full justify-center sm:inline-flex sm:w-auto">
                Mis intereses
              </Link>
            </div>
          )}
        </div>
    </PageContainer>
  );
};

export default Dashboard;

