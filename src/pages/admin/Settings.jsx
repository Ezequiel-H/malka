import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';
import LoadingScreen from '../../components/layout/LoadingScreen';
import PageContainer from '../../components/layout/PageContainer';
import { PLANTILLA_VARIABLES } from '../../utils/whatsapp';
import { Button, Card, Field, Input, Textarea } from '../../components/ui';

const VARIABLES_HINT = `Variables disponibles: ${PLANTILLA_VARIABLES.map((v) => `{${v}}`).join(', ')} — se reemplazan por los datos de la persona y la actividad al abrir WhatsApp.`;

const Settings = () => {
  const { showSuccess, showError } = useToast();
  const [instruccionesPagoDefault, setInstruccionesPagoDefault] = useState('');
  const [whatsappNumero, setWhatsappNumero] = useState('');
  const [whatsappViajeMensaje, setWhatsappViajeMensaje] = useState('');
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/settings');
      const s = response.data.settings || {};
      setInstruccionesPagoDefault(s.instruccionesPagoDefault || '');
      setWhatsappNumero(s.whatsappNumero || '');
      setWhatsappViajeMensaje(s.whatsappViajeMensaje || '');
      setPlantillas(s.plantillasWhatsApp || []);
    } catch (error) {
      showError('Error al cargar ajustes');
    } finally {
      setLoading(false);
    }
  };

  const updatePlantilla = (index, campo, valor) => {
    setPlantillas((prev) => prev.map((p, i) => (i === index ? { ...p, [campo]: valor } : p)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await axios.put('/settings', {
        instruccionesPagoDefault,
        whatsappNumero,
        whatsappViajeMensaje,
        plantillasWhatsApp: plantillas,
      });
      // El back limpia (descarta filas vacías, normaliza el número):
      // reflejamos lo que quedó guardado de verdad.
      const s = response.data.settings || {};
      setWhatsappNumero(s.whatsappNumero || '');
      setPlantillas(s.plantillasWhatsApp || []);
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
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-ink">Pagos</h2>
          <Field
            label="Instrucciones de pago por defecto"
            hint="Se muestran al inscribirse en actividades pagas que no tengan instrucciones propias. El precio ya se ve en la actividad; acá sólo indicá dónde transferir (alias, CBU, titular, etc.)."
          >
            <Textarea
              value={instruccionesPagoDefault}
              onChange={(e) => setInstruccionesPagoDefault(e.target.value)}
              rows={6}
              placeholder="Ej: Transferí a Alias: MALKA.ACTIVIDADES - CBU: 0000003100012345678901 - Titular: ..."
            />
          </Field>
        </Card>

        <Card>
          <h2 className="mb-1 text-lg font-semibold text-ink">WhatsApp</h2>
          <p className="mb-4 text-sm text-ink-muted">{VARIABLES_HINT}</p>

          <Field
            label="Número del centro"
            hint="Con código de país, sin + ni espacios. Es adonde escriben los participantes."
          >
            <Input
              type="tel"
              icon="whatsapp"
              value={whatsappNumero}
              onChange={(e) => setWhatsappNumero(e.target.value)}
              placeholder="5491134405730"
            />
          </Field>

          <Field
            label="Mensaje de coordinación de viajes"
            hint="Lo que llega prellenado cuando alguien inscripto a un viaje toca «Escribinos por WhatsApp»."
          >
            <Textarea
              value={whatsappViajeMensaje}
              onChange={(e) => setWhatsappViajeMensaje(e.target.value)}
              rows={3}
            />
          </Field>

          <div className="mt-2 border-t border-surface-border pt-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-ink">Plantillas para contactar inscriptos</h3>
                <p className="text-sm text-ink-muted">
                  Aparecen al tocar WhatsApp junto a una persona en las inscripciones de una
                  actividad.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon="add"
                onClick={() => setPlantillas((prev) => [...prev, { nombre: '', mensaje: '' }])}
              >
                Agregar
              </Button>
            </div>

            {plantillas.length === 0 ? (
              <p className="rounded-card border border-dashed border-surface-border p-4 text-center text-sm text-ink-muted">
                Sin plantillas todavía. Agregá una, por ejemplo un recordatorio de actividad.
              </p>
            ) : (
              <div className="space-y-4">
                {plantillas.map((p, i) => (
                  <div
                    key={p._id ?? `nueva-${i}`}
                    className="rounded-card border border-surface-border p-3 sm:p-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Input
                        value={p.nombre}
                        onChange={(e) => updatePlantilla(i, 'nombre', e.target.value)}
                        placeholder="Nombre (ej: Recordatorio)"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon="delete"
                        iconOnly
                        label="Eliminar plantilla"
                        onClick={() => setPlantillas((prev) => prev.filter((_, j) => j !== i))}
                        className="text-danger-600 hover:bg-danger-50 hover:text-danger-700"
                      />
                    </div>
                    <Textarea
                      value={p.mensaje}
                      onChange={(e) => updatePlantilla(i, 'mensaje', e.target.value)}
                      rows={3}
                      placeholder="Hola {nombre}! Te esperamos en {actividad} el {fecha} a las {hora}."
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" icon="check" loading={saving}>
            {saving ? 'Guardando...' : 'Guardar ajustes'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
};

export default Settings;
