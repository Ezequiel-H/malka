import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatAuthError, normalizePhone } from '../../utils/authErrors';
import { birthDateToInputValue, formatLocalDateToString } from '../../utils/dateUtils';
import PageContainer from '../../components/layout/PageContainer';
import { Alert, Button, Card, Checkbox, DatePicker, Field, Input } from '../../components/ui';

const RESTRICCIONES = [
  'Vegetariano',
  'Vegano',
  'Sin TACC',
  'Sin lactosa',
  'Sin nueces',
  'Diabético'
];

const MyProfile = () => {
  const { user, updateUser, fetchUser, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initial = useMemo(() => {
    return {
      nombre: user?.nombre ?? '',
      apellido: user?.apellido ?? '',
      fechaNacimiento: birthDateToInputValue(user?.fechaNacimiento),
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

    // El DatePicker guarda en un input hidden y el navegador no valida hidden:
    // el `required` del Field es sólo visual, así que la fecha va a mano.
    if (!formData.fechaNacimiento) {
      showError('Completá tu fecha de nacimiento antes de guardar');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        fechaNacimiento: formData.fechaNacimiento,
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
    <PageContainer title="Mi perfil" maxWidth="2xl">
      <Card>
        <p className="mb-6 text-ink-muted">
          Actualizá tus datos. Tus intereses se administran desde{' '}
          <Button variant="link" size="sm" to="/my-interests" className="min-h-0 px-0 py-0 align-baseline">
            Mis intereses
          </Button>
          .
        </p>

        {user.estado === 'pending' && (
          <Alert tone="info" className="mb-6" title="Tu usuario está en validación">
            Podés completar y ajustar tu perfil mientras esperás la aprobación.
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Field label="Nombre" htmlFor="my-profile-nombre" required>
            <Input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              autoComplete="given-name"
            />
          </Field>

          <Field label="Apellido" htmlFor="my-profile-apellido" required>
            <Input
              type="text"
              name="apellido"
              value={formData.apellido}
              onChange={handleChange}
              required
              autoComplete="family-name"
            />
          </Field>

          <Field label="Fecha de nacimiento" htmlFor="my-profile-fechaNacimiento" required>
            <DatePicker
              id="my-profile-fechaNacimiento"
              name="fechaNacimiento"
              value={formData.fechaNacimiento}
              onChange={(fechaNacimiento) =>
                setFormData((previo) => ({ ...previo, fechaNacimiento }))
              }
              max={formatLocalDateToString(new Date())}
            />
          </Field>

          <Field
            label="DNI"
            htmlFor="my-profile-dni"
            hint="Entre 7 y 10 dígitos, sin puntos"
            required
          >
            <Input
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
            />
          </Field>

          <Field
            label="Email"
            htmlFor="my-profile-email"
            hint="Para cambiar tu email, escribinos."
          >
            <Input type="email" icon="mail" name="email" value={formData.email} disabled />
          </Field>

          <Field
            label="Teléfono"
            htmlFor="my-profile-telefono"
            hint="Al menos 8 dígitos. Podés incluir + y código de país"
            required
          >
            <Input
              type="tel"
              icon="phone"
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
            />
          </Field>

          {/* <fieldset> + <legend>: hace que la pregunta se anuncie una vez
              antes del grupo, en vez de repetirse en cada casilla. */}
          <fieldset className="mb-5">
            <legend className="mb-2 block text-sm font-medium text-ink-soft">
              Toda la comida es Kosher. ¿Tenés algún tipo de restricción?
            </legend>
            <div className="space-y-2.5">
              {RESTRICCIONES.map((restriccion) => (
                <Checkbox
                  key={restriccion}
                  label={restriccion}
                  checked={formData.restriccionesAlimentarias?.includes(restriccion) || false}
                  onChange={() => handleRestriccionChange(restriccion)}
                />
              ))}
            </div>
          </fieldset>

          <Field
            label="¿Cómo te enteraste de esta propuesta?"
            htmlFor="my-profile-comoSeEntero"
            required
          >
            <Input
              type="text"
              name="comoSeEntero"
              value={formData.comoSeEntero}
              onChange={handleChange}
              placeholder="Escribí cómo te enteraste..."
              required
            />
          </Field>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="secondary" to="/my-interests" className="w-full sm:w-auto">
              Mis intereses
            </Button>
            <Button type="submit" loading={saving} className="w-full sm:w-auto">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>

        {/* En mobile no hay sidebar ni drawer: el logout vive acá. */}
        <div className="mt-6 border-t border-surface-border pt-4 lg:hidden">
          <Button
            variant="ghost"
            icon="logout"
            onClick={handleLogout}
            fullWidth
            className="text-danger-600 hover:bg-danger-50 hover:text-danger-700"
          >
            Cerrar sesión
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
};

export default MyProfile;
