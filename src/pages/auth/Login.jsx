import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

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
    <div className="min-h-screen bg-light-bg flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="card">
          <h1 className="text-3xl font-bold text-center mb-6 text-primary">Iniciar Sesión</h1>
          
          {error && (
            <div className="alert alert-error">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white"
              />
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            ¿No tienes cuenta? <Link to="/register" className="text-primary hover:text-primary/80 font-medium">Regístrate aquí</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

