import { useState } from 'react';
import { formatUtcCalendarDateEsAR } from '../../utils/dateUtils';
import { Button, Checkbox, Field, Modal, Select, Spinner } from '../ui';

const LONG_DATE_OPTS = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

/* Claves del registro de columnas del backend. */
const COLUMNAS = [
  { clave: 'nombre', label: 'Nombre' },
  { clave: 'apellido', label: 'Apellido' },
  { clave: 'email', label: 'Email' },
  { clave: 'telefono', label: 'Teléfono' },
  { clave: 'dni', label: 'DNI' },
  { clave: 'restricciones', label: 'Restricciones alimenticias' },
  { clave: 'tags', label: 'Tags' },
  { clave: 'estado', label: 'Estado de inscripción' },
  { clave: 'fechaEvento', label: 'Fecha del evento' },
  { clave: 'pago', label: 'Estado del pago' },
  { clave: 'monto', label: 'Monto' },
  { clave: 'fechaInscripcion', label: 'Fecha de inscripción' },
];

const COLUMNAS_DEFAULT = ['nombre', 'apellido', 'email', 'telefono', 'restricciones', 'tags'];

const ESTADOS = [
  { clave: 'aceptada', label: 'Confirmadas' },
  { clave: 'pendiente', label: 'Pendientes' },
  { clave: 'en_espera', label: 'En lista de espera' },
  { clave: 'cancelada', label: 'Canceladas' },
];

/* Canceladas afuera por defecto: el caso típico es la lista para el evento. */
const ESTADOS_DEFAULT = ['aceptada', 'pendiente', 'en_espera'];

/**
 * Exportación personalizada a Excel: fecha (si la actividad es recurrente),
 * estados a incluir y columnas a exportar.
 */
const ExportModal = ({ activity, dates, loading, onClose, onExport }) => {
  const [fecha, setFecha] = useState('');
  const [estados, setEstados] = useState(ESTADOS_DEFAULT);
  const [columnas, setColumnas] = useState(COLUMNAS_DEFAULT);

  if (!activity) return null;

  const esRecurrente = activity.tipo === 'recurrente';

  const toggle = (lista, setLista, clave) => {
    setLista((prev) => (prev.includes(clave) ? prev.filter((c) => c !== clave) : [...prev, clave]));
  };

  const fechaOptions = [
    { value: '', label: 'Todas las fechas' },
    ...(dates || []).map((d) => ({
      value: d.fechaStr,
      label: `${formatUtcCalendarDateEsAR(`${d.fechaStr}T00:00:00.000Z`, LONG_DATE_OPTS)} · ${d.count} ${
        d.count === 1 ? 'inscripción' : 'inscripciones'
      }`,
    })),
  ];

  const handleDownload = () => {
    /* Ordenamos las columnas según el catálogo para que el Excel salga
       siempre con el mismo orden, elijan en el orden que elijan. */
    const columnasOrdenadas = COLUMNAS.map((c) => c.clave).filter((c) => columnas.includes(c));
    onExport({ fecha: fecha || null, estados, columnas: columnasOrdenadas });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Exportar Excel — ${activity.titulo}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            icon="download"
            onClick={handleDownload}
            disabled={columnas.length === 0 || estados.length === 0}
          >
            Descargar Excel
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="flex flex-col items-center py-8">
          <Spinner size="lg" label="Cargando fechas" />
          <p className="mt-4 text-ink-muted">Cargando fechas...</p>
        </div>
      ) : (
        <div className="space-y-5">
          {esRecurrente && (
            <Field
              label="Fecha"
              hint="Últimas 3 y próximas 3 fechas con inscripciones, o todas juntas."
              className="mb-0"
            >
              <Select options={fechaOptions} value={fecha} onChange={(v) => setFecha(v ?? '')} />
            </Field>
          )}

          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-ink-soft">
              Estados a incluir
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {ESTADOS.map((e) => (
                <Checkbox
                  key={e.clave}
                  label={e.label}
                  checked={estados.includes(e.clave)}
                  onChange={() => toggle(estados, setEstados, e.clave)}
                />
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-ink-soft">Columnas</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {COLUMNAS.map((c) => (
                <Checkbox
                  key={c.clave}
                  label={c.label}
                  checked={columnas.includes(c.clave)}
                  onChange={() => toggle(columnas, setColumnas, c.clave)}
                />
              ))}
            </div>
          </fieldset>
        </div>
      )}
    </Modal>
  );
};

export default ExportModal;
