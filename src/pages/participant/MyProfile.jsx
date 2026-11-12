import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatAuthError, normalizePhone } from '../../utils/authErrors';
import { birthDateToInputValue, formatLocalDateToString } from '../../utils/dateUtils';
import PageContainer from '../../components/layout/PageContainer';
import NotificationSettings from '../../components/profile/NotificationSettings';
import { Alert, Button, Card, Checkbox, DatePicker, Field, Input } from '../../components/ui';
import { invalidEs } from '../../utils/formValidation';
import { SelectorIdioma, useIdioma } from '../../i18n';
import { RESTRICCIONES } from '../../utils/restricciones';


const MyProfile = () => {
  const { user, updateUser, fetchUser, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const { t } = useIdioma();
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
      showError(t('perfil.faltaFecha'));
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
      showSuccess(t('perfil.guardado'));
    } catch (error) {
      showError(formatAuthError(error, t('perfil.error')));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <PageContainer title={t('shell.links.perfil')} maxWidth="2xl">
      <Card>
        <p className="mb-6 text-ink-muted">
          {t('perfil.intro')}{' '}
          <Button variant="link" size="sm" to="/my-interests" className="min-h-0 px-0 py-0 align-baseline">
            {t('shell.links.intereses')}
          </Button>
          .
        </p>

        {user.estado === 'pending' && (
          <Alert tone="info" className="mb-6" title={t('perfil.validandoTitulo')}>
            {t('perfil.validandoTexto')}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Field label={t('registro.nombre')} htmlFor="my-profile-nombre" required>
            <Input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              autoComplete="given-name"
            />
          </Field>

          <Field label={t('registro.apellido')} htmlFor="my-profile-apellido" required>
            <Input
              type="text"
              name="apellido"
              value={formData.apellido}
              onChange={handleChange}
              required
              autoComplete="family-name"
            />
          </Field>

          <Field label={t('registro.fechaNacimiento')} htmlFor="my-profile-fechaNacimiento" required>
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
            label={t('registro.dni')}
            htmlFor="my-profile-dni"
            hint={t('registro.dniAyuda')}
            required
          >
            <Input
              type="text"
              name="dni"
              dir="ltr"
              value={formData.dni}
              onChange={handleChange}
              required
              inputMode="numeric"
              autoComplete="off"
              minLength={7}
              maxLength={10}
              pattern="\d{7,10}"
              title={t('registro.dniInvalido')}
              {...invalidEs(t('registro.dniAyuda'))}
            />
          </Field>

          <Field
            label={t('registro.email')}
            htmlFor="my-profile-email"
            hint={t('perfil.emailAyuda')}
          >
            <Input type="email" icon="mail" name="email" dir="ltr" value={formData.email} disabled />
          </Field>

          <Field
            label={t('registro.telefono')}
            htmlFor="my-profile-telefono"
            hint={t('registro.telefonoAyuda')}
            required
          >
            <Input
              type="tel"
              icon="phone"
              name="telefono"
              dir="ltr"
              value={formData.telefono}
              onChange={handleChange}
              required
              inputMode="tel"
              autoComplete="tel"
              minLength={8}
              maxLength={22}
              pattern="^[+]?[0-9]{8,20}$"
              title={t('registro.telefonoInvalido')}
              {...invalidEs(t('registro.telefonoInvalido'))}
            />
          </Field>

          {/* <fieldset> + <legend>: hace que la pregunta se anuncie una vez
              antes del grupo, en vez de repetirse en cada casilla. */}
          <fieldset className="mb-5">
            <legend className="mb-2 block text-sm font-medium text-ink-soft">
              {t('registro.restriccionesPregunta')}
            </legend>
            <div className="space-y-2.5">
              {RESTRICCIONES.map(({ valor, clave }) => (
                <Checkbox
                  key={valor}
                  label={t(`registro.restricciones.${clave}`)}
                  checked={formData.restriccionesAlimentarias?.includes(valor) || false}
                  onChange={() => handleRestriccionChange(valor)}
                />
              ))}
            </div>
          </fieldset>

          <Field
            label={t('registro.comoTeEnteraste')}
            htmlFor="my-profile-comoSeEntero"
            required
          >
            <Input
              type="text"
              name="comoSeEntero"
              value={formData.comoSeEntero}
              onChange={handleChange}
              placeholder={t('registro.comoTeEnterastePlaceholder')}
              required
            />
          </Field>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="secondary" to="/my-interests" className="w-full sm:w-auto">
              {t('shell.links.intereses')}
            </Button>
            <Button type="submit" loading={saving} className="w-full sm:w-auto">
              {saving ? t('comun.guardando') : t('perfil.guardar')}
            </Button>
          </div>
        </form>

        {/* El idioma se guarda en la cuenta: vale en cualquier dispositivo. */}
        <section className="mt-6 border-t border-surface-border pt-6" aria-labelledby="perfil-idioma">
          <h2 id="perfil-idioma" className="mb-1 text-lg font-semibold text-ink">
            {t('comun.idioma')}
          </h2>
          <p className="mb-3 text-sm text-ink-muted">{t('perfil.idiomaTexto')}</p>
          <SelectorIdioma className="-ms-2" />
        </section>

        <NotificationSettings className="mt-6 border-t border-surface-border pt-6" />

        {/* En mobile no hay sidebar ni drawer: el logout vive acá. */}
        <div className="mt-6 border-t border-surface-border pt-4 lg:hidden">
          <Button
            variant="ghost"
            icon="logout"
            onClick={handleLogout}
            fullWidth
            className="text-danger-600 hover:bg-danger-50 hover:text-danger-700"
          >
            {t('perfil.cerrarSesion')}
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
};

export default MyProfile;
