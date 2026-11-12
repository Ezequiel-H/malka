import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Table } from '../../ui';
import { EJE, RAMPA, SERIE } from './colores';
import {
  BarrasHorizontales,
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

/**
 * Cuánto entra, cuánto sale y cuánto de cada encuentro se cubre con lo que
 * se cobra. Sólo pesos: lo que se cobra en dólares se informa aparte.
 */
const VistaPlata = ({ plata, participantes }) => {
  const pl = plata;
  const porMes = pl.porMes.map((m) => ({ ...m, etiqueta: mesCorto(m.mes) }));
  const sinGastos = pl.gastado === 0;

  return (
    <div className="space-y-6">
      {/* Montos en pesos: en un teléfono van de a uno por fila, si no no entran. */}
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <Kpi
          titulo="Cobertura de gastos"
          valor={sinGastos ? '—' : porciento(pl.cobertura)}
          detalle={sinGastos ? 'Cargá los gastos para ver cuánto se cubre' : 'De lo gastado, lo que se cubrió con ingresos propios'}
          destacado
        />
        <Kpi
          titulo="Recaudado"
          valor={pesos(pl.recaudado)}
          detalle={
            pl.recaudadoUsd ? `Más US$ ${numero(pl.recaudadoUsd)} en dólares` : `${numero(pl.pagos)} pagos aprobados`
          }
        />
        <Kpi titulo="Gastado" valor={pesos(pl.gastado)} detalle="Gastos cargados en el período" />
        <Kpi
          titulo="Personas que pagan"
          valor={numero(pl.pagantes)}
          detalle={
            pl.pagantes
              ? `${porciento(pl.pagantesPorcentaje)} de las ${numero(participantes)} que vinieron. Promedio ${pesos(pl.promedioPorPagante)}`
              : 'Nadie pagó en el período'
          }
        />
      </div>

      <Panel titulo="Entra y sale, mes a mes" descripcion="Lo recaudado por inscripciones pagas contra los gastos cargados.">
        <Leyenda
          items={[
            { etiqueta: 'Recaudado', color: SERIE.verde },
            { etiqueta: 'Gastado', color: SERIE.ambar },
          ]}
        />
        <div className="h-72 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porMes} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barGap={2} barCategoryGap="24%">
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
              <Bar dataKey="recaudado" name="Recaudado" fill={SERIE.verde} radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastado" name="Gastado" fill={SERIE.ambar} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel
        titulo="Cuánto cuesta cada encuentro"
        descripcion="Promedio por encuentro de las actividades con gastos cargados: lo que costó, lo que se recaudó ese día y cuánto se cubrió."
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
        <Panel titulo="Recaudado por actividad">
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
        <Panel titulo="Gastos por tipo">
          <BarrasHorizontales
            filas={pl.gastosPorCategoria.map((g) => ({ etiqueta: CATEGORIA_GASTO[g.categoria] ?? g.categoria, valor: g.total }))}
            formato={pesos}
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
