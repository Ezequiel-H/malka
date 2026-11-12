import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '../../ui';
import { EJE, RAMPA, SERIE } from './colores';
import {
  BarrasHorizontales,
  Cambio,
  Kpi,
  Leyenda,
  MapaTemporadas,
  MatrizCruce,
  Panel,
  Segmentado,
  TooltipCaja,
  cursorBarras,
  ejeX,
  ejeY,
  mesCorto,
  mesLargo,
  numero,
  porciento,
} from './piezas';

const DIAS_LARGOS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const VECES_QUE_VINIERON = ['1', '2-4', '5-9', '10-24', '25+'];
const mayuscula = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
const promedio = (lista) => (lista.length ? lista.reduce((a, b) => a + b, 0) / lista.length : 0);

/* Qué se puede mirar mes a mes. */
const VISTAS_MES = [
  { valor: 'personas', etiqueta: 'Personas' },
  { valor: 'participaciones', etiqueta: 'Participaciones' },
  { valor: 'registros', etiqueta: 'Registros' },
];

/* ---------- Lecturas: lo que dice cada gráfico, en una frase ---------- */

const lecturaMeses = (porMes, vista) => {
  const conDatos = porMes.filter((m) => m[vista] > 0);
  if (!conDatos.length) return null;
  const mejor = conDatos.reduce((a, b) => (b[vista] > a[vista] ? b : a));
  const ultimos = porMes.slice(-3).map((m) => m[vista]);
  const previos = porMes.slice(-6, -3).map((m) => m[vista]);
  const tendencia =
    previos.length === 3 && promedio(previos) > 0
      ? Math.round(((promedio(ultimos) - promedio(previos)) / promedio(previos)) * 100)
      : null;
  const que = { personas: 'personas distintas', participaciones: 'participaciones', registros: 'registros nuevos' }[vista];
  let frase = `${mayuscula(mesLargo(mejor.mes))} fue el mejor mes, con ${numero(mejor[vista])} ${que}.`;
  if (tendencia !== null && Math.abs(tendencia) >= 5) {
    frase += ` En los últimos 3 meses hubo un ${Math.abs(tendencia)} % ${tendencia > 0 ? 'más' : 'menos'} que en los 3 anteriores.`;
  }
  if (vista === 'personas') {
    const nuevas = porMes.reduce((t, m) => t + m.nuevas, 0);
    const total = porMes.reduce((t, m) => t + m.personas, 0);
    if (total) frase += ` De cada 100 personas por mes, ${Math.round((nuevas / total) * 100)} venían por primera vez.`;
  }
  return frase;
};

const lecturaFrecuencia = (frecuencia) => {
  const total = frecuencia.reduce((t, f) => t + f.personas, 0);
  if (!total) return null;
  const unaVez = frecuencia.find((f) => f.id === '1')?.personas ?? 0;
  const habituales = frecuencia.filter((f) => ['5-9', '10-24', '25+'].includes(f.id)).reduce((t, f) => t + f.personas, 0);
  return `${Math.round((unaVez / total) * 100)} de cada 100 vinieron una sola vez, y ${Math.round((habituales / total) * 100)} de cada 100 son habituales (5 veces o más).`;
};

const lecturaTemporadas = (celdas) => {
  if (!celdas.some((c) => c.participaciones)) return null;
  const porDia = Array.from({ length: 7 }, (_, d) => celdas.filter((c) => c.dia === d).reduce((t, c) => t + c.participaciones, 0));
  const porMes = new Map();
  for (const c of celdas) porMes.set(c.mes, (porMes.get(c.mes) ?? 0) + c.participaciones);
  const dia = porDia.indexOf(Math.max(...porDia));
  const [mes] = [...porMes.entries()].sort((a, b) => b[1] - a[1])[0];
  const total = porDia.reduce((a, b) => a + b, 0);
  return `Los ${DIAS_LARGOS[dia]} se llevan el ${Math.round((porDia[dia] / total) * 100)} % de las participaciones. El mes más lleno fue ${mesLargo(mes)}.`;
};

const lecturaCruce = ({ categorias, matriz }) => {
  let mejor = null;
  categorias.forEach((a, i) =>
    categorias.forEach((b, j) => {
      if (i === j || matriz[i][i] < 5) return;
      const pct = matriz[i][j] / matriz[i][i];
      if (!mejor || pct > mejor.pct) mejor = { a: a.nombre, b: b.nombre, pct };
    })
  );
  return mejor ? `La pareja más fuerte: de quienes hacen ${mejor.a}, el ${Math.round(mejor.pct * 100)} % también hace ${mejor.b}.` : null;
};

