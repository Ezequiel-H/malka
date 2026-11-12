import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Alert, Button, Field, Input } from '../../components/ui';
import { DotsAccess, useDotsAccess } from '../../components/auth/dots_access';
import logoMalka from '../../assets/logo-malka-positivo.png';
import { SelectorIdioma, useIdioma } from '../../i18n';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const dots = useDotsAccess();
  const { t } = useIdioma();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password, { beforeEnter: dots.succeed });

    if (!result.success) {
      setError(result.message);
      setLoading(false);
      dots.fail();
    }
    // Tras login exitoso, App renderiza PostAuthRedirect en /login
  };

  return (
    <>
      {/* El logo es latino en todos los idiomas; el selector va enfrente. */}
      <div className="flex items-center justify-between gap-4">
        <img src={logoMalka} alt="Malka" className="h-12 w-auto sm:h-14" />
        <SelectorIdioma />
      </div>
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {t('login.titulo')}
        </h1>
        <p className="mt-2 text-base text-ink-soft">{t('login.subtitulo')}</p>
      </header>

      <div>
        {error && (
          <Alert tone="danger" className="mb-5">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Field label={t('login.email')} htmlFor="login-email">
            <Input
              type="email"
              icon="mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </Field>

          <Field label={t('login.contrasena')} htmlFor="login-password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </Field>

          <Button type="submit" size="lg" fullWidth loading={loading}>
            {loading ? t('login.entrando') : t('login.entrar')}
          </Button>
        </form>
      </div>

      <div className="flex flex-col gap-2 text-sm text-ink-muted">
        <p>
          {t('login.sinCuenta')}{' '}
          <Button variant="link" size="sm" to="/register" className="px-0 py-0 min-h-0 align-baseline">
            {t('login.registrate')}
          </Button>
        </p>
        <p className="hidden text-xs sm:block">
          <a
            href="https://casamalka.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-700 underline-offset-2 transition-control duration-fast hover:underline"
          >
            casamalka.org
          </a>
          {' · '}
          {t('login.casaAbierta')}
        </p>
      </div>
    </>
  );
};

const Login = () => (
  <DotsAccess name="Malka" markSrc={logoMalka}>
    <LoginForm />
  </DotsAccess>
);

export default Login;
