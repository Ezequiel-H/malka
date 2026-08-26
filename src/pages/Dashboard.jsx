import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import PageContainer from '../components/layout/PageContainer';
import BirthDatePrompt from '../components/profile/BirthDatePrompt';
import { Alert, Button, Card } from '../components/ui';

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
      <Card>
        <h1 className="mb-5 break-words text-2xl font-semibold tracking-tight text-ink sm:mb-6 sm:text-3xl">
          Te damos la bienvenida, {user?.nombre} {user?.apellido}
        </h1>

        <BirthDatePrompt className="mb-5 sm:mb-6" />

        {user?.estado === 'pending' && (
          <Alert
            tone="info"
            title="Tu usuario está siendo validado"
            titleAs="h2"
            action={
              <Button variant="secondary" size="sm" to="/my-interests">
                Mis intereses
              </Button>
            }
          >
            Tu cuenta está siendo validada por nuestro equipo. Este proceso puede tardar unos días.
            Una vez aprobada, vas a poder inscribirte en las actividades.
          </Alert>
        )}
      </Card>
    </PageContainer>
  );
};

export default Dashboard;
