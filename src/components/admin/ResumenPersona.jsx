import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge, Button, Icon, Skeleton, Table, cn } from '../ui';
import useCargaSuave from '../../hooks/useCargaSuave';
import { EJE, RAMPA } from './metricas/colores';
import { Kpi, Panel, Segmentado, TooltipCaja, cursorBarras, ejeX, ejeY, mesCorto, mesLargo, numero, pesos, porciento } from './metricas/piezas';

/* Cada estado con su color de estado, ícono y una frase que lo explica: el
   color nunca va solo. */
export const ESTADOS = {
  frecuente: { etiqueta: 'Frecuente', tono: 'success', icono: 'star', frase: (r) => `Vino ${r.enUltimos90} veces en los últimos 3 meses.` },
  ocasional: { etiqueta: 'Ocasional', tono: 'info', icono: 'time', frase: (r) => `Viene de vez en cuando: ${numero(r.porMesPromedio)} veces por mes en promedio.` },
  nueva: { etiqueta: 'Nueva', tono: 'primary', icono: 'sparkles', frase: () => 'Vino por primera vez hace menos de 2 meses: es buen momento para acompañarla.' },
  alejandose: { etiqueta: 'Se está alejando', tono: 'warning', icono: 'warning', frase: (r) => `Venía y hace ${semanas(r.diasSinVenir)} que no viene.` },
  inactiva: { etiqueta: 'Inactiva', tono: 'danger', icono: 'bellOff', frase: (r) => `No viene hace más de 3 meses (${semanas(r.diasSinVenir)}).` },
  sin_participar: { etiqueta: 'Sin participar', tono: 'neutral', icono: 'user', frase: () => 'Todavía no participó de ninguna actividad.' },
};

