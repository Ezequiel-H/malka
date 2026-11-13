import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { formatUtcCalendarDateEsAR, formatUtcCalendarDateToString } from '../../utils/dateUtils';
import { activityPublicTags, publicTagColor, publicTagIcon } from '../../utils/tagFields';
import { Button, Icon, IconoColor, Modal, Skeleton, cn } from '../ui';
import { useToast } from '../../contexts/ToastContext';
import useCargaSuave from '../../hooks/useCargaSuave';

/* Las columnas que el back sabe exportar, con el nombre que se ve en el chip. */
const COLUMNAS = {
  nombre: 'Nombre',
  apellido: 'Apellido',
  telefono: 'Teléfono',
  email: 'Email',
  restricciones: 'Restricciones',
  edad: 'Edad',
  dni: 'DNI',
  tags: 'Tags',
  estado: 'Estado',
  pago: 'Pago',
  monto: 'Monto',
  fechaEvento: 'Fecha del evento',
  fechaInscripcion: 'Inscripto el',
};
const TODAS = Object.keys(COLUMNAS);

/* Para qué se exporta: cada uso trae sus columnas y a quiénes incluye. */
const USOS = [
  {
    id: 'dia',
    titulo: 'Lista para el día',
    detalle: 'Para tener en la puerta: quién viene y qué come',
    icono: 'document',
    columnas: ['nombre', 'apellido', 'telefono', 'restricciones'],
    estados: ['aceptada'],
  },
  {
    id: 'contactos',
    titulo: 'Contactos',
    detalle: 'Para escribirles después por WhatsApp o mail',
    icono: 'phone',
    columnas: ['nombre', 'apellido', 'telefono', 'email'],
    estados: ['aceptada', 'pendiente', 'en_espera'],
  },
  {
    id: 'pagos',
    titulo: 'Pagos',
    detalle: 'Quién pagó y quién falta',
    icono: 'payment',
    columnas: ['nombre', 'apellido', 'estado', 'pago', 'monto'],
    estados: ['aceptada', 'pendiente'],
  },
  {
    id: 'todo',
    titulo: 'Todo',
    detalle: 'Todas las columnas, para cruzar en Excel',
    icono: 'download',
    columnas: TODAS,
    estados: ['aceptada', 'pendiente', 'en_espera'],
  },
];

const ESTADOS = [
  { id: 'aceptada', etiqueta: 'Confirmadas' },
  { id: 'pendiente', etiqueta: 'Pendientes' },
  { id: 'en_espera', etiqueta: 'En espera' },
  { id: 'cancelada', etiqueta: 'Canceladas' },
];

const FORMATOS = [
  { id: 'excel', etiqueta: 'Excel', detalle: '.xlsx', icono: 'document' },
  { id: 'csv', etiqueta: 'CSV', detalle: 'Sheets', icono: 'download' },
  { id: 'copiar', etiqueta: 'Copiar', detalle: 'Para pegar', icono: 'copy' },
];

const FILAS_PREVIA = 6;
const MEMORIA = 'malka.exportar';
const CORTA = { weekday: 'short', day: 'numeric', month: 'short' };

/* Lo último que se eligió, para no armarlo de nuevo cada vez. */
const leerMemoria = () => {
  try {
    const m = JSON.parse(window.localStorage.getItem(MEMORIA) ?? 'null');
    if (!m) return null;
    const columnas = (m.columnas ?? []).filter((c) => COLUMNAS[c]);
    const estados = (m.estados ?? []).filter((e) => ESTADOS.some((x) => x.id === e));
    if (!columnas.length) return null;
    return { uso: m.uso ?? 'propio', columnas, estados, formato: FORMATOS.some((f) => f.id === m.formato) ? m.formato : 'excel' };
  } catch {
    return null;
  }
};
const guardarMemoria = (m) => {
  try {
    window.localStorage.setItem(MEMORIA, JSON.stringify(m));
  } catch {
    /* Sin almacenamiento (modo privado): la próxima vez arranca de cero. */
  }
};

