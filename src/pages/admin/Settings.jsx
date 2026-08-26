import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';
import LoadingScreen from '../../components/layout/LoadingScreen';
import PageContainer from '../../components/layout/PageContainer';
import { Button, Card, Field, Textarea } from '../../components/ui';

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
    return <LoadingScreen message="Cargando ajustes..." />;
  }

  return (
    <PageContainer title="Ajustes" maxWidth="3xl">
      <Card as="form" onSubmit={handleSubmit}>
        <Field
          label="Instrucciones de pago por defecto"
          hint="Se muestran al inscribirse en actividades pagas que no tengan instrucciones propias. El precio ya se ve en la actividad; acá sólo indicá dónde transferir (alias, CBU, titular, etc.)."
        >
          <Textarea
            value={instruccionesPagoDefault}
            onChange={(e) => setInstruccionesPagoDefault(e.target.value)}
            rows={8}
            placeholder="Ej: Transferí a Alias: MALKA.ACTIVIDADES - CBU: 0000003100012345678901 - Titular: ..."
          />
        </Field>

        <div className="flex justify-end">
          <Button type="submit" icon="check" loading={saving}>
            {saving ? 'Guardando...' : 'Guardar ajustes'}
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
};

export default Settings;
