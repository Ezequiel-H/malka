import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PublicTagPicker from '../../components/tags/PublicTagPicker';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    restriccionesAlimentarias: [],
    comoSeEntero: ''
  });
  const [tags, setTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/tags?activa=true`);
        if (!res.ok) throw new Error('tags');
        const data = await res.json();
        if (!cancelled) {
          setAvailableTags(data.tags || []);
        }
      } catch {
        if (!cancelled) setAvailableTags([]);
      } finally {
        if (!cancelled) setTagsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next =
      name === 'dni'
        ? value.replace(/ /g, '').trim()
        : name === 'telefono'
          ? value.replace(/\s/g, '').trim()
          : value;
    setFormData({
      ...formData,
      [name]: next
    });
  };

  const handleRestriccionChange = (restriccion) => {
    setFormData(prev => {
      const restricciones = prev.restriccionesAlimentarias || [];
      if (restricciones.includes(restriccion)) {
        return {
          ...prev,
          restriccionesAlimentarias: restricciones.filter(r => r !== restriccion)
        };
      } else {
        return {
          ...prev,
          restriccionesAlimentarias: [...restricciones, restriccion]
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register({
      ...formData,
      dni: formData.dni.replace(/ /g, '').trim(),
      telefono: formData.telefono.replace(/\s/g, '').trim(),
      tags
    });
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-light-bg flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        <div className="card">
          <h1 className="text-3xl font-bold text-center mb-6 text-primary">Registro</h1>
          
          {error && (
            <div className="alert alert-error">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="bg-white"
              />
            </div>

            <div className="form-group">
              <label>Apellido</label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                required
                className="bg-white"
              />
            </div>

            <div className="form-group">
              <label>DNI</label>
              <input
                type="text"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                required
                inputMode="numeric"
                autoComplete="off"
                minLength={7}
                maxLength={10}
                pattern="\d{7,10}"
                title="Ingresá entre 7 y 10 dígitos"
                className="bg-white"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="bg-white"
              />
            </div>

            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                required
                inputMode="tel"
                autoComplete="tel"
                minLength={8}
                maxLength={22}
                pattern="^[+]?[0-9]{8,20}$"
                title="Ingresá un teléfono con al menos 8 dígitos (podés usar + y código de país)"
                className="bg-white"
              />
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="bg-white"
              />
            </div>

            <div className="form-group">
              <label className="mb-2 block">Toda la comida es Kosher. ¿Tenés algún tipo de restricción?</label>
              <div className="space-y-2.5">
                {['Vegetariano', 'Vegano', 'Sin gluten', 'Sin lactosa', 'Sin nueces', 'Sin mariscos', 'Diabético'].map((restriccion) => (
                  <label
                    key={restriccion}
                    className="flex max-w-none cursor-pointer items-center gap-3 font-normal"
                  >
                    <input
                      type="checkbox"
                      checked={formData.restriccionesAlimentarias?.includes(restriccion) || false}
                      onChange={() => handleRestriccionChange(restriccion)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-gray-700">{restriccion}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>¿Cómo te enteraste de esta propuesta?</label>
              <input
                type="text"
                name="comoSeEntero"
                value={formData.comoSeEntero}
                onChange={handleChange}
                placeholder="Escribe cómo te enteraste..."
                className="bg-white"
              />
            </div>

            <div className="form-group">
              <label>¿Qué te interesa?</label>
              <p className="text-sm text-gray-600 mb-2">
                Elegí una o más áreas (tags públicos). Podés cambiarlas después en &quot;Mis intereses&quot;.
              </p>
              {tagsLoading ? (
                <p className="text-sm text-gray-500">Cargando intereses...</p>
              ) : (
                <PublicTagPicker
                  availableTags={availableTags}
                  selectedNames={tags}
                  onChange={setTags}
                  emptyHint={
                    <p className="text-sm text-gray-500 mt-2">
                      Si no aparecen opciones, podés completar tus intereses luego desde tu cuenta.
                    </p>
                  }
                />
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            ¿Ya tienes cuenta? <Link to="/login" className="text-primary hover:text-primary/80 font-medium">Inicia sesión aquí</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

