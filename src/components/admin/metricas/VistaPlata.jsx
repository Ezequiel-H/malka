import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Field, Select, Table } from '../../ui';
import { EJE, RAMPA, SERIE } from './colores';
import {
  BarrasHorizontales,
  Cambio,
  Kpi,
  Leyenda,
  Panel,
  TooltipCaja,
  cursorBarras,
  ejeX,
  ejeY,
  mesCorto,
  mesLargo,
  numero,
  pesos,
  pesosCorto,
  porciento,
} from './piezas';

const CATEGORIA_GASTO = {
  comida: 'Comida',
  bebida: 'Bebida',
  materiales: 'Materiales',
  casa: 'La casa',
  otros: 'Otros',
};

/* Sin prefijo de prueba en los títulos ("[M] Cena" → "Cena"). */
const titulo = (t) => t.replace(/^\[[A-Z]\]\s*/, '');

/* ---------- Evento por evento (las hojas de gastos de la planilla) ---------- */

const mayuscula = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
const promedio = (lista) => (lista.length ? lista.reduce((a, b) => a + b, 0) / lista.length : null);

/**
 * Cada evento con su plata y su gente, filtrable por mes y categoría, con
 * los cuatro números que la planilla mostraba arriba y la evolución por
 * mes. «Puso la casa» es lo que costó menos lo que se recaudó: lo que no se
 * cubrió con ingresos.
 */
