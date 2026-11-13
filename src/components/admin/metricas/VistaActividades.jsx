import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge, Button, Field, Select, Skeleton, Table, cn } from '../../ui';
import useCargaSuave from '../../../hooks/useCargaSuave';
import { EJE, RAMPA, SERIE } from './colores';
import { BarrasHorizontales, Kpi, Leyenda, Panel, Segmentado, TooltipCaja, cursorBarras, ejeX, ejeY, numero, pesos, porciento } from './piezas';

const titulo = (t) => (t ?? '').replace(/^\[[A-Z]\]\s*/, '');
const TIPOS = [
  { valor: 'todas', etiqueta: 'Todas' },
  { valor: 'recurrente', etiqueta: 'Recurrentes' },
  { valor: 'unica', etiqueta: 'Especiales' },
  { valor: 'viaje', etiqueta: 'Viajes' },
];
const TIPO = { recurrente: 'Recurrente', unica: 'Especial', viaje: 'Viaje' };

/* Por qué número se ordena y se compara. Cada uno dice qué es. */
const METRICAS = [
  { value: 'personas', label: 'Personas distintas', de: (a) => a.personas, formato: numero, ayuda: 'cuántas personas distintas vinieron al menos una vez' },
  { value: 'porEncuentro', label: 'Personas por encuentro', de: (a) => a.porEncuentro ?? 0, formato: numero, ayuda: 'cuánta gente viene en promedio a cada encuentro' },
  { value: 'puertaDeEntrada', label: 'Puerta de entrada', de: (a) => a.puertaDeEntrada, formato: numero, ayuda: 'a cuántas personas les tocó esta actividad como su primera vez en Malka' },
  { value: 'repitenPorcentaje', label: 'Repiten', de: (a) => a.repitenPorcentaje ?? 0, formato: porciento, ayuda: 'qué parte de su gente vino dos veces o más' },
  { value: 'asistencia', label: 'Asistencia', de: (a) => a.asistencia.tasa ?? 0, formato: porciento, ayuda: 'de lo marcado, qué parte de los inscriptos vino' },
  { value: 'cobertura', label: 'Cobertura de gastos', de: (a) => a.cobertura ?? 0, formato: porciento, ayuda: 'qué parte de lo que costó se cubrió con lo que se cobró' },
  { value: 'recaudado', label: 'Recaudado', de: (a) => a.recaudado, formato: pesos, ayuda: 'cuánto se cobró en total' },
];

/* ---------- El ranking ---------- */

const PRIMERAS = 15;

