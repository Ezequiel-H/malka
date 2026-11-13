import { useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatAuthError } from '../../utils/authErrors';
import { RESIDENCIAS, opcionesPaises } from '../../utils/paises';
import { Alert, Button, Field, Input, RadioGroup, Select } from '../ui';
import { useIdioma } from '../../i18n/IdiomaContext';

export const userNeedsDatosNuevos = (user) =>
  user?.role === 'participant' && (!user?.nacionalidad || !user?.residencia);

/**
 * Pide nacionalidad y dónde vive a quien se registró antes de que el
 * registro lo preguntara. Igual que la fecha de nacimiento: se contesta una
 * vez y el bloque desaparece solo. Si vive fuera de Buenos Aires pide la
 * ciudad, pero no lo manda a WhatsApp: su cuenta ya está hecha.
 */
const DatosFaltantesPrompt = ({ className = '' }) => {
  const { user, updateUser, fetchUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const { t, idioma } = useIdioma();
  const [datos, setDatos] = useState({ nacionalidad: '', residencia: '', ciudad: '' });
  const [saving, setSaving] = useState(false);
  const paises = useMemo(() => opcionesPaises(idioma), [idioma]);

  if (!userNeedsDatosNuevos(user)) return null;

  const fueraDeBuenosAires = datos.residencia && datos.residencia !== 'buenos_aires';
  const completo = datos.nacionalidad && datos.residencia && (!fueraDeBuenosAires || datos.ciudad.trim());

  const guardar = async (e) => {
    e.preventDefault();
    if (!completo) return;
    setSaving(true);
    try {
      const res = await axios.patch('/users/me', {
        nacionalidad: datos.nacionalidad,
        residencia: datos.residencia,
        ciudad: fueraDeBuenosAires ? datos.ciudad.trim() : '',
      });
      if (res.data?.user) updateUser(res.data.user);
      else await fetchUser();
      showSuccess(t('datosFaltantes.guardados'));
    } catch (error) {
      showError(formatAuthError(error, t('datosFaltantes.error')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Alert tone="info" title={t('datosFaltantes.titulo')} titleAs="h2" className={`min-w-0 ${className}`.trim()}>
      <p className="mb-4">{t('datosFaltantes.texto')}</p>
      <form onSubmit={guardar} className="flex w-full flex-col gap-3">
        <Field label={t('registro.nacionalidad')} htmlFor="datos-nacionalidad" required className="mb-0">
          <Select
            id="datos-nacionalidad"
            options={paises}
            value={datos.nacionalidad}
            onChange={(nacionalidad) => setDatos((d) => ({ ...d, nacionalidad: nacionalidad ?? '' }))}
            placeholder={t('registro.elegiPais')}
            searchable
          />
        </Field>
        <RadioGroup
          label={t('registro.dondeVivis')}
          name="datos-residencia"
          options={RESIDENCIAS.map((r) => ({ value: r.value, label: t(`registro.residencias.${r.value}`) }))}
          value={datos.residencia}
          onChange={(residencia) => setDatos((d) => ({ ...d, residencia }))}
        />
        {fueraDeBuenosAires && (
          <Field label={t('registro.ciudad')} htmlFor="datos-ciudad" required className="mb-0 animate-fade-in-up">
            <Input
              id="datos-ciudad"
              value={datos.ciudad}
              onChange={(e) => setDatos((d) => ({ ...d, ciudad: e.target.value }))}
              maxLength={80}
              autoComplete="address-level2"
            />
          </Field>
        )}
        <Button type="submit" className="w-full justify-center" disabled={saving || !completo}>
          {saving ? t('comun.guardando') : t('comun.guardar')}
        </Button>
      </form>
    </Alert>
  );
};

export default DatosFaltantesPrompt;