const PorEvento = ({ eventos, onEvento }) => {
  const [mes, setMes] = useState('');
  const [categoria, setCategoria] = useState('');
  const meses = [...new Set(eventos.map((e) => e.mes))].sort().reverse();
  const categorias = [...new Set(eventos.map((e) => e.categoria).filter(Boolean))].sort();
  const lista = eventos.filter((e) => (!mes || e.mes === mes) && (!categoria || e.categoria === categoria));
  const costo = lista.reduce((t, e) => t + e.costo, 0);
  const puso = lista.reduce((t, e) => t + (e.costo - e.recaudado), 0);
  const conGente = lista.filter((e) => e.personas > 0);
  const porPersona = promedio(conGente.map((e) => (e.costo - e.recaudado) / e.personas));
  const evolucion = [...new Set(lista.map((e) => e.mes))].sort().map((m) => {
    const delMes = lista.filter((e) => e.mes === m);
    const gasto = delMes.reduce((t, e) => t + e.costo, 0);
    const neto = delMes.reduce((t, e) => t + (e.costo - e.recaudado), 0);
    return { mes: m, etiqueta: mesCorto(m), gasto, neto, promedio: Math.round(neto / delMes.length) };
  });
  const caro = lista.length ? lista.reduce((a, b) => (b.costo - b.recaudado > a.costo - a.recaudado ? b : a)) : null;

  if (!eventos.length) return null;
  return (
    <Panel
      titulo="Evento por evento"
      lectura={
        caro
          ? `En lo filtrado, la casa puso ${pesos(puso)} en ${numero(lista.length)} eventos: ${pesos(Math.round(puso / lista.length))} por evento${porPersona ? ` y ${pesos(Math.round(porPersona))} por persona` : ''}. El que más le costó fue ${titulo(caro.titulo)} del ${new Date(`${caro.fecha}T00:00:00Z`).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', timeZone: 'UTC' })}.`
          : null
      }
      ayuda="Cada evento con gastos o recaudación cargados: lo que costó, lo que se recaudó, lo que puso la casa (lo que no cubrió la recaudación), cuánta gente vino, la edad promedio y cuánto le costó a la casa cada persona. Filtrá por mes y categoría como en la planilla; tocá un evento para ver su ficha."
      accion={
        <div className="flex flex-wrap gap-2">
          <Field label="Mes" htmlFor="evento-mes" className="mb-0 w-44">
            <Select id="evento-mes" options={meses.map((m) => ({ value: m, label: mayuscula(mesLargo(m)) }))} value={mes} onChange={(v) => setMes(v ?? '')} placeholder="Todos" clearable size="sm" />
          </Field>
          <Field label="Categoría" htmlFor="evento-categoria" className="mb-0 w-44">
            <Select id="evento-categoria" options={categorias.map((c) => ({ value: c, label: mayuscula(c) }))} value={categoria} onChange={(v) => setCategoria(v ?? '')} placeholder="Todas" clearable size="sm" />
          </Field>
        </div>
      }
    >
      <div className="mb-5 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
        {[
          ['Puso la casa', pesos(puso), 'Lo que costó menos lo recaudado'],
          ['Gastos sin recaudación', pesos(costo), 'Todo lo que se gastó'],
          ['Por evento', lista.length ? pesos(Math.round(puso / lista.length)) : '—', `Promedio de ${numero(lista.length)} eventos`],
          ['Por persona', porPersona ? pesos(Math.round(porPersona)) : '—', 'Lo que puso la casa por cada una'],
        ].map(([t, v, d]) => (
          <div key={t} className="rounded-control border border-surface-border bg-surface-sunken px-4 py-3">
            <p className="text-xs text-ink-muted">{t}</p>
            <p className="text-xl font-semibold tabular-nums text-ink">{v}</p>
            <p className="text-xs text-ink-muted">{d}</p>
          </div>
        ))}
      </div>

      {evolucion.length > 1 && (
        <>
          <Leyenda
            items={[
              { etiqueta: 'Gastó', color: SERIE.ambar },
              { etiqueta: 'Puso la casa', color: SERIE.verde },
              { etiqueta: 'Promedio por evento', color: RAMPA[4] },
            ]}
          />
          <div className="mb-5 h-60 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucion} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke={EJE.grilla} />
                <XAxis dataKey="etiqueta" {...ejeX} interval="preserveStartEnd" minTickGap={12} />
                <YAxis {...ejeY} width={80} tickFormatter={pesosCorto} />
                <Tooltip
                  cursor={{ stroke: EJE.texto, strokeDasharray: '3 3' }}
                  content={
                    <TooltipCaja
                      titulo={(_, payload) => mesLargo(payload[0].payload.mes)}
                      filas={(payload) => {
                        const d = payload[0].payload;
                        return [
                          { etiqueta: 'Gastó', valor: pesos(d.gasto), color: SERIE.ambar },
                          { etiqueta: 'Puso la casa', valor: pesos(d.neto), color: SERIE.verde },
                          { etiqueta: 'Por evento', valor: pesos(d.promedio), color: RAMPA[4] },
                        ];
                      }}
                    />
                  }
                />
                <Line type="monotone" dataKey="gasto" stroke={SERIE.ambar} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="neto" stroke={SERIE.verde} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="promedio" stroke={RAMPA[4]} strokeWidth={2} strokeDasharray="4 4" dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <Table
        stacked
        rows={lista.slice(0, 60)}
        rowKey={(e) => `${e.actividadId}|${e.fecha}`}
        onRowClick={(e) => onEvento(e.actividadId)}
        empty={<p className="text-sm text-ink-muted">No hay eventos con estos filtros.</p>}
        columns={[
          {
            key: 'evento',
            header: 'Evento',
            render: (e) => (
              <span className="min-w-0">
                <span className="block font-medium text-ink">{titulo(e.titulo)}</span>
                <span className="text-xs text-ink-muted">
                  {new Date(`${e.fecha}T00:00:00Z`).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}
                  {e.categoria ? ` · ${mayuscula(e.categoria)}` : ''}
                </span>
              </span>
            ),
          },
          { key: 'costo', header: 'Gastó', align: 'right', render: (e) => pesos(e.costo) },
          { key: 'recaudado', header: 'Recaudó', align: 'right', render: (e) => pesos(e.recaudado) },
          { key: 'puso', header: 'Puso la casa', align: 'right', render: (e) => <span className="font-semibold tabular-nums text-ink">{pesos(e.costo - e.recaudado)}</span> },
          { key: 'personas', header: 'Personas', align: 'right', render: (e) => numero(e.personas) },
          { key: 'edad', header: 'Edad', align: 'right', render: (e) => (e.edadPromedio === null ? '—' : numero(e.edadPromedio)) },
          { key: 'porPersona', header: 'Por persona', align: 'right', render: (e) => (e.personas ? pesos(Math.round((e.costo - e.recaudado) / e.personas)) : '—') },
        ]}
      />
      {lista.length > 60 && <p className="mt-3 text-center text-xs text-ink-muted">Se muestran los 60 más recientes de {numero(lista.length)}. Filtrá por mes para ver el resto.</p>}
    </Panel>
  );
};

/* ---------- Lecturas ---------- */

const lecturaMeses = (porMes) => {
  const conGastos = porMes.filter((m) => m.gastado > 0);
  if (!conGastos.length) return null;
  const cubiertos = conGastos.filter((m) => m.recaudado >= m.gastado).length;
  const peor = conGastos.reduce((a, b) => (b.recaudado / b.gastado < a.recaudado / a.gastado ? b : a));
  return `${numero(cubiertos)} de ${numero(conGastos.length)} meses se cubrieron solos. El más difícil fue ${mesLargo(peor.mes)}: se cubrió el ${Math.round((peor.recaudado / peor.gastado) * 100)} %.`;
};

const lecturaEncuentros = (filas) => {
  if (!filas.length) return null;
  const caro = filas[0];
  const porPersona = caro.personasPromedio ? Math.round(caro.costoPromedio / caro.personasPromedio) : null;
  return `El encuentro más caro es ${titulo(caro.titulo)}: ${pesos(caro.costoPromedio)} cada uno${porPersona ? `, unos ${pesos(porPersona)} por persona` : ''}, y se cubre el ${porciento(caro.cobertura)}.`;
};

/**
 * Cuánto entra, cuánto sale y cuánto de cada encuentro se cubre con lo que
 * se cobra. Sólo pesos: lo que se cobra en dólares se informa aparte.
 */
const VistaPlata = ({ plata, anterior, participantes, onMes, onTipo, onEvento }) => {
  const pl = plata;
  const porMes = pl.porMes.map((m) => ({ ...m, etiqueta: mesCorto(m.mes) }));
  const sinGastos = pl.gastado === 0;
  const [ocultas, setOcultas] = useState([]);
  const alternar = (serie) => setOcultas((o) => (o.includes(serie) ? o.filter((x) => x !== serie) : [...o, serie]));

  return (
    <div className="space-y-6">
      {/* Montos en pesos: en un teléfono van de a uno por fila, si no no entran. */}
      <div className="grid grid-cols-1 items-start gap-3 min-[480px]:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <Kpi
          titulo="Cobertura de gastos"
          valor={sinGastos ? '—' : porciento(pl.cobertura)}
          detalle={sinGastos ? 'Cargá los gastos para ver cuánto se cubre' : 'De lo gastado, lo que se cubrió con ingresos propios'}
          destacado
          cambio={<Cambio actual={pl.cobertura} anterior={anterior?.cobertura} enPuntos />}
          ayuda="Lo recaudado dividido lo gastado en el período. 100 % quiere decir que lo que se cobró pagó todo lo que se gastó; menos, que el resto lo puso la comunidad. Sólo pesos."
        />
        <Kpi
          titulo="Recaudado"
          valor={pesos(pl.recaudado)}
          detalle={
            pl.recaudadoUsd ? `Más US$ ${numero(pl.recaudadoUsd)} en dólares` : `${numero(pl.pagos)} pagos aprobados`
          }
          cambio={<Cambio actual={pl.recaudado} anterior={anterior?.recaudado} />}
          ayuda="La suma de los pagos aprobados de inscripciones a encuentros del período. Lo que se cobra por fuera de la app no aparece."
        />
        <Kpi
          titulo="Gastado"
          valor={pesos(pl.gastado)}
          detalle="Gastos cargados en el período"
          cambio={<Cambio actual={pl.gastado} anterior={anterior?.gastado} mejorSiSube={false} />}
          ayuda="La suma de los gastos cargados en la pestaña Gastos con fecha dentro del período."
        />
        <Kpi
          titulo="Personas que pagan"
          valor={numero(pl.pagantes)}
          detalle={
            pl.pagantes
              ? `${porciento(pl.pagantesPorcentaje)} de las ${numero(participantes)} que vinieron. Promedio ${pesos(pl.promedioPorPagante)}`
              : 'Nadie pagó en el período'
          }
          cambio={<Cambio actual={pl.pagantes} anterior={anterior?.pagantes} />}
          ayuda="Personas distintas con al menos un pago aprobado en el período, y qué parte son de todas las que vinieron. El promedio es cuánto pagó cada una en total."
        />
      </div>

      <Panel
        titulo="Entra y sale, mes a mes"
        lectura={lecturaMeses(porMes)}
        ayuda="Para cada mes, la columna verde es lo recaudado por inscripciones pagas y la ámbar lo gastado. Si la verde supera a la ámbar, ese mes se cubrió solo. Tocá la leyenda para mirar una sola serie, y una columna para ver los gastos de ese mes."
      >
        <Leyenda
          items={[
            { clave: 'recaudado', etiqueta: 'Recaudado', color: SERIE.verde },
            { clave: 'gastado', etiqueta: 'Gastado', color: SERIE.ambar },
          ].map((it) => ({ ...it, activo: !ocultas.includes(it.clave), onToggle: () => alternar(it.clave) }))}
        />
        <div className="h-72 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={porMes}
              margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
              barGap={2}
              barCategoryGap="24%"
              className="cursor-pointer"
              onClick={(e) => {
                const d = e?.activePayload?.[0]?.payload;
                if (d) onMes(d.mes);
              }}
            >
              <CartesianGrid vertical={false} stroke={EJE.grilla} />
              <XAxis dataKey="etiqueta" {...ejeX} interval="preserveStartEnd" minTickGap={12} />
              <YAxis {...ejeY} width={80} tickFormatter={pesosCorto} />
              <Tooltip
                cursor={cursorBarras}
                content={
                  <TooltipCaja
                    titulo={(_, payload) => mesLargo(payload[0].payload.mes)}
                    filas={(payload) => {
                      const d = payload[0].payload;
                      const cobertura = d.gastado ? Math.round((d.recaudado / d.gastado) * 100) : null;
                      return [
                        { etiqueta: 'Recaudado', valor: pesos(d.recaudado), color: SERIE.verde },
                        { etiqueta: 'Gastado', valor: pesos(d.gastado), color: SERIE.ambar },
                        { etiqueta: 'Cobertura', valor: cobertura === null ? '—' : `${cobertura} %` },
                      ];
                    }}
                  />
                }
              />
              {!ocultas.includes('recaudado') && <Bar dataKey="recaudado" name="Recaudado" fill={SERIE.verde} radius={[4, 4, 0, 0]} />}
              {!ocultas.includes('gastado') && <Bar dataKey="gastado" name="Gastado" fill={SERIE.ambar} radius={[4, 4, 0, 0]} />}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-ink-muted">Tocá una columna para ver los gastos de ese mes.</p>
      </Panel>

      <PorEvento eventos={pl.porEvento ?? []} onEvento={onEvento} />

      <Panel
        titulo="Cuánto cuesta cada encuentro"
        lectura={lecturaEncuentros(pl.costoPorEncuentro)}
        ayuda="Para las actividades con gastos atados a un encuentro (por ejemplo, la comida de cada Shabat): cuántos encuentros hubo, cuánta gente vino en promedio, cuánto costó cada uno, cuánto se recaudó ese día y qué parte del costo se cubrió."
      >
        <Table
          stacked
          rows={pl.costoPorEncuentro}
          rowKey={(f) => f.actividadId}
          empty={
            <p className="text-sm text-ink-muted">
              Cuando cargues gastos atados a una actividad (por ejemplo, la comida de cada Shabat), acá vas a ver el costo de
              cada encuentro.
            </p>
          }
          columns={[
            { key: 'titulo', header: 'Actividad', render: (f) => <span className="font-medium text-ink">{titulo(f.titulo)}</span> },
            { key: 'encuentros', header: 'Encuentros', align: 'right', render: (f) => numero(f.encuentros) },
            { key: 'personas', header: 'Personas', align: 'right', render: (f) => numero(f.personasPromedio) },
            { key: 'costo', header: 'Costo', align: 'right', render: (f) => pesos(f.costoPromedio) },
            { key: 'recaudado', header: 'Recaudado', align: 'right', render: (f) => pesos(f.recaudadoPromedio) },
            {
              key: 'cobertura',
              header: 'Cobertura',
              width: '11rem',
              render: (f) => (
                <span className="flex items-center gap-2">
                  <span className="h-2 flex-1 rounded-pill bg-surface-sunken">
                    <span
                      className="block h-full rounded-pill"
                      style={{ width: `${Math.min(100, f.cobertura ?? 0)}%`, background: SERIE.verde }}
                    />
                  </span>
                  <span className="w-16 whitespace-nowrap text-right tabular-nums text-ink">{porciento(f.cobertura)}</span>
                </span>
              ),
            },
          ]}
        />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          titulo="Recaudado por actividad"
          ayuda="Lo recaudado en el período por cada actividad paga, de mayor a menor, con la cantidad de pagos aprobados."
        >
          <BarrasHorizontales
            filas={pl.porActividad.map((a) => ({
              etiqueta: titulo(a.titulo),
              valor: a.recaudado,
              detalle: `${numero(a.pagos)} pagos`,
            }))}
            formato={pesos}
            color={SERIE.verde}
            vacio="No hubo pagos aprobados en el período."
          />
        </Panel>
        <Panel titulo="Gastos por tipo" ayuda="Lo gastado en el período según el tipo con que se cargó cada gasto. Tocá un tipo para ver esos gastos.">
          <BarrasHorizontales
            filas={pl.gastosPorCategoria.map((g) => ({ etiqueta: CATEGORIA_GASTO[g.categoria] ?? g.categoria, valor: g.total, categoria: g.categoria }))}
            formato={pesos}
            onFila={(f) => onTipo(f.categoria)}
            accionFila="Ver los gastos"
            color={RAMPA[6]}
            vacio="No hay gastos cargados en el período."
          />
          <p className="mt-5 border-t border-surface-border pt-4 text-sm text-ink-muted">
            {numero(pl.participacionesGratis)} participaciones fueron en actividades gratuitas y {numero(pl.participacionesPagas)} en
            aranceladas.
          </p>
        </Panel>
      </div>
    </div>
  );
};

export default VistaPlata;
