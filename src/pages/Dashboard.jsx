import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

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
    <div className="min-h-screen bg-light-bg py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <h1 className="text-3xl font-bold mb-6 text-primary">
            Bienvenido, {user?.nombre} {user?.apellido}
          </h1>
          {user?.estado === 'pending' && (
            <div className="alert alert-info">
              <h2 className="text-xl font-semibold mb-2">Tu usuario está siendo validado</h2>
              <p className="text-base">Tu cuenta está siendo validada por nuestro equipo. Este proceso puede tardar unos días. Podrás acceder a las actividades una vez que tu cuenta sea aprobada.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

