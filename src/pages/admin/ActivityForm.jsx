import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';
import PageContainer from '../../components/layout/PageContainer';
import { activityPublicTags, activityPrivateTags } from '../../utils/tagFields';
import TagAssigner from '../../components/tags/TagAssigner';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Field,
  Input,
  Select,
  Switch,
  Textarea,
  TimePicker,
  cn,
} from '../../components/ui';

/* Color de respaldo cuando la tag del catálogo no define el suyo. */
const DEFAULT_PUBLIC_TAG_COLOR = '#689b78';
const DEFAULT_PRIVATE_TAG_COLOR = '#c98a1e';

const MONEDA_OPTIONS = [
  { value: 'ARS', label: 'Pesos ($)' },
  { value: 'USD', label: 'Dólares (US$)' },
];

const ESTADO_OPTIONS = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'publicada', label: 'Publicada' },
];

const VISIBILIDAD_OPTIONS = [
  {
    value: 'publica',
    label: 'Pública',
    icon: 'users',
    description: 'Visible para todos los usuarios aprobados',
  },
  {
    value: 'privada',
    label: 'Privada',
    icon: 'blocked',
    description: 'Sólo para usuarios con las tags requeridas',
  },
];

const FRECUENCIA_OPTIONS = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
];

/**
 * Botón de día para la recurrencia. Es un toggle con estado propio, no un
 * checkbox de formulario: se ve como una pastilla y se lee como botón
 * presionado.
 */
const DayToggle = ({ label, checked, onToggle, compact = false }) => (
  <button
    type="button"
    onClick={() => onToggle(!checked)}
    aria-pressed={checked}
    className={cn(
      'rounded-control border text-sm font-medium',
      'transition-chrome duration-fast ease-standard motion-reduce:transition-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1',
      'active:scale-95',
      compact ? 'px-0 py-2 text-center tabular-nums' : 'px-3 py-2',
      checked
        ? 'border-primary bg-primary text-white shadow-subtle'
        : 'border-surface-border bg-surface text-ink-soft hover:border-primary-300 hover:bg-primary-50'
    )}
  >
    {label}
  </button>
);

const TIPO_OPTIONS = [
  { value: 'unica', label: 'Única', icon: 'activity', description: 'Una sola fecha' },
  { value: 'recurrente', label: 'Recurrente', icon: 'time', description: 'Se repite' },
  { value: 'viaje', label: 'Viaje', icon: 'location', description: 'Con fecha de inicio y fin' },
];

// Helper function to format date as YYYY-MM-DD - simple date, no timezone conversion
// Just extract the year, month, day as simple numbers
const formatDateToString = (date) => {
  if (!date) return '';
  
  // If it's already a string in YYYY-MM-DD format, return it as-is
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    return date.substring(0, 10);
  }
  
  // For Date objects, extract year, month, day as simple numbers
  // Use local methods to get exactly what the user sees/selected
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to convert YYYY-MM-DD string to Date object using local components

const ActivityForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tags: [],
    tipo: 'unica',
    fecha: '',
    hora: '',
    fechaFin: '',
    horaFin: '',
    lugar: 'Malka, 3 de Febrero 1325',
    ubicacionOnline: 'https://maps.app.goo.gl/Wd2mjrQy7MJiKmMZ8',
    precio: 0,
    moneda: 'ARS',
    esGratuita: true,
    instruccionesPago: '',
    cupo: '',
    requiereAprobacion: false,
    estado: 'borrador',
    duracion: '',
    politicaCancelacion: '',
    recordatoriosAutomaticos: true,
    visibilidad: 'publica',
    tagsPrivados: [],
    // Recurrencia
    recurrence: {
      frequency: 'weekly',
      daysOfWeek: [], // Array para múltiples días
      dayOfMonth: '',
      endDate: '',
      occurrences: '',
      hora: '' // Hora para actividades recurrentes
    }
  });

  const [tagInputPublic, setTagInputPublic] = useState('');
  const [tagInputPrivate, setTagInputPrivate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [availablePrivateTags, setAvailablePrivateTags] = useState([]);
  const [defaultInstruccionesPago, setDefaultInstruccionesPago] = useState('');
  // Avisar a los participantes sólo tiene sentido la primera vez que se publica.
  const [estadoOriginal, setEstadoOriginal] = useState(null);
  const [notificarParticipantes, setNotificarParticipantes] = useState(true);
  const seEstaPublicando = formData.estado === 'publicada' && estadoOriginal !== 'publicada';

  useEffect(() => {
    fetchAvailableTags();
    fetchAvailablePrivateTags();
    fetchDefaultInstruccionesPago();
    if (isEdit) {
      fetchActivity();
    }
  }, [id]);

  useEffect(() => {
    if (!defaultInstruccionesPago) return;
    setFormData(prev => {
      if (prev.esGratuita || prev.instruccionesPago?.trim()) return prev;
      return { ...prev, instruccionesPago: defaultInstruccionesPago };
    });
  }, [defaultInstruccionesPago]);

  const fetchDefaultInstruccionesPago = async () => {
    try {
      const response = await axios.get('/settings');
      const defaultText = response.data.settings?.instruccionesPagoDefault || '';
      setDefaultInstruccionesPago(defaultText);
      if (!isEdit && defaultText) {
        setFormData(prev => ({
          ...prev,
          instruccionesPago: prev.instruccionesPago?.trim() ? prev.instruccionesPago : defaultText,
        }));
      }
    } catch (error) {
      console.error('Error fetching default payment instructions:', error);
    }
  };

  const fetchAvailableTags = async () => {
    try {
      const response = await axios.get('/tags?activa=true');
      setAvailableTags(response.data.tags || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
      setAvailableTags([]);
    }
  };

  const fetchAvailablePrivateTags = async () => {
    try {
      const response = await axios.get('/tags-privados?activa=true');
      setAvailablePrivateTags(response.data.tags || []);
    } catch (error) {
      console.error('Error fetching tags privados:', error);
      setAvailablePrivateTags([]);
    }
  };

  const fetchActivity = async () => {
    try {
      let defaultText = defaultInstruccionesPago;
      if (!defaultText) {
        try {
          const settingsRes = await axios.get('/settings');
          defaultText = settingsRes.data.settings?.instruccionesPagoDefault || '';
          setDefaultInstruccionesPago(defaultText);
        } catch {
          defaultText = '';
        }
      }

      const response = await axios.get(`/activities/${id}`);
      const activity = response.data.activity;
      const recurrence = activity.recurrence || formData.recurrence;
      
      // Asegurar que daysOfWeek y dayOfMonth sean arrays
      if (recurrence && !Array.isArray(recurrence.daysOfWeek) && recurrence.dayOfWeek !== undefined) {
        recurrence.daysOfWeek = [recurrence.dayOfWeek];
      }
      if (recurrence && !Array.isArray(recurrence.dayOfMonth) && recurrence.dayOfMonth !== undefined && typeof recurrence.dayOfMonth === 'number') {
        recurrence.dayOfMonth = [recurrence.dayOfMonth];
      }
      
      setEstadoOriginal(activity.estado);
      const publicTags = activityPublicTags(activity);
      const privateTags = activityPrivateTags(activity);

      setFormData({
        ...activity,
        tags: publicTags,
        tagsPrivados: privateTags,
        fecha: activity.fecha ? formatDateToString(activity.fecha) : '',
        fechaFin: activity.fechaFin ? formatDateToString(activity.fechaFin) : '',
        horaFin: activity.horaFin || '',
        moneda: activity.moneda || 'ARS',
        cupo: activity.cupo || '',
        duracion: activity.duracion || '',
        hora: activity.hora || (recurrence?.hora || ''),
        instruccionesPago: activity.instruccionesPago?.trim()
          || defaultText
          || '',
        recurrence: {
          ...formData.recurrence,
          ...recurrence,
          daysOfWeek: recurrence.daysOfWeek || [],
          dayOfMonth: recurrence.dayOfMonth || [],
          endDate: recurrence.endDate ? formatDateToString(recurrence.endDate) : '',
          hora: recurrence.hora || activity.hora || ''
        }
      });
    } catch (error) {
      console.error('Error fetching activity:', error);
      setError('Error al cargar la actividad');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      if (name === 'esGratuita' && !checked && !prev.instruccionesPago?.trim()) {
        next.instruccionesPago = defaultInstruccionesPago;
      }
      return next;
    });
  };



  const addPublicTagFromSelect = () => {
    if (!tagInputPublic) return;
    const tagNombreLower = tagInputPublic.toLowerCase();
    if (formData.tags.some(t => t.toLowerCase() === tagNombreLower)) return;
    const tagFromBackend = availableTags.find(t => t.nombre.toLowerCase() === tagNombreLower);
    const tagToAdd = tagFromBackend ? tagFromBackend.nombre : tagInputPublic;
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, tagToAdd]
    }));
    setTagInputPublic('');
  };

  const removePublicTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const addPrivateTagFromSelect = () => {
    if (!tagInputPrivate) return;
    const tagNombreLower = tagInputPrivate.toLowerCase();
    if (formData.tagsPrivados.some(t => t.toLowerCase() === tagNombreLower)) return;
    const tagFromBackend = availablePrivateTags.find(t => t.nombre.toLowerCase() === tagNombreLower);
    const tagToAdd = tagFromBackend ? tagFromBackend.nombre : tagInputPrivate;
    setFormData(prev => ({
      ...prev,
      tagsPrivados: [...prev.tagsPrivados, tagToAdd]
    }));
    setTagInputPrivate('');
  };

  const removePrivateTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tagsPrivados: prev.tagsPrivados.filter(t => t !== tag)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validar recurrencia
      if (formData.tipo === 'recurrente') {
        if (formData.recurrence.frequency === 'weekly' && (!formData.recurrence.daysOfWeek || formData.recurrence.daysOfWeek.length === 0)) {
          setError('Debes seleccionar al menos un día de la semana');
          setLoading(false);
          return;
        }
        if (formData.recurrence.frequency === 'monthly' && (!formData.recurrence.dayOfMonth || formData.recurrence.dayOfMonth.length === 0)) {
          setError('Debes seleccionar al menos un día del mes');
          setLoading(false);
          return;
        }
        if (!formData.recurrence.hora && !formData.hora) {
          setError('Debes especificar la hora para actividades recurrentes');
          setLoading(false);
          return;
        }
      }

      if (formData.tipo === 'viaje') {
        if (!formData.fecha || !formData.fechaFin) {
          setError('Debes indicar la fecha de inicio y la fecha de finalización del viaje');
          setLoading(false);
          return;
        }
        if (formData.fechaFin < formData.fecha) {
          setError('La fecha de finalización no puede ser anterior a la fecha de inicio');
          setLoading(false);
          return;
        }
      }

      const fechaToSend = (formData.tipo === 'unica' || formData.tipo === 'viaje') ? formData.fecha : (formData.tipo === 'recurrente' && formData.recurrence.frequency === 'daily' ? formData.fecha : undefined);

      const {
        _id: _omitId,
        __v,
        createdAt,
        updatedAt,
        categorias: _legacyCat,
        ...formRest
      } = formData;

      const dataToSend = {
        ...formRest,
        tags: formData.tags,
        categorias: formData.tags,
        tagsPrivados: formData.tagsPrivados,
        fecha: fechaToSend,
        fechaFin: formData.tipo === 'viaje' ? (formData.fechaFin || null) : null,
        horaFin: formData.tipo === 'viaje' ? formData.horaFin : '',
        instruccionesPago: formData.tipo === 'viaje' ? '' : formData.instruccionesPago,
        hora: formData.tipo === 'recurrente' ? (formData.recurrence.hora || formData.hora) : formData.hora,
        cupo: formData.cupo ? Number(formData.cupo) : null,
        duracion: formData.duracion ? Number(formData.duracion) : null,
        precio: formData.esGratuita ? 0 : Number(formData.precio),
        recurrence: formData.tipo === 'recurrente' ? {
          ...formData.recurrence,
          dayOfWeek: formData.recurrence.daysOfWeek?.[0],
          daysOfWeek: formData.recurrence.daysOfWeek || [],
          dayOfMonth: formData.recurrence.dayOfMonth || [],
          endDate: formData.recurrence.endDate || null,
          occurrences: formData.recurrence.occurrences || null,
          hora: formData.recurrence.hora || formData.hora
        } : undefined,
        notificarParticipantes: seEstaPublicando && notificarParticipantes
      };

      if (isEdit) {
        await axios.put(`/activities/${id}`, dataToSend);
        showSuccess('Actividad actualizada exitosamente');
      } else {
        await axios.post('/activities', dataToSend);
        showSuccess('Actividad creada exitosamente');
      }
      navigate('/admin/activities');
    } catch (error) {
      setError(error.response?.data?.message || 'Error al guardar la actividad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title={isEdit ? 'Editar actividad' : 'Nueva actividad'} maxWidth="4xl">

        {error && (
          <Alert tone="danger" className="mb-4">
            {error}
          </Alert>
        )}

        <Card as="form" onSubmit={handleSubmit}>
        <Field label="Título" required>
          <Input type="text" name="titulo" value={formData.titulo} onChange={handleChange} required />
        </Field>

        <Field label="Descripción" required>
          <Textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            required
          />
        </Field>

        <div className="mb-5">
          <p className="mb-1 block text-sm font-medium text-ink-soft">Tags públicos</p>
          <p className="mb-2 text-sm text-ink-muted">
            Temas de la actividad (visibles en cartelera y filtros). Catálogo público.
          </p>
          <TagAssigner
            label=""
            placeholder="Seleccionar tag"
            emptyMessage="No hay tags disponibles"
            catalog={availableTags}
            assigned={formData.tags}
            value={tagInputPublic}
            onValueChange={setTagInputPublic}
            onAdd={addPublicTagFromSelect}
            onRemove={removePublicTag}
            defaultColor={DEFAULT_PUBLIC_TAG_COLOR}
            emptyHint={
              <p className="mt-2 text-sm text-ink-muted">
                No hay tags disponibles.{' '}
                <Button variant="link" size="sm" to="/admin/tags" className="min-h-0 px-0 py-0">
                  Crear tags
                </Button>
              </p>
            }
          />
        </div>

        <Field label="Tipo" required>
          <Select
            name="tipo"
            options={TIPO_OPTIONS}
            value={formData.tipo}
            onChange={(value) => handleChange({ target: { name: 'tipo', value, type: 'text' } })}
          />
        </Field>

        {formData.tipo === 'unica' ? (
          <>
            <Field label="Fecha">
              <DatePicker
                value={formData.fecha}
                onChange={(value) => setFormData((prev) => ({ ...prev, fecha: value }))}
                placeholder="dd/mm/aaaa"
                clearable
              />
            </Field>
            <Field label="Hora">
              <TimePicker
                value={formData.hora}
                onChange={(value) => setFormData((prev) => ({ ...prev, hora: value }))}
              />
            </Field>
          </>
        ) : formData.tipo === 'viaje' ? (
          <>
            <Field label="Fecha de inicio" required>
              <DatePicker
                value={formData.fecha}
                onChange={(value) => setFormData((prev) => ({ ...prev, fecha: value }))}
                placeholder="dd/mm/aaaa"
                clearable
              />
            </Field>
            <Field label="Hora de inicio">
              <TimePicker
                value={formData.hora}
                onChange={(value) => setFormData((prev) => ({ ...prev, hora: value }))}
              />
            </Field>
            <Field label="Fecha de finalización" required>
              <DatePicker
                value={formData.fechaFin}
                onChange={(value) => setFormData((prev) => ({ ...prev, fechaFin: value }))}
                placeholder="dd/mm/aaaa"
                min={formData.fecha || undefined}
                clearable
              />
            </Field>
            <Field label="Hora de finalización">
              <TimePicker
                value={formData.horaFin}
                onChange={(value) => setFormData((prev) => ({ ...prev, horaFin: value }))}
              />
            </Field>
          </>
        ) : (
          <>
            <Field label="Frecuencia" required>
              <Select
                name="recurrence.frequency"
                options={FRECUENCIA_OPTIONS}
                value={formData.recurrence.frequency}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    recurrence: {
                      ...prev.recurrence,
                      frequency: value,
                      daysOfWeek: value === 'weekly' ? prev.recurrence.daysOfWeek : [],
                      dayOfMonth: value === 'monthly' ? prev.recurrence.dayOfMonth : '',
                    },
                  }))
                }
              />
            </Field>

            <Field label="Hora" required>
              <TimePicker
                value={formData.recurrence.hora || formData.hora}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    hora: value,
                    recurrence: { ...prev.recurrence, hora: value },
                  }))
                }
              />
            </Field>

            {formData.recurrence.frequency === 'weekly' && (
              <Field label="Días de la Semana" required>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                  {[
                    { value: 0, label: 'Domingo' },
                    { value: 1, label: 'Lunes' },
                    { value: 2, label: 'Martes' },
                    { value: 3, label: 'Miércoles' },
                    { value: 4, label: 'Jueves' },
                    { value: 5, label: 'Viernes' },
                    { value: 6, label: 'Sábado' }
                  ].map(day => (
                    <DayToggle
                      key={day.value}
                      label={day.label}
                      checked={formData.recurrence.daysOfWeek?.includes(day.value) || false}
                      onToggle={(next) =>
                        setFormData((prev) => {
                          const actuales = prev.recurrence.daysOfWeek || [];
                          return {
                            ...prev,
                            recurrence: {
                              ...prev.recurrence,
                              daysOfWeek: next
                                ? [...actuales, day.value].sort((x, y) => x - y)
                                : actuales.filter((d) => d !== day.value),
                            },
                          };
                        })
                      }
                    />
                  ))}
                </div>
                {formData.recurrence.daysOfWeek?.length === 0 && (
                  <p className="mt-1 text-sm text-danger-600">Elegí al menos un día</p>
                )}
              </Field>
            )}

            {formData.recurrence.frequency === 'monthly' && (
              <Field label="Días del Mes" required>
                <div className="mt-2">
                  <p className="mb-2 text-sm text-ink-muted">Elegí los días del mes (1 a 31):</p>
                  <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <DayToggle
                        key={day}
                        label={day}
                        compact
                        checked={formData.recurrence.dayOfMonth?.includes(day) || false}
                        onToggle={(next) =>
                          setFormData((prev) => {
                            const actuales = prev.recurrence.dayOfMonth || [];
                            return {
                              ...prev,
                              recurrence: {
                                ...prev.recurrence,
                                dayOfMonth: next
                                  ? [...actuales, day].sort((x, y) => x - y)
                                  : actuales.filter((d) => d !== day),
                              },
                            };
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
                {(!formData.recurrence.dayOfMonth || formData.recurrence.dayOfMonth.length === 0) && (
                  <p className="mt-1 text-sm text-danger-600">Selecciona al menos un día del mes</p>
                )}
              </Field>
            )}

            {formData.recurrence.frequency === 'daily' && (
              <Field label="Fecha de Inicio">
                <DatePicker
                value={formData.fecha}
                onChange={(value) => setFormData((prev) => ({ ...prev, fecha: value }))}
                placeholder="dd/mm/aaaa"
                clearable
              />
              </Field>
            )}

            <Field label="Fecha de Fin (opcional)">
              <DatePicker
                value={formData.recurrence.endDate}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    recurrence: { ...prev.recurrence, endDate: value },
                  }))
                }
                placeholder="dd/mm/aaaa"
                clearable
              />
              <p className="mt-1.5 text-xs text-ink-muted">Deja vacío si no tiene fecha de fin</p>
            </Field>

            <Field label="Número de Ocurrencias (opcional)">
              <Input
                type="number"
                min="1"
                value={formData.recurrence.occurrences || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  recurrence: { ...prev.recurrence, occurrences: e.target.value ? Number(e.target.value) : null }
                }))}
                placeholder="Ej: 10 (para 10 sesiones)"
              />
              <p className="mt-1.5 text-xs text-ink-muted">Deja vacío si no hay límite de ocurrencias</p>
            </Field>
          </>
        )}

        <Field label="Lugar">
          <Input
            type="text"
            name="lugar"
            value={formData.lugar}
            onChange={handleChange}
          />
        </Field>

        <Field label="Link de Google Maps">
          <Input
            type="url"
            name="ubicacionOnline"
            value={formData.ubicacionOnline}
            onChange={handleChange}
            placeholder="https://maps.google.com/..."
          />
          <p className="mt-1.5 text-xs text-ink-muted">Ingresa el link de Google Maps de la ubicación del evento</p>
        </Field>

        <div className="mb-5">
          <Switch
            name="esGratuita"
            label="Actividad gratuita"
            description="Sin precio ni comprobante de pago"
            checked={formData.esGratuita}
            onChange={handleChange}
          />
        </div>

        {!formData.esGratuita && (
          <Field label="Precio">
            <div className="flex gap-2">
              <Input
                type="number"
                name="precio"
                value={formData.precio}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="min-w-0 flex-1"
              />
              <Select
                name="moneda"
                options={MONEDA_OPTIONS}
                value={formData.moneda}
                onChange={(value) =>
                  handleChange({ target: { name: 'moneda', value, type: 'text' } })
                }
                className="w-48 shrink-0"
              />
            </div>
          </Field>
        )}

        {!formData.esGratuita && formData.tipo !== 'viaje' && (
          <Field label="Instrucciones de pago">
            <p className="mb-2 text-sm text-ink-muted">
              Se completan automáticamente desde Ajustes. Podés editarlas para esta actividad.
            </p>
            <Textarea
              name="instruccionesPago"
              value={formData.instruccionesPago || ''}
              onChange={handleChange}
              rows={5}
              placeholder={defaultInstruccionesPago || 'Datos de transferencia (alias, CBU, titular...)'}
            />
          </Field>
        )}

        {!formData.esGratuita && formData.tipo === 'viaje' && (
          <Alert tone="warning" className="mb-5" title="Pago del viaje">
            No se cobra por transferencia ni se pide comprobante. Las instrucciones se coordinan
            por WhatsApp una vez confirmado el cupo.
          </Alert>
        )}

        <Field label="Cupo Máximo (opcional)">
          <Input
            type="number"
            name="cupo"
            value={formData.cupo}
            onChange={handleChange}
            min="1"
          />
        </Field>

        <Field label="Duración (minutos)">
          <Input
            type="number"
            name="duracion"
            value={formData.duracion}
            onChange={handleChange}
            min="0"
          />
        </Field>

        <div className="mb-5">
          <Switch
            name="requiereAprobacion"
            label="Requiere aprobación"
            description="Las inscripciones entran como pendientes"
            checked={formData.requiereAprobacion}
            onChange={handleChange}
          />
        </div>

        <Field label="Estado">
          <Select
            name="estado"
            options={ESTADO_OPTIONS}
            value={formData.estado}
            onChange={(value) => handleChange({ target: { name: 'estado', value, type: 'text' } })}
          />
          {seEstaPublicando && (
            <div className="mt-3">
              <Switch
                name="notificarParticipantes"
                label="Avisar a los participantes"
                description="Les llega una notificación de que hay una actividad nueva. Sólo a quienes pueden verla."
                checked={notificarParticipantes}
                onChange={(e) => setNotificarParticipantes(e.target.checked)}
              />
            </div>
          )}
        </Field>

        <Field label="Visibilidad">
          <Select
            name="visibilidad"
            options={VISIBILIDAD_OPTIONS}
            value={formData.visibilidad}
            onChange={(value) =>
              handleChange({ target: { name: 'visibilidad', value, type: 'text' } })
            }
          />
          {formData.visibilidad === 'privada' && formData.tagsPrivados.length === 0 && (
            <Alert tone="warning" compact className="mt-2">
              Elegí al menos una tag privada para que la actividad sea visible a quien corresponda.
            </Alert>
          )}
        </Field>

        {formData.visibilidad === 'privada' && (
          <Field label="Tags privados (audiencia)">
            <p className="mb-2 text-sm text-ink-muted">
              Catálogo privado: el servidor decide qué usuarios ven esta actividad según sus tags privados. No se envían al
              participante.
            </p>
            <TagAssigner
              label=""
              placeholder="Seleccionar tag privada"
              emptyMessage="No hay tags privadas disponibles"
              catalog={availablePrivateTags}
              assigned={formData.tagsPrivados}
              value={tagInputPrivate}
              onValueChange={setTagInputPrivate}
              onAdd={addPrivateTagFromSelect}
              onRemove={removePrivateTag}
              defaultColor={DEFAULT_PRIVATE_TAG_COLOR}
              emptyHint={
                <p className="mt-2 text-sm text-ink-muted">
                  No hay tags privadas.{' '}
                  <Button
                    variant="link"
                    size="sm"
                    to="/admin/tags-privados"
                    className="min-h-0 px-0 py-0"
                  >
                    Crear en catálogo privado
                  </Button>
                </p>
              }
            />
          </Field>
        )}

        <Field label="Política de Cancelación">
          <Textarea
            name="politicaCancelacion"
            value={formData.politicaCancelacion}
            onChange={handleChange}
            placeholder="Describe la política de cancelación..."
          />
        </Field>

        <div className="mb-5">
          <Switch
            name="recordatoriosAutomaticos"
            label="Recordatorios automáticos"
            description="Avisos previos a la actividad"
            checked={formData.recordatoriosAutomaticos}
            onChange={handleChange}
          />
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/admin/activities')}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            icon="check"
            loading={loading}
            className="w-full sm:w-auto sm:max-w-xs sm:flex-1"
          >
            {loading ? 'Guardando...' : isEdit ? 'Actualizar actividad' : 'Crear actividad'}
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
};

export default ActivityForm;

