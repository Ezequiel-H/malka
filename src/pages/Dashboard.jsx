import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import PageContainer from '../components/layout/PageContainer';
import BirthDatePrompt from '../components/profile/BirthDatePrompt';
import DatosFaltantesPrompt from '../components/profile/DatosFaltantesPrompt';
import CompletarPorWhatsapp from '../components/profile/CompletarPorWhatsapp';
import { Alert, Button, Card } from '../components/ui';
import { useIdioma } from '../i18n';

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useIdioma();
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
          {t('bienvenida.titulo', { nombre: [user?.nombre, user?.apellido].filter(Boolean).join(' ') })}
        </h1>

        <BirthDatePrompt className="mb-5 sm:mb-6" />
        <DatosFaltantesPrompt className="mb-5 sm:mb-6" />

        <CompletarPorWhatsapp className="mb-5 sm:mb-6" />

        {user?.estado === 'pending' && (
          <Alert
            tone="info"
            title={t('bienvenida.validandoTitulo')}
            titleAs="h2"
            action={
              <Button variant="secondary" size="sm" to="/my-interests">
                {t('bienvenida.misIntereses')}
              </Button>
            }
          >
            {t('bienvenida.validandoTexto')}
          </Alert>
        )}
      </Card>
    </PageContainer>
  );
};

export default Dashboard;