const limpiarTitulo = (t) => (t ?? '').replace(/^\[[A-Z]\]\s*/, '');
const nombreArchivo = (titulo, fecha, ext) =>
  `${limpiarTitulo(titulo).replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_|_$/g, '') || 'actividad'}_${fecha || 'todas'}.${ext}`;

/* CSV con BOM para que Excel y Sheets lean bien los acentos. */
const aCsv = (encabezados, filas) => {
  const celda = (v) => {
    const s = String(v ?? '');
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return `\uFEFF${[encabezados, ...filas].map((f) => f.map(celda).join(',')).join('\r\n')}`;
};
/* Con tabulaciones: así se pega en celdas separadas en Sheets o Excel. */
const aTabla = (encabezados, filas) =>
  [encabezados, ...filas].map((f) => f.map((v) => String(v ?? '').replace(/[\t\n\r]+/g, ' ')).join('\t')).join('\n');

/**
 * Exportar los inscriptos de una actividad. En vez de una grilla de casillas,
 * se elige para qué es y eso arma las columnas; la vista previa muestra con
 * los datos reales cómo va a quedar la planilla, y las columnas se ordenan
 * arrastrándolas (el Excel sale en ese orden).
 *
 * `onExport({ fecha, estados, columnas })` descarga el Excel; el CSV y el
 * «Copiar» se arman acá con los mismos datos que usa la vista previa.
 */
const ExportModal = ({ activity, dates, loading, onClose, onExport }) => {
  const { showError } = useToast();
  const memoria = useRef(leerMemoria()).current;
  const [uso, setUso] = useState(memoria?.uso ?? 'dia');
  const [columnas, setColumnas] = useState(memoria?.columnas ?? USOS[0].columnas);
  const [estados, setEstados] = useState(memoria?.estados ?? USOS[0].estados);
  const [formato, setFormato] = useState(memoria?.formato ?? 'excel');
  const [fecha, setFecha] = useState(null);
  const [arrastrando, setArrastrando] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [catalogo, setCatalogo] = useState([]);

  const id = activity?._id;
  const esRecurrente = activity?.tipo === 'recurrente';
  const hoy = formatUtcCalendarDateToString(new Date());

  /* Arranca en el próximo encuentro; si no hay, en todas las fechas. */
  useEffect(() => {
    if (fecha !== null || loading) return;
    if (!esRecurrente) setFecha('');
    else setFecha(dates?.find((d) => d.fechaStr >= hoy)?.fechaStr ?? '');
  }, [dates, loading, esRecurrente, fecha, hoy]);

  /* El color y el ícono de la actividad son los de su primer tag público. */
  useEffect(() => {
    let vivo = true;
    axios
      .get('/tags?activa=true')
      .then((r) => vivo && setCatalogo(r.data?.tags ?? []))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

  /* Una sola consulta por fecha con todo: estados y columnas se filtran acá. */
  const fechaPedida = fecha ?? '';
  const { datos, cargando, actualizando, error } = useCargaSuave(
    (signal) =>
      !id || fecha === null
        ? new Promise(() => {})
        : axios
            .get(`/activities/${id}/export`, {
              params: { formato: 'json', columnas: TODAS.join(','), estados: ESTADOS.map((e) => e.id).join(','), ...(fechaPedida && { fecha: fechaPedida }) },
              signal,
            })
            .then((r) => r.data),
    `${id}|${fecha}`
  );

  const tabla = useMemo(() => {
    if (!datos) return null;
    const indice = Object.fromEntries(datos.columnas.map((c, i) => [c.clave, i]));
    const encabezados = columnas.map((c) => datos.columnas[indice[c]]?.header ?? COLUMNAS[c]);
    const filas = datos.filas.filter((_, i) => estados.includes(datos.estados[i])).map((f) => columnas.map((c) => f[indice[c]]));
    return { encabezados, filas };
  }, [datos, columnas, estados]);

  if (!activity) return null;

  const tag = activityPublicTags(activity)[0];
  const elegirUso = (u) => {
    setUso(u.id);
    setColumnas(u.columnas);
    setEstados(u.estados);
  };
  const alternarColumna = (c) => {
    setUso('propio');
    setColumnas((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));
  };
  const alternarEstado = (e) => setEstados((es) => (es.includes(e) ? es.filter((x) => x !== e) : [...es, e]));
  const mover = (c, destino) => {
    setColumnas((cs) => {
      const sin = cs.filter((x) => x !== c);
      sin.splice(Math.max(0, Math.min(destino, sin.length)), 0, c);
      return sin;
    });
    setUso('propio');
  };
  const soltarSobre = (destino) => {
    if (!arrastrando || arrastrando === destino) return;
    mover(arrastrando, columnas.indexOf(destino));
  };
  /* Sin mouse: con Alt + flechas la columna enfocada se corre de lugar. */
  const teclaColumna = (e, c) => {
    if (!e.altKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault();
    mover(c, columnas.indexOf(c) + (e.key === 'ArrowLeft' ? -1 : 1));
  };

  const personas = tabla?.filas.length ?? 0;
  const listo = Boolean(tabla) && columnas.length > 0 && estados.length > 0;
  const fechaTexto = fechaPedida
    ? formatUtcCalendarDateEsAR(`${fechaPedida}T00:00:00.000Z`, { weekday: 'long', day: 'numeric', month: 'long' })
    : esRecurrente
      ? 'todas las fechas'
      : '';

  const exportar = async () => {
    guardarMemoria({ uso, columnas, estados, formato });
    if (formato === 'excel') {
      onExport({ fecha: fechaPedida || null, estados, columnas });
      return;
    }
    if (formato === 'csv') {
      const url = URL.createObjectURL(new Blob([aCsv(tabla.encabezados, tabla.filas)], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivo(activity.titulo, fechaPedida, 'csv');
      a.click();
      URL.revokeObjectURL(url);
      onClose();
      return;
    }
    try {
      await navigator.clipboard.writeText(aTabla(tabla.encabezados, tabla.filas));
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 1600);
    } catch {
      showError('No se pudo copiar: probá con CSV');
    }
  };

  const titulo = (
    <span className="flex items-center gap-4">
      <IconoColor icono={publicTagIcon(catalogo, tag) || 'activity'} color={publicTagColor(catalogo, tag)} tamano="lg" />
      <span className="min-w-0">
        <span className="block text-sm font-normal text-ink-muted">Exportar inscriptos de</span>
        <span className="block truncate font-grotesk text-2xl font-semibold tracking-tight text-ink">{limpiarTitulo(activity.titulo)}</span>
      </span>
    </span>
  );

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      className="sm:max-w-5xl"
      title={titulo}
      footer={
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-soft" aria-live="polite">
            <span className="font-semibold text-ink">
              {personas} {personas === 1 ? 'persona' : 'personas'}
            </span>{' '}
            · {columnas.length} {columnas.length === 1 ? 'columna' : 'columnas'}
            {fechaTexto && ` · ${fechaTexto}`}
          </p>
          <div className="flex gap-2">
            <Button variant="soft" onClick={onClose} className="flex-1 sm:flex-none">
              Cancelar
            </Button>
            <Button
              icon={formato === 'copiar' ? (copiado ? 'check' : 'copy') : 'download'}
              onClick={exportar}
              disabled={!listo || personas === 0}
              className="flex-1 sm:flex-none"
            >
              {formato === 'copiar' ? (copiado ? 'Copiado' : 'Copiar tabla') : `Descargar ${formato === 'excel' ? 'Excel' : 'CSV'}`}
            </Button>
          </div>
        </div>
      }
    >
      <div className="-m-5 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Configuración */}
        <div className="min-w-0 space-y-7 px-5 py-6 sm:px-6">
          <section>
            <h3 className="mb-3 font-grotesk text-sm font-semibold text-ink">¿Para qué lo vas a usar?</h3>
            <div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2">
              {USOS.map((u) => {
                const activo = uso === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => elegirUso(u)}
                    aria-pressed={activo}
                    className={cn(
                      'flex items-center gap-3 rounded-[16px] border p-3 text-start transition-[border-color,background-color,box-shadow] duration-base min-[420px]:flex-col min-[420px]:items-start min-[420px]:gap-2 min-[420px]:p-3.5',
                      activo ? 'border-ink bg-ink/[0.03] shadow-[0_0_0_1px_rgba(44,61,52,1)]' : 'border-surface-border hover:border-ink/25'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] transition-colors duration-base',
                        activo ? 'bg-ink text-surface' : 'bg-ink/[0.06] text-ink-soft'
                      )}
                    >
                      <Icon name={u.icono} size="sm" />
                    </span>
                    <span className="min-w-0 space-y-0.5 min-[420px]:space-y-2">
                      <span className="block font-grotesk text-sm font-semibold text-ink">{u.titulo}</span>
                      <span className="block text-xs leading-snug text-ink-muted">{u.detalle}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {uso === 'propio' && <p className="mt-2 animate-fade-in text-xs text-ink-muted">Armada a mano: tocá un uso para volver a sus columnas.</p>}
          </section>

          {esRecurrente && (
            <section>
              <h3 className="mb-3 font-grotesk text-sm font-semibold text-ink">¿De qué encuentro?</h3>
              {loading ? (
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-[4.25rem] w-28 rounded-[14px]" />
                  ))}
                </div>
              ) : (
                <div className="-mx-1 flex animate-fade-in gap-2 overflow-x-auto px-1 pb-1">
                  {[...(dates ?? []), { fechaStr: '' }].map((d) => {
                    const activo = fecha === d.fechaStr;
                    const proximo = d.fechaStr >= hoy;
                    return (
                      <button
                        key={d.fechaStr || 'todas'}
                        type="button"
                        onClick={() => setFecha(d.fechaStr)}
                        aria-pressed={activo}
                        className={cn(
                          'flex shrink-0 flex-col items-start rounded-[14px] border px-3.5 py-2.5 text-start transition-colors duration-base',
                          activo ? 'border-ink bg-ink text-surface' : 'border-surface-border bg-surface hover:border-ink/25'
                        )}
                      >
                        <span className="text-[0.7rem] font-semibold uppercase tracking-label opacity-70">
                          {!d.fechaStr ? 'Juntas' : proximo ? 'Próximo' : 'Pasado'}
                        </span>
                        <span className="font-grotesk text-sm font-semibold first-letter:uppercase">
                          {d.fechaStr ? formatUtcCalendarDateEsAR(`${d.fechaStr}T00:00:00.000Z`, CORTA).replace(',', '').toLowerCase() : 'Todas'}
                        </span>
                        <span className={cn('text-xs tabular-nums', activo ? 'text-surface/70' : 'text-ink-muted')}>
                          {d.fechaStr ? `${d.count} ${d.count === 1 ? 'persona' : 'personas'}` : 'las fechas'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          <section>
            <h3 className="mb-3 font-grotesk text-sm font-semibold text-ink">¿A quiénes?</h3>
            <div className="flex flex-wrap gap-2">
              {ESTADOS.map((e) => {
                const activo = estados.includes(e.id);
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => alternarEstado(e.id)}
                    aria-pressed={activo}
                    className={cn(
                      'inline-flex min-h-[36px] items-center gap-2 rounded-pill border px-3.5 text-sm font-medium transition-colors duration-base',
                      activo ? 'border-ink bg-ink text-surface' : 'border-surface-border text-ink-soft hover:border-ink/25'
                    )}
                  >
                    {activo && <Icon name="check" size="xs" />}
                    {e.etiqueta}
                    <span className={cn('tabular-nums transition-opacity duration-base', activo ? 'text-surface/70' : 'text-ink-faint', actualizando && 'opacity-50')}>
                      {datos?.porEstado?.[e.id] ?? '·'}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="mb-1 font-grotesk text-sm font-semibold text-ink">Columnas</h3>
            <p className="mb-3 text-xs text-ink-muted">Arrastrá para cambiar el orden. Tocá para sacar o sumar.</p>
            <ul className="flex flex-wrap gap-2" aria-label="Columnas elegidas, en orden">
              {columnas.map((c) => (
                <li
                  key={c}
                  draggable
                  data-columna={c}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    setArrastrando(c);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    soltarSobre(c);
                  }}
                  onDragEnd={() => setArrastrando(null)}
                  className={cn('animate-fade-in transition-opacity duration-fast', arrastrando === c && 'opacity-40')}
                >
                  <button
                    type="button"
                    onClick={() => alternarColumna(c)}
                    onKeyDown={(e) => teclaColumna(e, c)}
                    aria-label={`${COLUMNAS[c]}: sacar (Alt + flechas para moverla)`}
                    className="inline-flex min-h-[34px] cursor-grab items-center gap-1.5 rounded-pill bg-primary-600 pe-3 ps-2.5 text-sm font-medium text-surface active:cursor-grabbing"
                  >
                    <span aria-hidden className="text-surface/60">
                      ⋮⋮
                    </span>
                    {COLUMNAS[c]}
                    <Icon name="close" size="xs" className="text-surface/70" />
                  </button>
                </li>
              ))}
              {TODAS.filter((c) => !columnas.includes(c)).map((c) => (
                <li key={c} className="animate-fade-in">
                  <button
                    type="button"
                    onClick={() => alternarColumna(c)}
                    aria-label={`Sumar ${COLUMNAS[c]}`}
                    className="inline-flex min-h-[34px] items-center gap-1.5 rounded-pill border border-dashed border-ink/20 px-3 text-sm text-ink-muted transition-colors duration-base hover:border-ink/40 hover:text-ink"
                  >
                    <Icon name="add" size="xs" />
                    {COLUMNAS[c]}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Vista previa con los datos reales */}
        <div className="min-w-0 border-t border-surface-border bg-surface-sunken px-5 py-6 sm:px-6 lg:border-s lg:border-t-0">
          {/* En escritorio queda a la vista mientras se arman las columnas. */}
          <div className="lg:sticky lg:top-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-grotesk text-sm font-semibold text-ink">Así va a quedar</h3>
              {tabla && personas > 0 && (
                <span className="text-xs text-ink-muted">
                  {personas > FILAS_PREVIA ? `Primeras ${FILAS_PREVIA} de ${personas} filas` : `${personas} ${personas === 1 ? 'fila' : 'filas'}`}
                </span>
              )}
            </div>
            <div className={cn('overflow-x-auto rounded-[14px] border border-surface-border bg-surface transition-opacity duration-base', actualizando && 'opacity-60')}>
              {error ? (
                <p className="px-3 py-6 text-center text-sm text-ink-muted">No se pudo armar la vista previa. Cerrá y probá de nuevo.</p>
              ) : !tabla ? (
                <div className="space-y-2 p-3" aria-busy={cargando}>
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <table className="w-full min-w-[26rem] text-sm">
                    <thead>
                      <tr className="border-b border-surface-border bg-primary-50/60">
                        {tabla.encabezados.map((h, i) => (
                          <th key={columnas[i]} className="animate-fade-in whitespace-nowrap px-3 py-2 text-start text-xs font-semibold text-ink-soft">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tabla.filas.slice(0, FILAS_PREVIA).map((f, i) => (
                        <tr key={i} className="border-b border-surface-border/70 last:border-0">
                          {f.map((v, j) => (
                            <td key={columnas[j]} className="animate-fade-in max-w-[14rem] truncate whitespace-nowrap px-3 py-2 text-ink-soft">
                              {v === '' || v === null || v === undefined ? <span className="text-ink-faint">—</span> : v}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!personas && (
                    <p className="animate-fade-in px-3 py-6 text-center text-sm text-ink-muted">
                      {estados.length ? 'No hay nadie con esos estados en este encuentro.' : 'Elegí a quiénes exportar.'}
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Formato">
              {FORMATOS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={formato === f.id}
                  onClick={() => setFormato(f.id)}
                  className={cn(
                    'flex flex-col items-start gap-1.5 rounded-[14px] border px-3 py-2.5 text-start transition-colors duration-base sm:flex-row sm:items-center sm:gap-2',
                    formato === f.id ? 'border-ink bg-surface' : 'border-transparent bg-surface/60 hover:bg-surface'
                  )}
                >
                  <Icon name={f.icono} size="sm" className="text-ink-soft" />
                  <span>
                    <span className="block text-sm font-semibold text-ink">{f.etiqueta}</span>
                    <span className="block text-xs text-ink-muted">{f.detalle}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ExportModal;
