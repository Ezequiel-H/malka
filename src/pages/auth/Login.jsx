import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logoMalka from '../../assets/logo-malka-positivo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      const { user } = result;
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.estado === 'approved') {
        navigate('/activities');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#fdfaf5] via-light-bg to-[#ebe4d8]">
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
          <img
            src={logoMalka}
            alt="Malka"
            className="mb-8 h-14 w-auto sm:h-16"
          />
          <h1 className="font-display text-[1.65rem] font-semibold leading-snug tracking-tight text-malka-ink sm:text-3xl md:text-[2.15rem]">
            El punto de encuentro para tu identidad judía
          </h1>
        </header>

        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-primary/15 bg-white/95 p-6 shadow-xl shadow-primary/5 backdrop-blur-sm sm:p-8">
            <h2 className="mb-6 text-center font-display text-xl font-semibold text-primary sm:text-2xl">
              Iniciar sesión
            </h2>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="bg-[#fffcf7]"
                />
              </div>

              <div className="form-group">
                <label htmlFor="login-password">Contraseña</label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="bg-[#fffcf7]"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full rounded-xl py-3 text-base shadow-md"
                disabled={loading}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-600">
              ¿No tenés cuenta?{' '}
              <Link
                to="/register"
                className="font-medium text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:text-primary/90 hover:decoration-primary/60"
              >
                Registrate aquí
              </Link>
            </p>
          </div>

          <p className="mt-10 text-center text-xs text-gray-500">
            <a
              href="https://casamalka.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/80 underline-offset-2 transition-colors hover:text-primary hover:underline"
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
