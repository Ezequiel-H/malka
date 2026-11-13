import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import PageContainer from '../../components/layout/PageContainer';
import { activityPublicTags, activityPrivateTags, publicTagColor, publicTagIcon } from '../../utils/tagFields';
import TagAssigner from '../../components/tags/TagAssigner';
import { Segmentado } from '../../components/admin/metricas/piezas';
import VistaCartelera from '../../components/admin/actividadForm/VistaCartelera';
import useBorradorLocal from '../../components/admin/actividadForm/useBorradorLocal';
import { Alert, Button, DatePicker, Field, Icon, Input, Select, Switch, Textarea, TimePicker, cn } from '../../components/ui';

/* Color de respaldo cuando la tag privada del catálogo no define el suyo. */
const DEFAULT_PRIVATE_TAG_COLOR = '#c98a1e';

const MONEDA_OPTIONS = [
  { value: 'ARS', label: 'Pesos ($)' },
  { value: 'USD', label: 'Dólares (US$)' },
];

const ESTADO_OPTIONS = [
  { valor: 'borrador', etiqueta: 'Borrador' },
  { valor: 'publicada', etiqueta: 'Publicada' },
];

const VISIBILIDAD_OPTIONS = [
  { valor: 'publica', etiqueta: 'Pública' },
  { valor: 'privada', etiqueta: 'Sólo algunas personas' },
];

const FRECUENCIA_OPTIONS = [
  { valor: 'weekly', etiqueta: 'Todas las semanas' },
  { valor: 'monthly', etiqueta: 'Todos los meses' },
];

/* De lunes a domingo, como se lee una semana; el valor es el de JavaScript (0 = domingo). */
const DIAS_SEMANA = [
  { value: 1, corto: 'L', label: 'Lunes' },
  { value: 2, corto: 'M', label: 'Martes' },
  { value: 3, corto: 'M', label: 'Miércoles' },
  { value: 4, corto: 'J', label: 'Jueves' },
  { value: 5, corto: 'V', label: 'Viernes' },
  { value: 6, corto: 'S', label: 'Sábado' },
  { value: 0, corto: 'D', label: 'Domingo' },
];

/**
 * Botón de día para la recurrencia. Es un toggle con estado propio, no un
 * checkbox de formulario: se ve como una pastilla y se lee como botón
 * presionado.
 */
const DayToggle = ({ label, title, checked, onToggle, compact = false }) => (
  <button
    type="button"
    onClick={() => onToggle(!checked)}
    aria-pressed={checked}
    aria-label={title}
    title={title}
    className={cn(
      'rounded-pill text-sm font-semibold tabular-nums',
      'transition-colors duration-base ease-standard motion-reduce:transition-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/25 focus-visible:ring-offset-1',
      compact ? 'h-9 w-9' : 'h-9 w-9 sm:h-10 sm:w-10',
      checked ? 'bg-ink text-surface' : 'bg-ink/[0.05] text-ink-soft hover:bg-ink/10'
    )}
  >
    {label}
  </button>
);

const TIPO_OPTIONS = [
  { valor: 'unica', etiqueta: 'Una vez' },
  { valor: 'recurrente', etiqueta: 'Se repite' },
  { valor: 'viaje', etiqueta: 'Viaje' },
];