const Ranking = ({ desde, hasta, abrirFicha }) => {
  const [params, setParams] = useSearchParams();
  const [todas, setTodas] = useState(false);
  const tipo = TIPOS.some((t) => t.valor === params.get('tipoAct')) ? params.get('tipoAct') : 'todas';
  const metrica = METRICAS.find((m) => m.value === params.get('por')) ?? METRICAS[0];
  const poner = (k, v, base) =>
    setParams(
      (actual) => {
        const n = new URLSearchParams(actual);
        if (v === base) n.delete(k);
        else n.set(k, v);
        return n;
      },
      { replace: true }
    );

  const { datos, cargando, actualizando, error } = useCargaSuave(
    (signal) => axios.get('/admin/metrics/activities', { params: { from: desde, to: hasta }, signal }).then((r) => r.data.actividades),
    `${desde}|${hasta}`
  );
  if (error) return <p className="text-sm text-danger-600">No se pudieron calcular las métricas de actividades.</p>;
  if (cargando || !datos) return <Skeleton className="h-96 rounded-card" />;

  const lista = datos.filter((a) => tipo === 'todas' || a.tipo === tipo);
  const orden = [...lista].sort((a, b) => metrica.de(b) - metrica.de(a));
  const masGente = [...lista].sort((a, b) => (b.porEncuentro ?? 0) - (a.porEncuentro ?? 0))[0];
  const masPuerta = [...lista].sort((a, b) => b.puertaDeEntrada - a.puertaDeEntrada)[0];
  const lectura =
    masGente && masPuerta
      ? `La que más gente junta es ${titulo(masGente.titulo)} (${numero(masGente.porEncuentro)} por encuentro). La que más trae gente nueva a Malka es ${titulo(masPuerta.titulo)}: fue la primera vez de ${numero(masPuerta.puertaDeEntrada)} personas.`
      : null;

  return (
    <div className={cn('space-y-6 transition-opacity duration-base', actualizando && 'pointer-events-none opacity-50')}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Segmentado opciones={TIPOS} valor={tipo} onChange={(v) => poner('tipoAct', v, 'todas')} etiqueta="Tipo de actividad" />
        <Field label="Comparar por" htmlFor="actividades-metrica" className="mb-0 sm:w-64">
          <Select id="actividades-metrica" options={METRICAS} value={metrica.value} onChange={(v) => v && poner('por', v, 'personas')} />
        </Field>
      </div>

      <Panel
        titulo={metrica.label}
        lectura={lectura}
        ayuda={`Cada barra es una actividad y muestra ${metrica.ayuda}, en el período elegido. Cambiá «Comparar por» para mirar otro número, y tocá una actividad para ver su ficha.`}
      >
        <BarrasHorizontales
          key={metrica.value + tipo}
          filas={(todas ? orden : orden.slice(0, PRIMERAS)).map((a) => ({
            etiqueta: titulo(a.titulo),
            valor: metrica.de(a),
            detalle: `${TIPO[a.tipo] ?? a.tipo} · ${numero(a.encuentros)} encuentros · ${numero(a.personas)} personas`,
            id: a.id,
          }))}
          formato={metrica.formato}
          color={RAMPA[6]}
          onFila={(f) => abrirFicha(f.id)}
          accionFila="Ver la actividad"
          vacio="No hubo actividades de este tipo en el período."
        />
        {orden.length > PRIMERAS && (
          <div className="mt-4 flex justify-center">
            <Button variant="secondary" size="sm" onClick={() => setTodas((t) => !t)}>
              {todas ? `Ver sólo las ${PRIMERAS} primeras` : `Ver las ${orden.length}`}
            </Button>
          </div>
        )}
      </Panel>

      <Panel titulo="Todas, lado a lado" ayuda="La misma información en una tabla, para comparar varios números a la vez. Tocá una actividad para ver su ficha.">
        <Table
          stacked
          rows={orden}
          rowKey={(a) => a.id}
          onRowClick={(a) => abrirFicha(a.id)}
          empty={<p className="text-sm text-ink-muted">No hubo actividades de este tipo en el período.</p>}
          columns={[
            {
              key: 'titulo',
              header: 'Actividad',
              render: (a) => (
                <span className="min-w-0">
                  <span className="block font-medium text-ink">{titulo(a.titulo)}</span>
                  <span className="text-xs text-ink-muted">
                    {TIPO[a.tipo] ?? a.tipo}
                    {a.esEvento ? ' · de la planilla' : a.gratuita ? ' · gratuita' : ''}
                  </span>
                </span>
              ),
            },
            { key: 'encuentros', header: 'Encuentros', align: 'right', render: (a) => numero(a.encuentros) },
            { key: 'personas', header: 'Personas', align: 'right', render: (a) => numero(a.personas) },
            { key: 'porEncuentro', header: 'Por encuentro', align: 'right', render: (a) => (a.ocupacion !== null ? `${numero(a.porEncuentro)} (${porciento(a.ocupacion)} del cupo)` : numero(a.porEncuentro)) },
            { key: 'puerta', header: 'Primera vez', align: 'right', render: (a) => numero(a.puertaDeEntrada) },
            { key: 'repiten', header: 'Repiten', align: 'right', render: (a) => porciento(a.repitenPorcentaje) },
            { key: 'cobertura', header: 'Cobertura', align: 'right', render: (a) => (a.costo ? porciento(a.cobertura) : '—') },
          ]}
        />
      </Panel>
    </div>
  );
};

/* ---------- La ficha de una actividad ---------- */

const fechaCorta = (dia) => new Date(`${dia}T00:00:00.000Z`).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', timeZone: 'UTC' });