const lecturaEdad = (edad) => {
  if (edad.promedio === null) return null;
  const mayor = edad.tramos.reduce((a, b) => (b.personas > a.personas ? b : a));
  return `El grupo más grande es el de ${mayor.etiqueta} años${edad.sinDato ? `. ${numero(edad.sinDato)} no cargaron su fecha de nacimiento` : ''}.`;
};

/* ---------- Rangos para abrir «En detalle» ---------- */

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/* Un mes entero, recortado a hoy si es el mes en curso. */
const rangoMes = (mes) => {
  const [y, m] = mes.split('-').map(Number);
  const fin = new Date(y, m, 0);
  const hoy = new Date();
  return { desde: `${mes}-01`, hasta: iso(fin > hoy ? hoy : fin) };
};

/* Los últimos `dias` días hasta hoy. */
const rangoDias = (dias) => {
  const hoy = new Date();
  return { desde: iso(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - (dias - 1))), hasta: iso(hoy) };
};

/* El clic de recharts trae el dato de la columna tocada. */
const datoTocado = (e) => e?.activePayload?.[0]?.payload ?? null;

/* ---------- La vista ---------- */

/**
 * Las métricas de personas y comunidad. Arriba, lo que pide la comisión
 * directiva en números grandes y comparados con el período anterior; abajo,
 * los gráficos, cada uno con su lectura en una frase y su «¿Cómo se lee?».
 * Casi todo se toca: una barra o una celda abre «En detalle» con la
 * pregunta armada.
 */