/* Un bloque del formulario: título y lo suyo adentro. */
const Bloque = ({ titulo, ayuda, children }) => (
  <section className="rounded-[22px] border border-surface-border bg-surface p-5 sm:p-6">
    <h2 className="font-grotesk text-lg font-semibold text-ink">{titulo}</h2>
    {ayuda && <p className="mt-0.5 text-sm text-ink-muted">{ayuda}</p>}
    <div className="mt-4">{children}</div>
  </section>
);

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

  /* Lo que se escribe queda en este navegador hasta guardar (ver useBorradorLocal). */
  const { user } = useAuth();
  const [borradorListo, setBorradorListo] = useState(false);
  const [recuperado, setRecuperado] = useState(false);
  const deEntrada = useRef(formData);
  const borrador = useBorradorLocal(`malka.borrador.actividad.${user?._id ?? 'anon'}.${id ?? 'nueva'}`, formData, { activo: borradorListo });
  const retomarBorrador = (base) => {
    deEntrada.current = base;
    const guardado = borrador.leer();
    if (guardado?.valor && JSON.stringify(guardado.valor) !== JSON.stringify(base)) {
      setFormData(guardado.valor);
      setRecuperado(true);
    }
    setBorradorListo(true);
  };
  const empezarDeCero = () => {
    borrador.borrar();
    setFormData(deEntrada.current);
    setRecuperado(false);
  };

  useEffect(() => {
    fetchAvailableTags();
    fetchAvailablePrivateTags();
    fetchDefaultInstruccionesPago();
    if (isEdit) {
      fetchActivity();
    } else {
      retomarBorrador(formData);
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

      const cargada = {
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
      };
      setFormData(cargada);
      retomarBorrador(cargada);
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
        borrador.borrar();
        showSuccess('Actividad actualizada exitosamente');
      } else {
        await axios.post('/activities', dataToSend);
        borrador.borrar();
        showSuccess('Actividad creada exitosamente');
      }
      navigate('/admin/activities');
    } catch (error) {
      setError(error.response?.data?.message || 'Error al guardar la actividad');
    } finally {
      setLoading(false);
    }
  };

  const set = (cambio) => setFormData((prev) => ({ ...prev, ...cambio }));
  const setRec = (cambio) => setFormData((prev) => ({ ...prev, recurrence: { ...prev.recurrence, ...cambio } }));
  const togglePublica = (nombre) =>
    setFormData((prev) => {
      const tiene = prev.tags.some((t) => t.toLowerCase() === nombre.toLowerCase());
      return { ...prev, tags: tiene ? prev.tags.filter((t) => t.toLowerCase() !== nombre.toLowerCase()) : [...prev.tags, nombre] };
    });
  /* Las tags asignadas que ya no están en el catálogo se muestran igual, para poder sacarlas. */
  const sueltas = formData.tags.filter((t) => !availableTags.some((c) => c.nombre.toLowerCase() === t.toLowerCase()));

  const textoGuardar = loading ? 'Guardando…' : isEdit ? 'Guardar cambios' : formData.estado === 'publicada' ? 'Publicar' : 'Guardar borrador';

  return (
    <PageContainer title={isEdit ? 'Editar actividad' : 'Nueva actividad'} back={<Button variant="ghost" size="sm" icon="back" iconOnly label="Volver a actividades" to="/admin/activities" />}>
      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] [&>*]:min-w-0">
        <div className="space-y-5">
          {error && <Alert tone="danger">{error}</Alert>}
          {recuperado && (
            <Alert tone="info">
              Retomamos lo que estabas cargando.{' '}
              <button type="button" onClick={empezarDeCero} className="font-semibold underline">
                Empezar de cero
              </button>
            </Alert>
          )}

          <Bloque titulo="Qué es">
            <Field label="Nombre" required>
              <Input type="text" name="titulo" value={formData.titulo} onChange={handleChange} required placeholder="Ej: Cocina israelí" />
            </Field>
            <Field label="Descripción" required>
              <Textarea name="descripcion" value={formData.descripcion} onChange={handleChange} required rows={4} placeholder="Qué se hace, para quién, qué traer" />
            </Field>
            <div>
              <p className="mb-1.5 text-sm font-medium text-ink">Propuesta</p>
              {availableTags.length > 0 || sueltas.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {[...availableTags.map((t) => t.nombre), ...sueltas].map((nombre) => {
                    const activo = formData.tags.some((t) => t.toLowerCase() === nombre.toLowerCase());
                    const color = publicTagColor(availableTags, nombre);
                    return (
                      <button
                        key={nombre}
                        type="button"
                        aria-pressed={activo}
                        onClick={() => togglePublica(nombre)}
                        className={cn(
                          'inline-flex min-h-[38px] items-center gap-2 rounded-pill border px-3.5 text-sm font-medium capitalize transition-colors duration-base',
                          activo ? 'border-transparent text-surface' : 'border-surface-border bg-surface text-ink-soft hover:border-ink/25'
                        )}
                        style={activo ? { background: color } : undefined}
                      >
                        <Icon name={activo ? 'check' : publicTagIcon(availableTags, nombre) || 'tag'} size="xs" />
                        {nombre}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-ink-muted">
                  No hay propuestas cargadas.{' '}
                  <Button variant="link" size="sm" to="/admin/tags" className="min-h-0 px-0 py-0">
                    Crear tags
                  </Button>
                </p>
              )}
              <p className="mt-1.5 text-xs text-ink-muted">El color y el ícono de la primera salen en la cartelera. Se pueden elegir varias.</p>
            </div>
          </Bloque>

          <Bloque titulo="Cuándo">
            <Segmentado opciones={TIPO_OPTIONS} valor={formData.tipo} onChange={(tipo) => set({ tipo })} etiqueta="Tipo de actividad" />
            <div key={formData.tipo} className="mt-4 animate-fade-in">
              {formData.tipo === 'unica' && (
                <div className="grid gap-x-4 sm:grid-cols-2">
                  <Field label="Día">
                    <DatePicker value={formData.fecha} onChange={(fecha) => set({ fecha })} placeholder="dd/mm/aaaa" clearable />
                  </Field>
                  <Field label="Hora">
                    <TimePicker value={formData.hora} onChange={(hora) => set({ hora })} />
                  </Field>
                </div>
              )}

              {formData.tipo === 'viaje' && (
                <div className="grid gap-x-4 sm:grid-cols-2">
                  <Field label="Sale el" required>
                    <DatePicker value={formData.fecha} onChange={(fecha) => set({ fecha })} placeholder="dd/mm/aaaa" clearable />
                  </Field>
                  <Field label="A las">
                    <TimePicker value={formData.hora} onChange={(hora) => set({ hora })} />
                  </Field>
                  <Field label="Vuelve el" required>
                    <DatePicker value={formData.fechaFin} onChange={(fechaFin) => set({ fechaFin })} placeholder="dd/mm/aaaa" min={formData.fecha || undefined} clearable />
                  </Field>
                  <Field label="A las">
                    <TimePicker value={formData.horaFin} onChange={(horaFin) => set({ horaFin })} />
                  </Field>
                </div>
              )}

              {formData.tipo === 'recurrente' && (
                <div>
                  <Segmentado
                    opciones={FRECUENCIA_OPTIONS}
                    valor={formData.recurrence.frequency === 'monthly' ? 'monthly' : 'weekly'}
                    onChange={(frequency) =>
                      setRec({
                        frequency,
                        daysOfWeek: frequency === 'weekly' ? formData.recurrence.daysOfWeek : [],
                        dayOfMonth: frequency === 'monthly' ? formData.recurrence.dayOfMonth : '',
                      })
                    }
                    etiqueta="Cada cuánto"
                  />

                  {formData.recurrence.frequency !== 'monthly' ? (
                    <div className="mt-4">
                      <p className="mb-1.5 text-sm font-medium text-ink">Qué días</p>
                      <div className="flex flex-wrap gap-1.5">
                        {DIAS_SEMANA.map((day) => (
                          <DayToggle
                            key={day.value}
                            label={day.corto}
                            title={day.label}
                            checked={formData.recurrence.daysOfWeek?.includes(day.value) || false}
                            onToggle={(next) => {
                              const actuales = formData.recurrence.daysOfWeek || [];
                              setRec({ daysOfWeek: next ? [...actuales, day.value].sort((x, y) => x - y) : actuales.filter((d) => d !== day.value) });
                            }}
                          />
                        ))}
                      </div>
                      {formData.recurrence.daysOfWeek?.length === 0 && <p className="mt-1.5 text-sm text-danger-600">Elegí al menos un día</p>}
                    </div>
                  ) : (
                    <div className="mt-4">
                      <p className="mb-1.5 text-sm font-medium text-ink">Qué días del mes</p>
                      <div className="grid max-w-md grid-cols-7 gap-1.5">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <DayToggle
                            key={day}
                            label={day}
                            title={`Día ${day}`}
                            compact
                            checked={formData.recurrence.dayOfMonth?.includes(day) || false}
                            onToggle={(next) => {
                              const actuales = Array.isArray(formData.recurrence.dayOfMonth) ? formData.recurrence.dayOfMonth : [];
                              setRec({ dayOfMonth: next ? [...actuales, day].sort((x, y) => x - y) : actuales.filter((d) => d !== day) });
                            }}
                          />
                        ))}
                      </div>
                      {(!formData.recurrence.dayOfMonth || formData.recurrence.dayOfMonth.length === 0) && (
                        <p className="mt-1.5 text-sm text-danger-600">Elegí al menos un día del mes</p>
                      )}
                    </div>
                  )}

                  <div className="mt-4 grid gap-x-4 sm:grid-cols-2">
                    <Field label="Hora" required>
                      <TimePicker value={formData.recurrence.hora || formData.hora} onChange={(hora) => setFormData((prev) => ({ ...prev, hora, recurrence: { ...prev.recurrence, hora } }))} />
                    </Field>
                    {formData.recurrence.frequency === 'daily' && (
                      <Field label="Empieza el">
                        <DatePicker value={formData.fecha} onChange={(fecha) => set({ fecha })} placeholder="dd/mm/aaaa" clearable />
                      </Field>
                    )}
                    <Field label="Termina el (opcional)">
                      <DatePicker value={formData.recurrence.endDate} onChange={(endDate) => setRec({ endDate })} placeholder="Sin fecha de fin" clearable />
                    </Field>
                    <Field label="Cantidad de encuentros (opcional)">
                      <Input
                        type="number"
                        min="1"
                        value={formData.recurrence.occurrences || ''}
                        onChange={(e) => setRec({ occurrences: e.target.value ? Number(e.target.value) : null })}
                        placeholder="Sin límite"
                      />
                    </Field>
                  </div>
                </div>
              )}

              <Field label="Duración en minutos (opcional)">
                <Input type="number" name="duracion" value={formData.duracion} onChange={handleChange} min="0" placeholder="Ej: 90" />
              </Field>
            </div>
          </Bloque>

          <Bloque titulo="Dónde">
            <div className="grid gap-x-4 sm:grid-cols-2">
              <Field label="Lugar">
                <Input type="text" name="lugar" value={formData.lugar} onChange={handleChange} />
              </Field>
              <Field label="Link de Google Maps">
                <Input type="url" name="ubicacionOnline" value={formData.ubicacionOnline} onChange={handleChange} placeholder="https://maps.google.com/..." />
              </Field>
            </div>
          </Bloque>

          <Bloque titulo="Lugares y precio">
            <Field label="Cupo (opcional)">
              <Input type="number" name="cupo" value={formData.cupo} onChange={handleChange} min="1" placeholder="Sin límite" className="sm:max-w-[12rem]" />
            </Field>
            <div className="mb-5">
              <Switch name="esGratuita" label="Es gratis" description="Sin precio ni comprobante de pago" checked={formData.esGratuita} onChange={handleChange} />
            </div>
            {!formData.esGratuita && (
              <div className="animate-fade-in">
                <Field label="Precio">
                  <div className="flex gap-2">
                    <Input type="number" name="precio" value={formData.precio} onChange={handleChange} min="0" step="0.01" className="min-w-0 flex-1" />
                    <Select
                      name="moneda"
                      options={MONEDA_OPTIONS}
                      value={formData.moneda}
                      onChange={(value) => handleChange({ target: { name: 'moneda', value, type: 'text' } })}
                      className="w-40 shrink-0"
                    />
                  </div>
                </Field>
                {formData.tipo !== 'viaje' ? (
                  <Field label="Instrucciones de pago">
                    <p className="mb-2 text-sm text-ink-muted">Vienen de Ajustes. Podés cambiarlas para esta actividad.</p>
                    <Textarea
                      name="instruccionesPago"
                      value={formData.instruccionesPago || ''}
                      onChange={handleChange}
                      rows={4}
                      placeholder={defaultInstruccionesPago || 'Datos de transferencia (alias, CBU, titular...)'}
                    />
                  </Field>
                ) : (
                  <Alert tone="warning" title="Pago del viaje">
                    No se cobra por transferencia ni se pide comprobante. Las instrucciones se coordinan por WhatsApp una vez confirmado el cupo.
                  </Alert>
                )}
              </div>
            )}
          </Bloque>

          <Bloque titulo="Inscripción y quién la ve">
            <div className="mb-5 space-y-4">
              <Switch name="requiereAprobacion" label="Requiere aprobación" description="Las inscripciones entran como pendientes" checked={formData.requiereAprobacion} onChange={handleChange} />
              <Switch name="recordatoriosAutomaticos" label="Recordatorios automáticos" description="Avisos previos a la actividad" checked={formData.recordatoriosAutomaticos} onChange={handleChange} />
            </div>
            <p className="mb-1.5 text-sm font-medium text-ink">Quién la ve</p>
            <Segmentado opciones={VISIBILIDAD_OPTIONS} valor={formData.visibilidad} onChange={(visibilidad) => set({ visibilidad })} etiqueta="Visibilidad" />
            <p className="mt-1.5 text-xs text-ink-muted">
              {formData.visibilidad === 'privada' ? 'Sólo quienes tienen las tags privadas que elijas.' : 'Todas las personas aprobadas.'}
            </p>
            {formData.visibilidad === 'privada' && (
              <div className="mt-4 animate-fade-in">
                {formData.tagsPrivados.length === 0 && (
                  <Alert tone="warning" compact className="mb-3">
                    Elegí al menos una tag privada para que la actividad sea visible a quien corresponda.
                  </Alert>
                )}
                <TagAssigner
                  label="Tags privadas (audiencia)"
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
                      <Button variant="link" size="sm" to="/admin/tags-privados" className="min-h-0 px-0 py-0">
                        Crear en catálogo privado
                      </Button>
                    </p>
                  }
                />
              </div>
            )}
            <div className="mt-5">
              <Field label="Política de cancelación (opcional)">
                <Textarea name="politicaCancelacion" value={formData.politicaCancelacion} onChange={handleChange} rows={3} placeholder="Hasta cuándo se puede cancelar y qué pasa con lo pagado" />
              </Field>
            </div>
          </Bloque>
        </div>

        {/* Así la ve la gente, mientras se escribe; y lo que hace falta para publicarla. */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs font-semibold uppercase tracking-label text-ink-faint">Así se ve en la cartelera</p>
          <VistaCartelera form={formData} catalogo={availableTags} />

          <div className="space-y-3 rounded-[22px] border border-surface-border bg-surface p-4">
            <Segmentado opciones={ESTADO_OPTIONS} valor={formData.estado} onChange={(estado) => set({ estado })} etiqueta="Estado" />
            <p className="text-xs text-ink-muted">{formData.estado === 'publicada' ? 'La ven en la cartelera y se pueden anotar.' : 'Queda guardada, pero nadie la ve todavía.'}</p>
            {seEstaPublicando && (
              <Switch
                name="notificarParticipantes"
                label="Avisar a los participantes"
                description="Les llega una notificación de que hay una actividad nueva. Sólo a quienes pueden verla."
                checked={notificarParticipantes}
                onChange={(e) => setNotificarParticipantes(e.target.checked)}
              />
            )}
            <div className="grid gap-2 pt-1">
              <Button type="submit" icon="check" loading={loading} fullWidth>
                {textoGuardar}
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate('/admin/activities')} fullWidth>
                Cancelar
              </Button>
            </div>
            {borrador.guardadoEn && JSON.stringify(formData) !== JSON.stringify(deEntrada.current) && (
              <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                <Icon name="check" size="xs" className="text-success-700" />
                Lo que cargás queda guardado en este navegador hasta que guardes.
              </p>
            )}
          </div>
        </aside>
      </form>
    </PageContainer>
  );
};

export default ActivityForm;

