import { useLayoutEffect, useRef, useState } from 'react';
import { Card, cn } from '../../ui';
import { EJE, RAMPA } from './colores';

/* ---------- Formatos ---------- */

const numeroAr = new Intl.NumberFormat('es-AR');
const pesosAr = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export const numero = (n) => (n === null || n === undefined ? '—' : numeroAr.format(n));
export const pesos = (n) => (n === null || n === undefined ? '—' : pesosAr.format(n));
/* Los montos grandes, cortos para los ejes: $ 1,2 M, $ 850 mil. */
export const pesosCorto = (n) => {
  if (Math.abs(n) >= 1e6) return `$ ${numeroAr.format(Math.round(n / 1e5) / 10)} M`;
  if (Math.abs(n) >= 1e3) return `$ ${numeroAr.format(Math.round(n / 1e3))}\u00a0mil`;
  return `$ ${numeroAr.format(n)}`;
};
export const porciento = (n) => (n === null || n === undefined ? '—' : `${numeroAr.format(n)} %`);
/* "2026-03" → "mar 26" (eje) o "marzo 2026" (tooltip). */
export const mesCorto = (mes) => `${MESES_CORTOS[Number(mes.slice(5, 7)) - 1]} ${mes.slice(2, 4)}`;
export const mesLargo = (mes) => `${MESES_LARGOS[Number(mes.slice(5, 7)) - 1]} ${mes.slice(0, 4)}`;

/* ---------- Indicador ---------- */

/**
 * Un número grande con lo que es y una línea de contexto. Es la forma de las
 * métricas que pide la comisión: se leen de un vistazo, sin gráfico.
 */
export const Kpi = ({ titulo, valor, detalle, destacado = false }) => (
  <div
    className={cn(
      'flex min-w-0 flex-col rounded-card border p-4 sm:p-5',
      destacado ? 'border-primary-200 bg-primary-50' : 'border-surface-border bg-surface'
    )}
  >
    <p className="text-sm font-medium text-ink-muted">{titulo}</p>
    <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-ink sm:text-[2rem]">{valor}</p>
    {detalle && <p className="mt-1 text-sm leading-snug text-ink-muted">{detalle}</p>}
  </div>
);

/* ---------- Panel de un gráfico ---------- */

export const Panel = ({ titulo, descripcion, accion, className, children }) => (
  <Card as="section" className={cn('flex min-w-0 flex-col', className)}>
    <header className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-ink">{titulo}</h2>
        {descripcion && <p className="mt-1 max-w-prose text-sm leading-relaxed text-ink-muted">{descripcion}</p>}
      </div>
      {accion}
    </header>
    {children}
  </Card>
);

/* ---------- Leyenda y tooltip (recharts) ---------- */

export const Leyenda = ({ items }) => (
  <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
    {items.map((item) => (
      <li key={item.etiqueta} className="flex items-center gap-2">
        <span aria-hidden className="h-2.5 w-2.5 rounded-[3px]" style={{ background: item.color }} />
        {item.etiqueta}
      </li>
    ))}
  </ul>
);

/**
 * La caja del tooltip, igual en todos los gráficos. El texto va en tinta y el
 * color sólo en el cuadradito de al lado: el valor nunca se escribe en el
 * color de la serie.
 */