const semanas = (dias) => (dias < 14 ? `${dias} días` : `${Math.round(dias / 7)} semanas`);
const fecha = (f) => (f ? new Date(f).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—');
const fechaCorta = (f) => new Date(f).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const titulo = (t) => (t ?? '').replace(/^\[[A-Z]\]\s*/, '');

const ESTADO_INSCRIPCION = {
  aceptada: { etiqueta: 'Aceptada', tono: 'success' },
  pendiente: { etiqueta: 'Pendiente', tono: 'warning' },
  en_espera: { etiqueta: 'En espera', tono: 'info' },
  cancelada: { etiqueta: 'Cancelada', tono: 'neutral' },
};

const FILTROS = [
  { valor: 'todas', etiqueta: 'Todas' },
  { valor: 'vino', etiqueta: 'Vino' },
  { valor: 'proximas', etiqueta: 'Próximas' },
  { valor: 'canceladas', etiqueta: 'Canceladas' },
];

/**
 * Cómo viene una persona: su estado en una palabra, los números que lo
 * explican, cuándo vino mes a mes, qué hace y todo su historial. Es la vista
 * para entender a alguien antes de escribirle.
 */
const POR_TANDA = 20;

const ResumenPersona = ({ userId }) => {
  const [filtro, setFiltro] = useState('todas');
  const [visibles, setVisibles] = useState(POR_TANDA);
  const { datos: r, cargando, error } = useCargaSuave(
    (signal) => axios.get(`/admin/users/${userId}/metrics`, { signal }).then((res) => res.data),
    userId
  );

  if (error) return <p className="text-sm text-danger-600">No se pudo calcular el resumen de esta persona.</p>;
  if (cargando || !r) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Calculando el resumen">
        <Skeleton className="h-24 rounded-card" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-card" />
          ))}
        </div>
      </div>
    );
  }

  const estado = ESTADOS[r.estado] ?? ESTADOS.sin_participar;
  const porMes = r.porMes.map((m) => ({ ...m, etiqueta: mesCorto(m.mes) }));
  const historial = r.historial.filter((h) => {
    if (filtro === 'vino') return h.estado === 'aceptada' && h.pasada && h.asistencia !== 'falto';
    if (filtro === 'proximas') return !h.pasada && h.estado !== 'cancelada';
    if (filtro === 'canceladas') return h.estado === 'cancelada';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-card border border-surface-border bg-surface p-5 sm:flex-row sm:items-center sm:gap-5">
        <Badge tone={estado.tono} icon={estado.icono} className="self-start text-sm sm:self-center">
          {estado.etiqueta}
        </Badge>
        <p className="text-ink-soft">{estado.frase(r)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Kpi titulo="Veces que vino" valor={numero(r.participaciones)} detalle={r.primeraVez ? `Desde el ${fecha(r.primeraVez)}` : 'Todavía ninguna'} />
        <Kpi
          titulo="Última vez"
          valor={r.ultimaVez ? fechaCorta(r.ultimaVez) : '—'}
          detalle={
            r.ultimaVez
              ? r.diasSinVenir === 0
                ? 'Hoy'
                : `Hace ${semanas(r.diasSinVenir)}`
              : r.proximas
                ? `${r.proximas} inscripciones próximas`
                : null
          }
        />
        <Kpi
          titulo="Asistencia"
          valor={porciento(r.asistencia.tasa)}
          detalle={
            r.asistencia.vino + r.asistencia.falto
              ? `Vino ${r.asistencia.vino}, faltó ${r.asistencia.falto}`
              : 'Todavía no se le tomó asistencia'
          }
        />
        <Kpi
          titulo="Pagó"
          valor={pesos(r.plata.pagado)}
          detalle={r.plata.pagosPendientes ? `${r.plata.pagosPendientes} comprobantes por revisar` : `${numero(r.plata.pagos)} pagos aprobados`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel className="lg:col-span-3" titulo="Mes a mes" descripcion="Cuántas veces vino cada mes del último año.">
          <div className="h-52 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porMes} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <CartesianGrid vertical={false} stroke={EJE.grilla} />
                <XAxis dataKey="etiqueta" {...ejeX} interval="preserveStartEnd" minTickGap={10} />
                <YAxis {...ejeY} allowDecimals={false} />
                <Tooltip
                  cursor={cursorBarras}
                  content={
                    <TooltipCaja
                      titulo={(_, payload) => mesLargo(payload[0].payload.mes)}
                      filas={(payload) => [{ etiqueta: 'Veces', valor: numero(payload[0].value), color: RAMPA[6] }]}
                    />
                  }
                />
                <Bar dataKey="participaciones" fill={RAMPA[6]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel className="lg:col-span-2" titulo="Qué hace" descripcion="Propuestas y actividades a las que más vino.">
          {r.porCategoria.length ? (
            <>
              <ul className="flex flex-wrap gap-2">
                {r.porCategoria.map((c) => (
                  <li key={c.nombre}>
                    <Badge tone="neutral" icon="tag">
                      <span className="capitalize">{c.nombre}</span>
                      <span className="ml-1 tabular-nums text-ink-muted">· {c.veces}</span>
                    </Badge>
                  </li>
                ))}
              </ul>
              <ul className="mt-4 space-y-2 text-sm">
                {r.porActividad.map((a) => (
                  <li key={a.titulo} className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate text-ink-soft">{titulo(a.titulo)}</span>
                    <span className="shrink-0 tabular-nums font-semibold text-ink">{a.veces}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-ink-muted">Todavía no participó de ninguna actividad.</p>
          )}
        </Panel>
      </div>

      <Panel
        titulo="Historial"
        descripcion={`${numero(r.inscripciones)} inscripciones en total${r.canceladas ? `, ${numero(r.canceladas)} canceladas` : ''}.`}
        accion={
          <Segmentado
            opciones={FILTROS}
            valor={filtro}
            onChange={(f) => {
              setFiltro(f);
              setVisibles(POR_TANDA);
            }}
            etiqueta="Filtrar historial"
          />
        }
      >
        <div key={filtro} className="animate-fade-in">
          <Table
            stacked
            rows={historial.slice(0, visibles)}
            empty={<p className="text-sm text-ink-muted">No hay inscripciones con este filtro.</p>}
            columns={[
              { key: 'fecha', header: 'Fecha', render: (h) => <span className="whitespace-nowrap tabular-nums">{fecha(h.fecha)}</span> },
              {
                key: 'actividad',
                header: 'Actividad',
                render: (h) => (
                  <Link to={`/admin/activities/${h.actividadId}/inscriptions`} className="font-medium text-ink hover:text-primary-700 hover:underline">
                    {titulo(h.titulo)}
                  </Link>
                ),
              },
              {
                key: 'estado',
                header: 'Inscripción',
                render: (h) => (
                  <Badge tone={ESTADO_INSCRIPCION[h.estado]?.tono ?? 'neutral'}>{ESTADO_INSCRIPCION[h.estado]?.etiqueta ?? h.estado}</Badge>
                ),
              },
              {
                key: 'asistencia',
                header: 'Asistencia',
                render: (h) =>
                  h.estado !== 'aceptada' ? (
                    <span className="text-ink-faint">—</span>
                  ) : !h.pasada ? (
                    <span className="text-ink-muted">Próxima</span>
                  ) : h.asistencia ? (
                    <span className={cn('inline-flex items-center gap-1.5', h.asistencia === 'vino' ? 'text-success-700' : 'text-ink-soft')}>
                      <Icon name={h.asistencia === 'vino' ? 'check' : 'close'} size="xs" />
                      {h.asistencia === 'vino' ? 'Vino' : 'Faltó'}
                    </span>
                  ) : (
                    <span className="text-ink-muted">Sin marcar</span>
                  ),
              },
              {
                key: 'pago',
                header: 'Pago',
                align: 'right',
                render: (h) =>
                  h.pago ? (
                    <span className="whitespace-nowrap tabular-nums">
                      {h.pago.moneda === 'USD' ? `US$ ${numero(h.pago.monto)}` : pesos(h.pago.monto)}
                      <span className="ml-1.5 text-xs text-ink-muted">
                        {h.pago.estado === 'aprobado' ? 'aprobado' : h.pago.estado === 'pendiente' ? 'por revisar' : 'rechazado'}
                      </span>
                    </span>
                  ) : (
                    <span className="text-ink-faint">—</span>
                  ),
              },
            ]}
          />
          {historial.length > visibles && (
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" size="sm" onClick={() => setVisibles((v) => v + POR_TANDA)}>
                Ver más ({numero(historial.length - visibles)} restantes)
              </Button>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
};

export default ResumenPersona;
