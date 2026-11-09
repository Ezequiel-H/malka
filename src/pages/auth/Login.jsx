import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Alert, Button, Field, Input } from '../../components/ui';
import { DotsAccess, useDotsAccess } from '../../components/auth/dots_access';
import logoMalka from '../../assets/logo-malka-positivo.png';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const dots = useDotsAccess();

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
      <img src={logoMalka} alt="Malka" className="h-12 w-auto self-start sm:h-14" />
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Iniciar sesión
        </h1>
        <p className="mt-2 text-base text-ink-soft">El punto de encuentro para tu identidad judía</p>
      </header>

      <div>
        {error && (
          <Alert tone="danger" className="mb-5">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Field label="Email" htmlFor="login-email">
            <Input
              type="email"
              icon="mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </Field>

          <Field label="Contraseña" htmlFor="login-password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </Field>

          <Button type="submit" size="lg" fullWidth loading={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </Button>
        </form>
      </div>

      <div className="flex flex-col gap-2 text-sm text-ink-muted">
        <p>
          ¿No tenés cuenta?{' '}
          <Button variant="link" size="sm" to="/register" className="px-0 py-0 min-h-0 align-baseline">
            Registrate aquí
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
          Casa abierta para la comunidad
        </p>
      </div>
    </>
  );
};

const Login = () => (
  <DotsAccess name="Malka">
    <LoginForm />
  </DotsAccess>
);

export default Login;
