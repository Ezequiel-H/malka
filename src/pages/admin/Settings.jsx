import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';

const Settings = () => {
  const { showSuccess, showError } = useToast();
  const [instruccionesPagoDefault, setInstruccionesPagoDefault] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/settings');
      setInstruccionesPagoDefault(response.data.settings?.instruccionesPagoDefault || '');
    } catch (error) {
      showError('Error al cargar ajustes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await axios.put('/settings', { instruccionesPagoDefault });
      showSuccess('Ajustes guardados');
    } catch (error) {
      showError(error.response?.data?.message || 'Error al guardar ajustes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light-bg flex flex-col items-center justify-center">
        <div className="spinner"></div>
        <p className="mt-4 text-gray-600">Cargando ajustes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto min-w-0">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-primary">
          Ajustes
        </h1>

        <form onSubmit={handleSubmit} className="card">
          <div className="form-group">
            <label>Instrucciones de pago por defecto</label>
            <p className="text-sm text-gray-600 mb-2">
              Se muestran al inscribirse en actividades pagas que no tengan instrucciones propias.
              El precio ya se ve en la actividad; acá solo indicá dónde transferir (alias, CBU, titular, etc.).
            </p>
            <textarea
              value={instruccionesPagoDefault}
              onChange={(e) => setInstruccionesPagoDefault(e.target.value)}
              rows={8}
              className="bg-white"
              placeholder="Ej: Transferí a Alias: MALKA.ACTIVIDADES - CBU: 0000003100012345678901 - Titular: ..."
            />
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar ajustes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
