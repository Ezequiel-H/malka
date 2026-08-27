import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatAuthError } from '../../utils/authErrors';
import { formatLocalDateToString } from '../../utils/dateUtils';

export const userNeedsBirthDate = (user) =>
  user?.role === 'participant' && !user?.fechaNacimiento;

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
    <div className={`alert alert-info min-w-0 overflow-hidden ${className}`.trim()}>
      <h2 className="text-lg sm:text-xl font-semibold mb-2">Completá tu fecha de nacimiento</h2>
      <p className="text-base mb-4">
        Necesitamos esta información para completar tu perfil. Solo tenés que ingresarla una vez.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col items-start gap-3 sm:flex-row sm:items-end">
        <div className="form-group mb-0 min-w-0">
          <label htmlFor="birth-date-prompt">Fecha de nacimiento</label>
          <input
            id="birth-date-prompt"
            type="date"
            name="fechaNacimiento"
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
            required
            max={formatLocalDateToString(new Date())}
            className="bg-white form-input-date"
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary w-full justify-center sm:w-auto sm:self-end"
          disabled={saving || !fechaNacimiento}
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </div>
  );
};

export default BirthDatePrompt;