const Ficha = ({ id, desde, hasta, volver, abrirFicha, abrirDetalle }) => {
  const { datos: d, cargando, actualizando, error } = useCargaSuave(
    (signal) => axios.get(`/admin/metrics/activities/${encodeURIComponent(id)}`, { params: { from: desde, to: hasta }, signal }).then((r) => r.data),
    `${id}|${desde}|${hasta}`
  );
  if (error) return <p className="text-sm text-danger-600">No se pudo calcular la ficha de esta actividad.</p>;
  if (cargando || !d) return <Skeleton className="h-96 rounded-card" />;

  const r = d.resumen;
  const pasados = d.encuentros.filter((e) => e.pasado);
  const serie = pasados.map((e) => ({
    ...e,
    etiqueta: fechaCorta(e.fecha),
    yaVenian: Math.max(0, e.aceptadas - e.faltaron - e.nuevas),
    primeraVez: e.nuevas,
  }));
  const mejor = serie.length ? serie.reduce((a, b) => (b.aceptadas - b.faltaron > a.aceptadas - a.faltaron ? b : a)) : null;
  const ultimos = serie.slice(-4);
  const lectura = mejor
    ? `El encuentro con más gente fue el ${fechaCorta(mejor.fecha)} (${numero(mejor.aceptadas - mejor.faltaron)} personas). ${
        ultimos.length === 4
          ? `En los últimos 4 vinieron ${numero(Math.round(ultimos.reduce((t, e) => t + e.aceptadas - e.faltaron, 0) / 4))} por encuentro.`
          : ''
      } ${r.puertaDeEntrada ? `Fue la primera vez en Malka de ${numero(r.puertaDeEntrada)} personas.` : ''}`
    : null;
  const conPlata = d.encuentros.some((e) => e.costo || e.recaudado);

  return (
    <div className={cn('space-y-6 transition-opacity duration-base', actualizando && 'pointer-events-none opacity-50')}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button variant="link" size="sm" icon="back" onClick={volver} className="mb-2 px-0">
            Todas las actividades
          </Button>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">{titulo(d.actividad.titulo)}</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone="neutral">{TIPO[d.actividad.tipo] ?? d.actividad.tipo}</Badge>
            {d.actividad.esEvento && <Badge tone="neutral">Evento de la planilla</Badge>}
            <Badge tone="neutral">{d.actividad.gratuita ? 'Gratuita' : pesos(d.actividad.precio)}</Badge>
            {d.actividad.cupo && <Badge tone="neutral">Cupo {d.actividad.cupo}</Badge>}
            {d.actividad.categorias.map((c) => (
              <Badge key={c} tone="primary" icon="tag">
                {c}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => abrirDetalle({ actividad: [d.actividad.id] })}>
            Ver quiénes vinieron
          </Button>
          {/* Los eventos de la planilla no son actividades de la app: no
              tienen inscripciones, se ven en el historial. */}
          {d.actividad.esEvento ? (
            <Button variant="secondary" size="sm" to={`/admin/historial?q=${encodeURIComponent(d.actividad.titulo)}`}>
              Historial
            </Button>
          ) : (
            <Button variant="secondary" size="sm" to={`/admin/activities/${d.actividad.id}/inscriptions`}>
              Inscripciones
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 items-start gap-3 sm:gap-4 lg:grid-cols-4">
        <Kpi titulo="Encuentros" valor={numero(r.encuentros)} detalle={`${numero(r.participaciones)} participaciones`} ayuda="Encuentros que ya pasaron en el período y tuvieron al menos una inscripción aceptada." />
        <Kpi
          titulo="Por encuentro"
          valor={numero(r.porEncuentro)}
          detalle={r.ocupacion !== null ? `${porciento(r.ocupacion)} del cupo` : `${numero(r.personas)} personas distintas`}
          ayuda="Cuánta gente vino en promedio a cada encuentro (sin contar a quien se marcó que faltó). Si la actividad tiene cupo, qué parte del cupo se llenó."
        />
        <Kpi
          titulo="Repiten"
          valor={porciento(r.repitenPorcentaje)}
          detalle={`${numero(r.repiten)} de ${numero(r.personas)} vinieron 2 veces o más`}
          ayuda="De la gente que vino a esta actividad, qué parte volvió a venir. Muy alto: un grupo fijo; bajo: la gente prueba y no vuelve."
        />
        <Kpi
          titulo="Puerta de entrada"
          valor={numero(r.puertaDeEntrada)}
          detalle="Su primera vez en Malka fue acá"
          ayuda="Personas cuya primera participación en toda Malka fue un encuentro de esta actividad. Dice qué actividades traen gente nueva a la casa."
        />
        <Kpi
          titulo="Asistencia"
          valor={porciento(r.asistencia.tasa)}
          detalle={r.asistencia.vino + r.asistencia.falto ? `Vinieron ${r.asistencia.vino}, faltaron ${r.asistencia.falto}` : 'Todavía sin marcar'}
          ayuda="De las inscripciones a las que se les tomó asistencia, qué parte vino."
        />
        <Kpi titulo="Lista de espera" valor={numero(r.enEspera)} detalle={`${numero(r.canceladas)} cancelaciones`} ayuda="Inscripciones que quedaron en lista de espera y las que se cancelaron en el período. Mucha espera puede pedir más cupo o más fechas." />
        <Kpi titulo="Recaudado" valor={pesos(r.recaudado)} detalle={r.costo ? `Costó ${pesos(r.costo)}` : 'Sin gastos cargados'} ayuda="Lo cobrado (pagos aprobados) en los encuentros del período, y lo gastado si hay gastos atados a esta actividad." />
        <Kpi titulo="Cobertura" valor={r.costo ? porciento(r.cobertura) : '—'} detalle={r.costo ? 'De lo que costó, lo que se cubrió' : 'Cargá gastos para verla'} ayuda="Lo recaudado dividido lo gastado en esta actividad. 100 % es que se pagó sola." destacado={Boolean(r.costo)} />
      </div>

      <Panel
        titulo="Encuentro por encuentro"
        lectura={lectura}
        ayuda="Cada columna es un encuentro. La parte verde son quienes ya habían venido a Malka antes; la ámbar, quienes vinieron por primera vez a la casa en ese encuentro. Si la actividad tiene cupo, la línea punteada lo marca. Pasá el mouse para ver faltas, lista de espera, cancelaciones y plata."
      >
        <Leyenda
          items={[
            { etiqueta: 'Ya venían a Malka', color: SERIE.verde },
            { etiqueta: 'Primera vez en Malka', color: SERIE.ambar },
          ]}
        />
        {serie.length ? (
          <div className="h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: -8 }} barCategoryGap="18%">
                <CartesianGrid vertical={false} stroke={EJE.grilla} />
                <XAxis dataKey="etiqueta" {...ejeX} interval="preserveStartEnd" minTickGap={16} />
                <YAxis {...ejeY} allowDecimals={false} />
                {d.actividad.cupo && <ReferenceLine y={d.actividad.cupo} stroke={EJE.texto} strokeDasharray="4 4" label={{ value: 'Cupo', position: 'insideTopRight', fontSize: 11, fill: EJE.texto }} />}
                <Tooltip
                  cursor={cursorBarras}
                  content={
                    <TooltipCaja
                      titulo={(_, payload) => new Date(`${payload[0].payload.fecha}T00:00:00.000Z`).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}
                      filas={(payload) => {
                        const e = payload[0].payload;
                        return [
                          { etiqueta: 'Ya venían', valor: numero(e.yaVenian), color: SERIE.verde },
                          { etiqueta: 'Primera vez', valor: numero(e.primeraVez), color: SERIE.ambar },
                          ...(e.faltaron ? [{ etiqueta: 'Faltaron', valor: numero(e.faltaron) }] : []),
                          ...(e.enEspera ? [{ etiqueta: 'En espera', valor: numero(e.enEspera) }] : []),
                          ...(e.canceladas ? [{ etiqueta: 'Cancelaron', valor: numero(e.canceladas) }] : []),
                          ...(e.recaudado ? [{ etiqueta: 'Recaudado', valor: pesos(e.recaudado) }] : []),
                          ...(e.costo ? [{ etiqueta: 'Costó', valor: pesos(e.costo) }] : []),
                        ];
                      }}
                    />
                  }
                />
                <Bar dataKey="yaVenian" stackId="e" fill={SERIE.verde} stroke="#fff" strokeWidth={1} />
                <Bar dataKey="primeraVez" stackId="e" fill={SERIE.ambar} stroke="#fff" strokeWidth={1} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-ink-muted">Todavía no hubo encuentros en este período.</p>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel titulo="Los que más vienen" ayuda="Las personas que más veces vinieron a esta actividad en el período. Tocá un nombre para ver su ficha.">
          {d.habituales.length ? (
            <ol className="space-y-2 text-sm">
              {d.habituales.map((h, i) => (
                <li key={h.id} className="flex items-baseline justify-between gap-3">
                  <Link to={`/admin/users/${h.id}`} className="min-w-0 truncate text-ink-soft hover:text-primary-700 hover:underline">
                    <span className="mr-2 tabular-nums text-ink-faint">{i + 1}.</span>
                    {h.nombre}
                  </Link>
                  <span className="shrink-0 font-semibold tabular-nums text-ink">{numero(h.veces)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-ink-muted">Nadie vino en el período.</p>
          )}
        </Panel>
        <Panel
          titulo="Su gente también va a"
          lectura={d.tambienHacen[0] ? `El ${porciento(d.tambienHacen[0].porcentaje)} de quienes vienen acá también va a ${titulo(d.tambienHacen[0].titulo)}.` : null}
          ayuda="De las personas que vinieron a esta actividad, qué parte también fue a cada una de las otras en el mismo período. Tocá una para ver su ficha."
        >
          <BarrasHorizontales
            filas={d.tambienHacen.map((t) => ({ etiqueta: titulo(t.titulo), valor: t.porcentaje ?? 0, id: t.actividadId, detalle: `${numero(t.personas)} personas` }))}
            formato={porciento}
            color={RAMPA[5]}
            onFila={(f) => abrirFicha(f.id)}
            accionFila="Ver la actividad"
            vacio="Su gente no fue a otras actividades en el período."
          />
        </Panel>
        <Panel titulo="Edad" ayuda="Edad de las personas que vinieron, calculada a hoy con la fecha de nacimiento que cargaron.">
          <p className="text-3xl font-bold tabular-nums tracking-tight text-ink">
            {d.edad.promedio === null ? '—' : numero(d.edad.promedio)}
            <span className="ml-1.5 text-base font-medium text-ink-muted">años de promedio</span>
          </p>
          <div className="mt-3">
            <BarrasHorizontales filas={d.edad.tramos.filter((t) => t.personas).map((t) => ({ etiqueta: t.etiqueta, valor: t.personas }))} color={RAMPA[5]} vacio="Sin fechas de nacimiento." />
          </div>
        </Panel>
      </div>

      {conPlata && (
        <Panel titulo="La plata de cada encuentro" ayuda="Para cada encuentro, lo que se recaudó (verde) y lo que costó (ámbar), según los pagos aprobados y los gastos atados a esta actividad.">
          <Leyenda
            items={[
              { etiqueta: 'Recaudado', color: SERIE.verde },
              { etiqueta: 'Costó', color: SERIE.ambar },
            ]}
          />
          <div className="h-60 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serie} margin={{ top: 4, right: 4, bottom: 0, left: 8 }} barGap={2}>
                <CartesianGrid vertical={false} stroke={EJE.grilla} />
                <XAxis dataKey="etiqueta" {...ejeX} interval="preserveStartEnd" minTickGap={16} />
                <YAxis {...ejeY} width={72} tickFormatter={(n) => pesos(n)} />
                <Tooltip cursor={cursorBarras} content={<TooltipCaja formato={pesos} />} />
                <Bar dataKey="recaudado" name="Recaudado" fill={SERIE.verde} radius={[3, 3, 0, 0]} />
                <Bar dataKey="costo" name="Costó" fill={SERIE.ambar} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      )}
    </div>
  );
};

/**
 * Métricas por actividad: el ranking de todas (recurrentes, especiales y
 * viajes) y la ficha de cada una. La actividad elegida va en la dirección,
 * así el link a una ficha se puede mandar.
 */
const VistaActividades = ({ desde, hasta, abrirDetalle }) => {
  const [params, setParams] = useSearchParams();
  const id = params.get('actividad');
  const ir = (nuevo) => {
    setParams(
      (actual) => {
        const n = new URLSearchParams(actual);
        if (nuevo) n.set('actividad', nuevo);
        else n.delete('actividad');
        return n;
      },
      { replace: false }
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return (
    <div key={id ?? 'ranking'} className="animate-fade-in">
      {id ? (
        <Ficha id={id} desde={desde} hasta={hasta} volver={() => ir(null)} abrirFicha={ir} abrirDetalle={abrirDetalle} />
      ) : (
        <Ranking desde={desde} hasta={hasta} abrirFicha={ir} />
      )}
    </div>
  );
};

export default VistaActividades;