export const TooltipCaja = ({ active, payload, label, titulo, formato = numero, filas }) => {
  if (!active || !payload?.length) return null;
  const lista = filas ? filas(payload) : payload.map((p) => ({ etiqueta: p.name, valor: formato(p.value), color: p.color }));
  return (
    <div className="min-w-[10rem] rounded-control border border-surface-border bg-surface px-3 py-2.5 text-sm shadow-raised">
      <p className="mb-1.5 font-semibold text-ink">{titulo ? titulo(label, payload) : label}</p>
      <ul className="space-y-1">
        {lista.map((f) => (
          <li key={f.etiqueta} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-ink-soft">
              {f.color && <span aria-hidden className="h-2.5 w-2.5 rounded-[3px]" style={{ background: f.color }} />}
              {f.etiqueta}
            </span>
            <span className="font-semibold tabular-nums text-ink">{f.valor}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* Lo que comparten todos los ejes: grilla tenue, sin líneas de eje. */
export const ejeX = { tick: { fontSize: 12, fill: EJE.texto }, axisLine: { stroke: EJE.grilla }, tickLine: false };
export const ejeY = { tick: { fontSize: 12, fill: EJE.texto }, axisLine: false, tickLine: false, width: 44 };
export const cursorBarras = { fill: 'rgba(44, 61, 52, 0.05)' };

/* ---------- Color de la rampa para un valor ---------- */

/* 0 queda en el crema más claro; el resto se reparte en los pasos 2 a 9 para
   que una celda con poco se distinga de una vacía. */
export const colorRampa = (valor, maximo) => {
  if (!valor || !maximo) return RAMPA[0];
  const paso = 2 + Math.round((valor / maximo) * (RAMPA.length - 3));
  return RAMPA[Math.min(paso, RAMPA.length - 1)];
};
const textoSobre = (fondo) => (RAMPA.indexOf(fondo) >= 6 ? '#ffffff' : EJE.tinta);

/* ---------- Globo flotante para grillas propias ---------- */

/**
 * El tooltip de las grillas que no son de recharts (temporadas, cruce):
 * sigue a la celda que tiene el foco o el mouse y se acomoda para no salirse
 * del panel.
 */
const useGlobo = () => {
  const cajaRef = useRef(null);
  const [globo, setGlobo] = useState(null);
  const mostrar = (evento, contenido) => {
    const caja = cajaRef.current?.getBoundingClientRect();
    const celda = evento.currentTarget.getBoundingClientRect();
    if (!caja) return;
    setGlobo({ contenido, x: celda.left - caja.left + celda.width / 2, y: celda.top - caja.top, ancho: caja.width });
  };
  return { cajaRef, globo, mostrar, ocultar: () => setGlobo(null) };
};

const Globo = ({ globo }) => {
  const ref = useRef(null);
  const [desplazamiento, setDesplazamiento] = useState(0);
  useLayoutEffect(() => {
    if (!globo || !ref.current) return;
    const mitad = ref.current.offsetWidth / 2;
    const izquierda = globo.x - mitad;
    const derecha = globo.x + mitad;
    setDesplazamiento(izquierda < 0 ? -izquierda : derecha > globo.ancho ? globo.ancho - derecha : 0);
  }, [globo]);
  if (!globo) return null;
  return (
    <div
      ref={ref}
      role="tooltip"
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-control border border-surface-border bg-surface px-3 py-2 text-sm shadow-raised"
      style={{ left: globo.x + desplazamiento, top: globo.y - 8 }}
    >
      {globo.contenido}
    </div>
  );
};

/* ---------- Temporadas: día × mes ---------- */

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DIAS_LARGOS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

/**
 * Cuándo viene la gente: una celda por día de la semana y mes, más oscura
 * cuanto más participaciones. Se lee de un vistazo qué meses y qué días
 * llenan la casa.
 */
export const MapaTemporadas = ({ celdas }) => {
  const { cajaRef, globo, mostrar, ocultar } = useGlobo();
  const meses = [...new Set(celdas.map((c) => c.mes))];
  const maximo = Math.max(0, ...celdas.map((c) => c.participaciones));
  const valor = new Map(celdas.map((c) => [`${c.mes}|${c.dia}`, c.participaciones]));

  return (
    <div ref={cajaRef} className="relative">
      <div className="overflow-x-auto pb-1">
        <div
          className="grid min-w-[34rem] gap-[3px]"
          style={{ gridTemplateColumns: `2.5rem repeat(${meses.length}, minmax(0, 1fr))` }}
          onMouseLeave={ocultar}
        >
          <span />
          {meses.map((m) => (
            <span key={m} className="pb-1 text-center text-xs text-ink-muted">
              {mesCorto(m).split(' ')[0]}
            </span>
          ))}
          {DIAS.map((d, dia) => (
            <div key={d} className="contents">
              <span className="flex items-center text-xs text-ink-muted">{d}</span>
              {meses.map((m) => {
                const n = valor.get(`${m}|${dia}`) ?? 0;
                const contenido = (
                  <>
                    <span className="font-semibold text-ink">{numero(n)}</span>
                    <span className="text-ink-soft"> participaciones los {DIAS_LARGOS[dia]} de {mesLargo(m)}</span>
                  </>
                );
                return (
                  <button
                    key={m}
                    type="button"
                    aria-label={`${DIAS_LARGOS[dia]} de ${mesLargo(m)}: ${n} participaciones`}
                    className="h-7 rounded-[4px] outline-none transition-transform duration-fast hover:scale-[1.08] focus-visible:ring-2 focus-visible:ring-ink/40 motion-reduce:transition-none"
                    style={{ background: colorRampa(n, maximo) }}
                    onMouseEnter={(e) => mostrar(e, contenido)}
                    onFocus={(e) => mostrar(e, contenido)}
                    onBlur={ocultar}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
        <span>Menos</span>
        {RAMPA.slice(1).filter((_, i) => i % 2 === 0).map((c) => (
          <span key={c} aria-hidden className="h-3 w-5 rounded-[3px]" style={{ background: c }} />
        ))}
        <span>Más</span>
      </div>
      <Globo globo={globo} />
    </div>
  );
};

/* ---------- Cruce entre propuestas ---------- */

/**
 * Cuánta gente hace dos propuestas distintas. La diagonal es cuánta gente
 * hizo cada una; el resto, cuánta gente hizo las dos. El color va en
 * proporción a la fila: "de los que van a Shabat, cuántos también...".
 */
export const MatrizCruce = ({ categorias, matriz }) => {
  const { cajaRef, globo, mostrar, ocultar } = useGlobo();
  if (!categorias.length) return <p className="text-sm text-ink-muted">Todavía no hay participaciones con categorías en este período.</p>;

  return (
    <div ref={cajaRef} className="relative">
      <div className="overflow-x-auto pb-1">
        <div
          className="grid min-w-[30rem] gap-[3px]"
          style={{ gridTemplateColumns: `8.5rem repeat(${categorias.length}, minmax(0, 1fr))` }}
          onMouseLeave={ocultar}
        >
          <span />
          {categorias.map((c) => (
            <span key={c.nombre} className="truncate px-1 pb-1 text-center text-xs capitalize text-ink-muted">
              {c.nombre}
            </span>
          ))}
          {categorias.map((fila, i) => (
            <div key={fila.nombre} className="contents">
              <span className="flex min-w-0 items-center gap-2 pr-2 text-sm capitalize text-ink-soft">
                <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-pill" style={{ background: fila.color ?? EJE.texto }} />
                <span className="truncate">{fila.nombre}</span>
              </span>
              {categorias.map((col, j) => {
                const n = matriz[i][j];
                const base = matriz[i][i];
                const fondo = colorRampa(n, base);
                const pct = base ? Math.round((n / base) * 100) : 0;
                const contenido =
                  i === j ? (
                    <>
                      <span className="font-semibold text-ink">{numero(n)}</span>
                      <span className="text-ink-soft"> personas hicieron {fila.nombre}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-ink">{pct} %</span>
                      <span className="text-ink-soft">
                        {' '}de quienes hicieron {fila.nombre} también hicieron {col.nombre} ({numero(n)})
                      </span>
                    </>
                  );
                return (
                  <button
                    key={col.nombre}
                    type="button"
                    aria-label={i === j ? `${n} personas en ${fila.nombre}` : `${n} personas hicieron ${fila.nombre} y ${col.nombre}`}
                    className="flex h-10 items-center justify-center rounded-[4px] text-xs font-semibold tabular-nums outline-none transition-transform duration-fast hover:scale-[1.06] focus-visible:ring-2 focus-visible:ring-ink/40 motion-reduce:transition-none"
                    style={{ background: fondo, color: textoSobre(fondo) }}
                    onMouseEnter={(e) => mostrar(e, contenido)}
                    onFocus={(e) => mostrar(e, contenido)}
                    onBlur={ocultar}
                  >
                    {i === j ? numero(n) : `${pct}%`}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <Globo globo={globo} />
    </div>
  );
};

/* ---------- Barras horizontales ---------- */

/**
 * Una lista de cosas con su número y una barra proporcional. Para rankings
 * (por actividad, por categoría) se lee mejor que un gráfico de columnas: el
 * nombre entra entero y el valor está escrito al lado.
 */
export const BarrasHorizontales = ({ filas, formato = numero, color = RAMPA[6], vacio }) => {
  const [activa, setActiva] = useState(null);
  if (!filas.length) return <p className="text-sm text-ink-muted">{vacio}</p>;
  const maximo = Math.max(...filas.map((f) => f.valor));
  return (
    <ul className="space-y-3" onMouseLeave={() => setActiva(null)}>
      {filas.map((f, i) => (
        <li
          key={f.etiqueta}
          onMouseEnter={() => setActiva(i)}
          className={cn('transition-opacity duration-fast', activa !== null && activa !== i && 'opacity-50')}
        >
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-ink-soft">{f.etiqueta}</span>
            <span className="shrink-0 font-semibold tabular-nums text-ink">{formato(f.valor)}</span>
          </div>
          <div className="h-2.5 rounded-pill bg-surface-sunken">
            <div
              className="h-full rounded-pill transition-[width] duration-slow ease-standard motion-reduce:transition-none"
              style={{ width: `${maximo ? Math.max(2, (f.valor / maximo) * 100) : 0}%`, background: f.color ?? color }}
            />
          </div>
          {f.detalle && <p className="mt-1 text-xs text-ink-muted">{f.detalle}</p>}
        </li>
      ))}
    </ul>
  );
};

/* ---------- Segmentado con la marca que viaja ---------- */

/**
 * Pestañas o períodos: la opción elegida tiene un fondo que se desliza hasta
 * su lugar en vez de saltar.
 */
export const Segmentado = ({ opciones, valor, onChange, etiqueta, className }) => {
  const contRef = useRef(null);
  const [marca, setMarca] = useState(null);
  useLayoutEffect(() => {
    const boton = contRef.current?.querySelector('[aria-pressed="true"]');
    if (boton) setMarca({ left: boton.offsetLeft, width: boton.offsetWidth });
  }, [valor, opciones.length]);
  return (
    <div
      ref={contRef}
      role="group"
      aria-label={etiqueta}
      className={cn('relative inline-flex max-w-full overflow-x-auto rounded-pill border border-surface-border bg-surface p-1', className)}
    >
      {marca && (
        <span
          aria-hidden
          className="absolute bottom-1 top-1 rounded-pill bg-ink transition-[left,width] duration-base ease-standard motion-reduce:transition-none"
          style={{ left: marca.left, width: marca.width }}
        />
      )}
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          aria-pressed={valor === o.valor}
          onClick={() => onChange(o.valor)}
          className={cn(
            'relative z-[1] min-h-[36px] whitespace-nowrap rounded-pill px-3.5 text-sm font-medium transition-colors duration-base',
            valor === o.valor ? 'text-surface' : 'text-ink-soft hover:text-ink'
          )}
        >
          {o.etiqueta}
        </button>
      ))}
    </div>
  );
};
