import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatAuthError, normalizePhone } from '../../utils/authErrors';

const RESTRICCIONES = [
  'Vegetariano',
  'Vegano',
  'Sin gluten',
  'Sin lactosa',
  'Sin nueces',
  'Sin mariscos',
  'Diabético'
];

const MyProfile = () => {
  const { user, updateUser, fetchUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [saving, setSaving] = useState(false);

  const initial = useMemo(() => {
    return {
      nombre: user?.nombre ?? '',
      apellido: user?.apellido ?? '',
      dni: String(user?.dni ?? '').replace(/ /g, '').trim(),
      email: user?.email ?? '',
      telefono: normalizePhone(user?.telefono),
      restriccionesAlimentarias: Array.isArray(user?.restriccionesAlimentarias) ? user.restriccionesAlimentarias : [],
      comoSeEntero: user?.comoSeEntero ?? ''
    };
  }, [user]);

  const [formData, setFormData] = useState(initial);

  useEffect(() => {
    setFormData(initial);
  }, [initial]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next =
      name === 'dni'
        ? value.replace(/ /g, '').trim()
        : name === 'telefono'
          ? value.replace(/\s/g, '').trim()
          : value;
    setFormData(prev => ({ ...prev, [name]: next }));
  };

  const handleRestriccionChange = (restriccion) => {
    setFormData(prev => {
      const restricciones = prev.restriccionesAlimentarias || [];
      if (restricciones.includes(restriccion)) {
        return {
          ...prev,
          restriccionesAlimentarias: restricciones.filter(r => r !== restriccion)
        };
      }
      return {
        ...prev,
        restriccionesAlimentarias: [...restricciones, restriccion]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        dni: String(formData.dni ?? '').replace(/ /g, '').trim(),
        telefono: normalizePhone(formData.telefono),
        restriccionesAlimentarias: formData.restriccionesAlimentarias || [],
        comoSeEntero: formData.comoSeEntero
      };

      const res = await axios.patch('/users/me', payload);
      const next = res.data?.user;
      if (next) {
        updateUser(next);
      } else {
        updateUser(payload);
        await fetchUser();
      }
      showSuccess('Tu perfil se guardó correctamente');
    } catch (error) {
      showError(formatAuthError(error, 'No se pudo guardar tu perfil'));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-light-bg py-12 px-4">
      <div className="max-w-2xl mx-auto card">
        <h1 className="text-3xl font-bold text-primary mb-2">Mi perfil</h1>
        <p className="text-gray-600 mb-6">
          Actualizá tus datos. Tus intereses se administran desde <Link to="/my-interests" className="text-primary font-medium">Mis intereses</Link>.
        </p>

        {user.estado === 'pending' && (
          <div className="alert alert-info mb-6">
            <p className="text-base">
              Tu usuario está en validación. Podés completar/ajustar tu perfil mientras esperás la aprobación.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="my-profile-nombre">Nombre</label>
            <input
              id="my-profile-nombre"
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              className="bg-white"
              autoComplete="given-name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="my-profile-apellido">Apellido</label>
            <input
              id="my-profile-apellido"
              type="text"
              name="apellido"
              value={formData.apellido}
              onChange={handleChange}
              required
              className="bg-white"
              autoComplete="family-name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="my-profile-dni">DNI</label>
            <input
              id="my-profile-dni"
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
            <label htmlFor="my-profile-email">Email</label>
            <input
              id="my-profile-email"
              type="email"
              name="email"
              value={formData.email}
              disabled
              className="bg-white opacity-80 cursor-not-allowed"
            />
            <p className="text-sm text-gray-500 mt-1">
              Para cambiar tu email, escribinos.
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="my-profile-telefono">Teléfono</label>
            <input
              id="my-profile-telefono"
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
            <label className="mb-2 block">Toda la comida es Kosher. ¿Tenés algún tipo de restricción?</label>
            <div className="space-y-2.5">
              {RESTRICCIONES.map((restriccion) => (
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
            <label htmlFor="my-profile-comoSeEntero">¿Cómo te enteraste de esta propuesta?</label>
            <input
              id="my-profile-comoSeEntero"
              type="text"
              name="comoSeEntero"
              value={formData.comoSeEntero}
              onChange={handleChange}
              placeholder="Escribe cómo te enteraste..."
              className="bg-white"
            />
          </div>

          <div className="flex items-center justify-between gap-3 mt-6">
            <Link to="/my-interests" className="btn btn-secondary">
              Mis intereses
            </Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MyProfile;

