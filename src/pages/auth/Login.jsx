import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Alert, Button, Field, Input } from '../../components/ui';
import logoMalka from '../../assets/logo-malka-positivo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (!result.success) {
      setError(result.message);
    }
    // Tras login exitoso, App renderiza PostAuthRedirect en /login

    setLoading(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-surface-sunken via-surface-page to-surface-border">
      {/* Textura suave tipo “casa” / papel */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage: `radial-gradient(circle at 20% 20%, rgba(104, 155, 120, 0.12) 0%, transparent 45%),
            radial-gradient(circle at 80% 80%, rgba(104, 155, 120, 0.08) 0%, transparent 40%),
            radial-gradient(circle at 50% 100%, rgba(235, 228, 216, 0.9) 0%, transparent 55%)`,
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6">
        <header className="mb-10 flex w-full max-w-lg flex-col items-center text-center">
          <img src={logoMalka} alt="Malka" className="mb-8 h-14 w-auto sm:h-16" />
          <h1 className="font-display text-[1.65rem] font-semibold leading-snug tracking-tight text-ink sm:text-3xl md:text-[2.15rem]">
            El punto de encuentro para tu identidad judía
          </h1>
        </header>

        <div className="w-full max-w-md">
          <div className="rounded-panel border border-primary/15 bg-surface/95 p-6 shadow-raised backdrop-blur-sm sm:p-8">
            <h2 className="mb-6 text-center font-display text-xl font-semibold text-primary sm:text-2xl">
              Iniciar sesión
            </h2>

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

            <p className="mt-8 text-center text-sm text-ink-muted">
              ¿No tenés cuenta?{' '}
              <Button variant="link" size="sm" to="/register" className="px-0 py-0 min-h-0 align-baseline">
                Registrate aquí
              </Button>
            </p>
          </div>

          <p className="mt-10 text-center text-xs text-ink-faint">
            <a
              href="https://casamalka.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/80 underline-offset-2 transition-control duration-fast hover:text-primary hover:underline"
            >
              casamalka.org
            </a>
            {' · '}
            Casa abierta para la comunidad
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