const VistaPersonas = ({ personas, anterior, abrirDetalle }) => {
  const p = personas;
  const [vistaMes, setVistaMes] = useState('personas');
  const [ocultas, setOcultas] = useState([]);
  const [mesElegido, setMesElegido] = useState(null);
  const porMes = p.porMes.map((m) => ({ ...m, etiqueta: mesCorto(m.mes), yaVenian: m.personas - m.nuevas }));
  const asistenciaMarcada = p.asistencia.vinieron + p.asistencia.faltaron;
  const alternar = (serie) => setOcultas((o) => (o.includes(serie) ? o.filter((x) => x !== serie) : [...o, serie]));
  const elegido = porMes.find((m) => m.mes === mesElegido);
  const promedioPersonas = promedio(porMes.map((m) => m.personas));

  const series =
    vistaMes === 'personas'
      ? [
          { clave: 'yaVenian', etiqueta: 'Ya venían', color: SERIE.verde },
          { clave: 'nuevas', etiqueta: 'Nuevas', color: SERIE.ambar },
        ]
      : [{ clave: vistaMes, etiqueta: vistaMes === 'participaciones' ? 'Participaciones' : 'Registros', color: RAMPA[6] }];
  const visibles = series.filter((s) => !ocultas.includes(s.clave));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 items-start gap-3 sm:gap-4 lg:grid-cols-4">
        <Kpi
          titulo="Personas que participaron"
          valor={numero(p.participantes)}
          detalle={`${numero(p.participaciones)} participaciones, ${numero(p.participacionesPorPersona)} por persona`}
          cambio={<Cambio actual={p.participantes} anterior={anterior?.participantes} />}
          ayuda="Personas distintas con al menos una inscripción aceptada a un encuentro que ya pasó en este período. Si se marcó que faltó, no cuenta."
        />
        <Kpi
          titulo="Nuevas"
          valor={numero(p.nuevos)}
          detalle="Vinieron por primera vez en el período"
          cambio={<Cambio actual={p.nuevos} anterior={anterior?.nuevos} />}
          ayuda="Personas cuya primera participación de toda la historia cayó dentro de este período."
        />
        <Kpi
          titulo="Vuelven"
          valor={porciento(p.vuelven.porcentaje)}
          detalle={
            p.vuelven.cohorte
              ? `${numero(p.vuelven.volvieron)} de ${numero(p.vuelven.cohorte)} volvieron en sus primeros 60 días`
              : 'Todavía nadie nuevo cumplió 60 días'
          }
          cambio={<Cambio actual={p.vuelven.porcentaje} anterior={anterior?.vuelven?.porcentaje} enPuntos />}
          ayuda="De las personas nuevas del período que ya llevan 60 días desde su primera vez, qué parte volvió a otro encuentro en esos 60 días. Es la mejor señal de si la casa engancha."
        />
        <Kpi
          titulo="Frecuentes"
          valor={numero(p.frecuentes)}
          detalle={`Vinieron ${p.umbralFrecuente} veces o más en el período`}
          cambio={<Cambio actual={p.frecuentes} anterior={anterior?.frecuentes} />}
          ayuda={`Personas que participaron ${p.umbralFrecuente} veces o más dentro del período elegido. Son el núcleo de la casa.`}
        />
      </div>

      <Panel
        titulo="Mes a mes"
        lectura={lecturaMeses(porMes, vistaMes)}
        ayuda={
          vistaMes === 'personas'
            ? 'Cada columna es un mes. La parte verde son las personas que ya habían venido antes; la ámbar, las que vinieron por primera vez ese mes. Una persona que vino 4 veces en el mes cuenta una vez. Tocá la leyenda para mirar una sola parte, y una columna para ver ese mes.'
            : vistaMes === 'participaciones'
              ? 'Cada columna es un mes y cuenta participaciones: si una persona vino 4 veces, suma 4. Sirve para ver cuánto se usó la casa. Tocá una columna para ver ese mes.'
              : 'Cada punto es un mes: cuántas personas se registraron en la app (se hicieron socias). No dice si después vinieron.'
        }
        accion={
          <Segmentado
            opciones={VISTAS_MES}
            valor={vistaMes}
            onChange={(v) => {
              setVistaMes(v);
              setOcultas([]);
              setMesElegido(null);
            }}
            etiqueta="Qué mirar mes a mes"
          />
        }
      >
        <Leyenda
          items={series.map((s) => ({
            etiqueta: s.etiqueta,
            color: s.color,
            activo: !ocultas.includes(s.clave),
            onToggle: series.length > 1 ? () => alternar(s.clave) : undefined,
          }))}
        />
        <div key={vistaMes} className="h-72 min-w-0 animate-fade-in">
          <ResponsiveContainer width="100%" height="100%">
            {vistaMes === 'registros' ? (
              <LineChart data={porMes} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid vertical={false} stroke={EJE.grilla} />
                <XAxis dataKey="etiqueta" {...ejeX} interval="preserveStartEnd" minTickGap={12} />
                <YAxis {...ejeY} allowDecimals={false} />
                <Tooltip
                  cursor={{ stroke: EJE.texto, strokeDasharray: '3 3' }}
                  content={
                    <TooltipCaja
                      titulo={(_, payload) => mesLargo(payload[0].payload.mes)}
                      filas={(payload) => [{ etiqueta: 'Registros', valor: numero(payload[0].value), color: RAMPA[6] }]}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="registros"
                  stroke={RAMPA[6]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: RAMPA[6], stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            ) : (
              <BarChart
                data={porMes}
                margin={{ top: 4, right: 4, bottom: 0, left: -8 }}
                barCategoryGap="22%"
                className="cursor-pointer"
                onClick={(e) => {
                  const d = datoTocado(e);
                  if (d) setMesElegido((m) => (m === d.mes ? null : d.mes));
                }}
              >
                <CartesianGrid vertical={false} stroke={EJE.grilla} />
                <XAxis dataKey="etiqueta" {...ejeX} interval="preserveStartEnd" minTickGap={12} />
                <YAxis {...ejeY} allowDecimals={false} />
                <Tooltip
                  cursor={cursorBarras}
                  content={
                    <TooltipCaja
                      titulo={(_, payload) => mesLargo(payload[0].payload.mes)}
                      filas={(payload) => {
                        const d = payload[0].payload;
                        return vistaMes === 'personas'
                          ? [
                              { etiqueta: 'Ya venían', valor: numero(d.yaVenian), color: SERIE.verde },
                              { etiqueta: 'Nuevas', valor: numero(d.nuevas), color: SERIE.ambar },
                              { etiqueta: 'En total', valor: numero(d.personas) },
                            ]
                          : [{ etiqueta: 'Participaciones', valor: numero(d.participaciones), color: RAMPA[6] }];
                      }}
                    />
                  }
                />
                {visibles.map((s, i) => (
                  <Bar
                    key={s.clave}
                    dataKey={s.clave}
                    name={s.etiqueta}
                    stackId="p"
                    fill={s.color}
                    stroke="#fff"
                    strokeWidth={visibles.length > 1 ? 1 : 0}
                    radius={i === visibles.length - 1 ? [4, 4, 0, 0] : 0}
                  >
                    {/* El mes elegido queda entero y los demás se atenúan:
                        así se ve cuál se está mirando abajo. */}
                    {porMes.map((m) => (
                      <Cell key={m.mes} fillOpacity={!mesElegido || mesElegido === m.mes ? 1 : 0.35} />
                    ))}
                  </Bar>
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        {vistaMes !== 'registros' && !elegido && <p className="mt-2 text-xs text-ink-muted">Tocá una columna para ver ese mes.</p>}
        {elegido && vistaMes !== 'registros' && (
          <div
            key={elegido.mes}
            className="mt-4 flex animate-fade-in-up flex-col gap-3 rounded-control border border-surface-border bg-surface-sunken p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="text-sm leading-relaxed text-ink-soft">
              <p className="font-semibold capitalize text-ink">{mesLargo(elegido.mes)}</p>
              <p>
                {numero(elegido.personas)} personas ({numero(elegido.nuevas)} nuevas) y {numero(elegido.participaciones)} participaciones.{' '}
                {promedioPersonas > 0 &&
                  `${elegido.personas >= promedioPersonas ? 'Más' : 'Menos'} que el promedio del período (${numero(Math.round(promedioPersonas))} personas por mes).`}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => abrirDetalle({ veces: VECES_QUE_VINIERON }, rangoMes(elegido.mes))}>
                Ver quiénes vinieron
              </Button>
              {elegido.nuevas > 0 && (
                <Button size="sm" variant="secondary" onClick={() => abrirDetalle({ nueva: ['si'] }, rangoMes(elegido.mes))}>
                  Ver las nuevas
                </Button>
              )}
              <Button size="sm" variant="ghost" icon="close" iconOnly label="Cerrar el mes" onClick={() => setMesElegido(null)} />
            </div>
          </div>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          titulo="Cuántas veces vienen"
          lectura={lecturaFrecuencia(p.frecuencia)}
          ayuda="Personas agrupadas según cuántas veces participaron en el período. No es lo mismo venir 2 veces que 25: a la izquierda los que probaron, a la derecha el núcleo. Tocá una columna para ver quiénes son."
        >
          <div className="h-60 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={p.frecuencia}
                margin={{ top: 18, right: 4, bottom: 0, left: -8 }}
                className="cursor-pointer"
                onClick={(e) => {
                  const d = datoTocado(e);
                  if (d) abrirDetalle({ veces: [d.id] });
                }}
              >
                <CartesianGrid vertical={false} stroke={EJE.grilla} />
                <XAxis dataKey="etiqueta" {...ejeX} />
                <YAxis {...ejeY} allowDecimals={false} />
                <Tooltip
                  cursor={cursorBarras}
                  content={
                    <TooltipCaja
                      titulo={(label) => `${label} en el período`}
                      filas={(payload) => [{ etiqueta: 'Personas', valor: numero(payload[0].value), color: RAMPA[6] }]}
                    />
                  }
                />
                <Bar
                  dataKey="personas"
                  name="Personas"
                  fill={RAMPA[6]}
                  radius={[4, 4, 0, 0]}
                  label={{ position: 'top', fontSize: 12, fill: EJE.tinta, formatter: numero }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-ink-muted">Tocá una columna para ver quiénes son.</p>
        </Panel>

        <Panel
          titulo="Activas hoy"
          lectura={
            p.activos.d90
              ? `De las ${numero(p.activos.d90)} personas que vinieron en los últimos 3 meses, ${numero(p.activos.d30)} (${Math.round((p.activos.d30 / p.activos.d90) * 100)} %) vinieron también este último mes.`
              : null
          }
          ayuda="Personas que participaron al menos una vez en los últimos 30, 60 y 90 días contados desde hoy, sin importar el período elegido arriba. Si la barra de 30 días queda muy lejos de la de 90, hay gente que se está alejando. Tocá una barra para ver quiénes son."
        >
          <BarrasHorizontales
            filas={[
              { etiqueta: 'Últimos 30 días', valor: p.activos.d30, dias: 30 },
              { etiqueta: 'Últimos 60 días', valor: p.activos.d60, dias: 60 },
              { etiqueta: 'Últimos 90 días', valor: p.activos.d90, dias: 90 },
            ]}
            formato={(n) => `${numero(n)} personas`}
            onFila={(f) => abrirDetalle({ veces: VECES_QUE_VINIERON }, rangoDias(f.dias))}
          />
          <p className="mt-5 border-t border-surface-border pt-4 text-sm text-ink-muted">
            <span className="font-semibold text-ink">{numero(p.registrados)}</span> personas registradas en total,{' '}
            <span className="font-semibold text-ink">{numero(p.registrosEnRango)}</span> en este período.
          </p>
        </Panel>
      </div>

      <Panel
        titulo="Temporadas"
        lectura={lecturaTemporadas(p.temporadas)}
        ayuda="Cada fila es un día de la semana y cada columna un mes. Cuanto más oscura la celda, más participaciones hubo esos días de ese mes. Sirve para planificar compras, staff y actividades. Pasá el mouse para ver el número y tocá una celda para ver quiénes vinieron ese mes."
      >
        <MapaTemporadas celdas={p.temporadas} onCelda={({ mes }) => abrirDetalle({ veces: VECES_QUE_VINIERON }, rangoMes(mes))} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel
          className="lg:col-span-3"
          titulo="Cruce entre propuestas"
          lectura={lecturaCruce(p.cruce)}
          ayuda="Leé cada fila así: «de quienes hacen [la propuesta de la fila], este porcentaje también hace [la de la columna]». La diagonal es cuánta gente hace cada propuesta. Tocá una celda para ver esas personas."
        >
          <MatrizCruce
            categorias={p.cruce.categorias}
            matriz={p.cruce.matriz}
            onCelda={(a, b) => abrirDetalle(a === b ? { propuesta: [a] } : { propuesta: [a], tambien: [b] })}
          />
        </Panel>

        <Panel
          className="lg:col-span-2"
          titulo="Edad"
          lectura={lecturaEdad(p.edad)}
          ayuda="Edad de las personas que participaron en el período, calculada a hoy con la fecha de nacimiento que cargaron. Tocá una columna para ver quiénes son."
        >
          <p className="text-4xl font-bold tabular-nums tracking-tight text-ink">
            {p.edad.promedio === null ? '—' : numero(p.edad.promedio)}
            <span className="ml-1.5 text-lg font-medium text-ink-muted">años de promedio</span>
          </p>
          <div className="mt-4 h-40 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={p.edad.tramos}
                margin={{ top: 4, right: 0, bottom: 0, left: -12 }}
                className="cursor-pointer"
                onClick={(e) => {
                  const d = datoTocado(e);
                  if (d) abrirDetalle({ edad: [d.id], veces: VECES_QUE_VINIERON });
                }}
              >
                <XAxis dataKey="id" {...ejeX} tick={{ fontSize: 11, fill: EJE.texto }} interval={0} />
                <YAxis {...ejeY} allowDecimals={false} />
                <Tooltip
                  cursor={cursorBarras}
                  content={
                    <TooltipCaja
                      titulo={(_, payload) => `${payload[0].payload.etiqueta} años`}
                      filas={(payload) => [{ etiqueta: 'Personas', valor: numero(payload[0].value), color: RAMPA[5] }]}
                    />
                  }
                />
                <Bar dataKey="personas" fill={RAMPA[5]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel
        titulo="Asistencia"
        lectura={
          asistenciaMarcada
            ? `De lo que se marcó, vino el ${porciento(p.asistencia.tasa)}. Falta marcar ${numero(p.asistencia.sinMarcar)} inscripciones.`
            : 'Todavía no se marcó asistencia en este período: mientras tanto, estar aceptado cuenta como haber venido.'
        }
        ayuda="Compara inscriptos aceptados contra los que de verdad vinieron. La barra es el total de inscripciones aceptadas a encuentros que ya pasaron: verde vinieron, ámbar faltaron, gris todavía sin marcar. Se marca desde las inscripciones de cada actividad."
      >
        <div className="flex h-4 overflow-hidden rounded-pill bg-surface-sunken" role="img" aria-label="Asistencia marcada">
          {[
            { n: p.asistencia.vinieron, color: SERIE.verde },
            { n: p.asistencia.faltaron, color: SERIE.ambar },
          ].map((t, i) => (
            <span
              key={i}
              className="h-full border-r-2 border-surface transition-[width] duration-slow last:border-r-0"
              style={{ width: `${p.asistencia.inscriptos ? (t.n / p.asistencia.inscriptos) * 100 : 0}%`, background: t.color }}
            />
          ))}
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
          {[
            { etiqueta: 'Vinieron', valor: p.asistencia.vinieron, color: SERIE.verde },
            { etiqueta: 'Faltaron', valor: p.asistencia.faltaron, color: SERIE.ambar },
            { etiqueta: 'Sin marcar', valor: p.asistencia.sinMarcar, color: null },
          ].map((d) => (
            <div key={d.etiqueta}>
              <dt className="flex items-center gap-2 text-ink-muted">
                {d.color ? (
                  <span aria-hidden className="h-2.5 w-2.5 rounded-[3px]" style={{ background: d.color }} />
                ) : (
                  <span aria-hidden className="h-2.5 w-2.5 rounded-[3px] bg-surface-sunken ring-1 ring-surface-border" />
                )}
                {d.etiqueta}
              </dt>
              <dd className="mt-0.5 text-xl font-semibold tabular-nums text-ink">{numero(d.valor)}</dd>
            </div>
          ))}
        </dl>
      </Panel>
    </div>
  );
};

export default VistaPersonas;
