import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EJE, RAMPA, SERIE } from './colores';
import {
  BarrasHorizontales,
  Kpi,
  Leyenda,
  MapaTemporadas,
  MatrizCruce,
  Panel,
  TooltipCaja,
  cursorBarras,
  ejeX,
  ejeY,
  mesCorto,
  mesLargo,
  numero,
  porciento,
} from './piezas';

/**
 * Las métricas de personas y comunidad. Arriba, lo que pide la comisión
 * directiva en números grandes; abajo, los gráficos para entender por qué.
 */
const VistaPersonas = ({ personas }) => {
  const p = personas;
  const porMes = p.porMes.map((m) => ({
    ...m,
    etiqueta: mesCorto(m.mes),
    yaVenian: m.personas - m.nuevas,
  }));
  const asistenciaMarcada = p.asistencia.vinieron + p.asistencia.faltaron;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Kpi
          titulo="Personas que participaron"
          valor={numero(p.participantes)}
          detalle={`${numero(p.participaciones)} participaciones, ${numero(p.participacionesPorPersona)} por persona`}
        />
        <Kpi titulo="Nuevas" valor={numero(p.nuevos)} detalle="Vinieron por primera vez en el período" />
        <Kpi
          titulo="Vuelven"
          valor={porciento(p.vuelven.porcentaje)}
          detalle={
            p.vuelven.cohorte
              ? `${numero(p.vuelven.volvieron)} de ${numero(p.vuelven.cohorte)} volvieron en sus primeros 60 días`
              : 'Todavía nadie nuevo cumplió 60 días'
          }
        />
        <Kpi
          titulo="Frecuentes"
          valor={numero(p.frecuentes)}
          detalle={`Vinieron ${p.umbralFrecuente} veces o más en el período`}
        />
      </div>

      <Panel
        titulo="Mes a mes"
        descripcion="Cuántas personas distintas vinieron cada mes, y cuántas de ellas eran nuevas."
      >
        <Leyenda
          items={[
            { etiqueta: 'Ya venían', color: SERIE.verde },
            { etiqueta: 'Nuevas', color: SERIE.ambar },
          ]}
        />
        <div className="h-72 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porMes} margin={{ top: 4, right: 4, bottom: 0, left: -8 }} barCategoryGap="22%">
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
                      return [
                        { etiqueta: 'Ya venían', valor: numero(d.yaVenian), color: SERIE.verde },
                        { etiqueta: 'Nuevas', valor: numero(d.nuevas), color: SERIE.ambar },
                        { etiqueta: 'Participaciones', valor: numero(d.participaciones) },
                      ];
                    }}
                  />
                }
              />
              {/* El corte de 2 px entre las dos partes de la columna es el
                  borde del mismo color que la tarjeta. */}
              <Bar dataKey="yaVenian" name="Ya venían" stackId="p" fill={SERIE.verde} stroke="#fff" strokeWidth={1} />
              <Bar dataKey="nuevas" name="Nuevas" stackId="p" fill={SERIE.ambar} stroke="#fff" strokeWidth={1} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          titulo="Cuántas veces vienen"
          descripcion="No es lo mismo venir 2 veces que 25. Personas según cuántas veces participaron en el período."
        >
          <div className="h-60 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={p.frecuencia} margin={{ top: 18, right: 4, bottom: 0, left: -8 }}>
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
        </Panel>

        <Panel titulo="Activas hoy" descripcion="Personas que participaron al menos una vez en los últimos días, sin importar el período elegido.">
          <BarrasHorizontales
            filas={[
              { etiqueta: 'Últimos 30 días', valor: p.activos.d30 },
              { etiqueta: 'Últimos 60 días', valor: p.activos.d60 },
              { etiqueta: 'Últimos 90 días', valor: p.activos.d90 },
            ]}
            formato={(n) => `${numero(n)} personas`}
          />
          <p className="mt-5 border-t border-surface-border pt-4 text-sm text-ink-muted">
            <span className="font-semibold text-ink">{numero(p.registrados)}</span> personas registradas en total,{' '}
            <span className="font-semibold text-ink">{numero(p.registrosEnRango)}</span> en este período.
          </p>
        </Panel>
      </div>

      <Panel
        titulo="Temporadas"
        descripcion="Qué meses y qué días se llena la casa. Sirve para planificar compras, staff y actividades."
      >
        <MapaTemporadas celdas={p.temporadas} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel
          className="lg:col-span-3"
          titulo="Cruce entre propuestas"
          descripcion="De quienes hacen una propuesta (fila), qué parte hace también la otra (columna)."
        >
          <MatrizCruce categorias={p.cruce.categorias} matriz={p.cruce.matriz} />
        </Panel>

        <Panel
          className="lg:col-span-2"
          titulo="Edad"
          descripcion={`Promedio de quienes participaron. ${p.edad.sinDato ? `${numero(p.edad.sinDato)} no cargaron su fecha de nacimiento.` : ''}`}
        >
          <p className="text-4xl font-bold tabular-nums tracking-tight text-ink">
            {p.edad.promedio === null ? '—' : numero(p.edad.promedio)}
            <span className="ml-1.5 text-lg font-medium text-ink-muted">años</span>
          </p>
          <div className="mt-4 h-40 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={p.edad.tramos} margin={{ top: 4, right: 0, bottom: 0, left: -12 }}>
                <XAxis dataKey="id" {...ejeX} tick={{ fontSize: 11, fill: EJE.texto }} interval={0} />
                <YAxis {...ejeY} allowDecimals={false} />
                <Tooltip
                  cursor={cursorBarras}
                  content={<TooltipCaja titulo={(_, payload) => `${payload[0].payload.etiqueta} años`} filas={(payload) => [{ etiqueta: 'Personas', valor: numero(payload[0].value), color: RAMPA[5] }]} />}
                />
                <Bar dataKey="personas" fill={RAMPA[5]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          titulo="Asistencia"
          descripcion="Inscriptos aceptados contra los que de verdad vinieron. Se marca desde las inscripciones de cada actividad."
        >
          <div className="flex h-4 overflow-hidden rounded-pill bg-surface-sunken" role="img" aria-label="Asistencia marcada">
            {[
              { n: p.asistencia.vinieron, color: SERIE.verde },
              { n: p.asistencia.faltaron, color: SERIE.ambar },
            ].map((t, i) => (
              <span
                key={i}
                className="h-full border-r-2 border-surface last:border-r-0"
                style={{ width: `${p.asistencia.inscriptos ? (t.n / p.asistencia.inscriptos) * 100 : 0}%`, background: t.color }}
              />
            ))}
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="flex items-center gap-2 text-ink-muted">
                <span aria-hidden className="h-2.5 w-2.5 rounded-[3px]" style={{ background: SERIE.verde }} />
                Vinieron
              </dt>
              <dd className="mt-0.5 text-xl font-semibold tabular-nums text-ink">{numero(p.asistencia.vinieron)}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-ink-muted">
                <span aria-hidden className="h-2.5 w-2.5 rounded-[3px]" style={{ background: SERIE.ambar }} />
                Faltaron
              </dt>
              <dd className="mt-0.5 text-xl font-semibold tabular-nums text-ink">{numero(p.asistencia.faltaron)}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-ink-muted">
                <span aria-hidden className="h-2.5 w-2.5 rounded-[3px] bg-surface-sunken ring-1 ring-surface-border" />
                Sin marcar
              </dt>
              <dd className="mt-0.5 text-xl font-semibold tabular-nums text-ink">{numero(p.asistencia.sinMarcar)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-ink-muted">
            {asistenciaMarcada
              ? `De lo marcado, vino el ${porciento(p.asistencia.tasa)}.`
              : 'Todavía no se marcó asistencia en este período: mientras tanto, estar aceptado cuenta como haber venido.'}
          </p>
        </Panel>

        <Panel titulo="Registros nuevos" descripcion="Personas que se hicieron socias (se registraron en la app) cada mes.">
          <div className="h-52 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={porMes} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid vertical={false} stroke={EJE.grilla} />
                <XAxis dataKey="etiqueta" {...ejeX} interval="preserveStartEnd" minTickGap={12} />
                <YAxis {...ejeY} allowDecimals={false} />
                <Tooltip
                  cursor={{ stroke: EJE.texto, strokeDasharray: '3 3' }}
                  content={
                    <TooltipCaja
                      titulo={(_, payload) => mesLargo(payload[0].payload.mes)}
                      filas={(payload) => [{ etiqueta: 'Registros', valor: numero(payload[0].value), color: SERIE.verde }]}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="registros"
                  stroke={SERIE.verde}
                  strokeWidth={2}
                  dot={{ r: 3, fill: SERIE.verde, stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default VistaPersonas;
