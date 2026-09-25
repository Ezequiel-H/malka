import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatAuthError } from '../../utils/authErrors';
import { formatLocalDateToString } from '../../utils/dateUtils';
import { Alert, Button, DatePicker, Field } from '../ui';

export const userNeedsBirthDate = (user) =>
  user?.role === 'participant' && !user?.fechaNacimiento;

/**
 * Pedido de la fecha de nacimiento a quien se registró antes de que el campo
 * existiera. Se muestra una sola vez: en cuanto la guarda, `userNeedsBirthDate`
 * pasa a false y el bloque desaparece solo.
 */
const BirthDatePrompt = ({ className = '' }) => {
  const { user, updateUser, fetchUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [saving, setSaving] = useState(false);

  if (!userNeedsBirthDate(user)) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fechaNacimiento) return;

    setSaving(true);
    try {
      const res = await axios.patch('/users/me', { fechaNacimiento });
      const next = res.data?.user;
      if (next) {
        updateUser(next);
      } else {
        updateUser({ fechaNacimiento });
        await fetchUser();
      }
      showSuccess('Fecha de nacimiento guardada');
    } catch (error) {
      showError(formatAuthError(error, 'No se pudo guardar la fecha de nacimiento'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Alert
      tone="info"
      title="Completá tu fecha de nacimiento"
      titleAs="h2"
      className={`min-w-0 ${className}`.trim()}
    >
      <p className="mb-4">
        Necesitamos esta información para completar tu perfil. Solo tenés que ingresarla una vez.
      </p>
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
        <Field label="Fecha de nacimiento" htmlFor="birth-date-prompt" required className="mb-0">
          <DatePicker
            id="birth-date-prompt"
            name="fechaNacimiento"
            value={fechaNacimiento}
            onChange={setFechaNacimiento}
            max={formatLocalDateToString(new Date())}
          />
        </Field>
        <Button type="submit" className="w-full justify-center" disabled={saving || !fechaNacimiento}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </form>
    </Alert>
  );
};

export default BirthDatePrompt;
