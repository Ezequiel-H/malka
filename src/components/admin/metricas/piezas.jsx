import { useId, useLayoutEffect, useRef, useState } from 'react';
import { Card, Icon, cn } from '../../ui';
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

/* ---------- Ayuda que se despliega ---------- */

/**
 * El «¿Cómo se lee?» de cada gráfico y la definición de cada número: un
 * botón chico que despliega la explicación en el lugar, sin modal.
 */
const useAyuda = () => {
  const [abierta, setAbierta] = useState(false);
  const id = useId();
  return { abierta, alternar: () => setAbierta((a) => !a), id };
};

const BotonAyuda = ({ ayuda, etiqueta }) => (
  <button
    type="button"
    onClick={ayuda.alternar}
    aria-expanded={ayuda.abierta}
    aria-controls={ayuda.id}
    className={cn(
      'inline-flex min-h-[32px] shrink-0 items-center gap-1.5 rounded-pill px-2.5 text-xs font-medium transition-colors duration-base',
      ayuda.abierta ? 'bg-ink text-surface' : 'text-ink-muted hover:bg-ink/5 hover:text-ink'
    )}
  >
    <Icon name="info" size="xs" />
    {etiqueta}
  </button>
);

/* Se despliega con altura animada (grid 0fr → 1fr), así nada salta. */
const Desplegable = ({ abierta, id, children, className }) => (
  <div
    id={id}
    className={cn('grid transition-[grid-template-rows,opacity] duration-slow ease-standard motion-reduce:transition-none', abierta ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}
    aria-hidden={!abierta}
  >
    <div className="overflow-hidden">
      <div className={className}>{children}</div>
    </div>
  </div>
);

/* ---------- Indicador ---------- */

/**
 * Cómo cambió un número contra el período anterior del mismo largo. El color
 * dice si es bueno o malo (con ícono y texto, nunca sólo color); `mejorSiSube`
 * en false para lo que conviene que baje.
 */
export const Cambio = ({ actual, anterior, mejorSiSube = true, enPuntos = false }) => {
  if (actual === null || actual === undefined || anterior === null || anterior === undefined) return null;
  const diferencia = enPuntos ? actual - anterior : anterior ? ((actual - anterior) / anterior) * 100 : null;
  if (diferencia === null) return null;
  const redondeada = Math.round(diferencia * 10) / 10;
  if (Math.abs(redondeada) < 0.5) {
    return <span className="text-xs text-ink-muted">Igual que el período anterior</span>;
  }
  const sube = redondeada > 0;
  const bueno = sube === mejorSiSube;
  /* Contra un período casi vacío un porcentaje no se entiende («1.270 %
     más»): ahí se dice cuántas veces más, y cuánto había. */
  const veces = !enPuntos && anterior > 0 && actual / anterior >= 3 ? Math.round(actual / anterior) : null;
  return (
    <span className={cn('inline-flex items-start gap-1 text-xs font-medium leading-snug', bueno ? 'text-success-700' : 'text-danger-600')}>
      <Icon name={sube ? 'chevronUp' : 'chevronDown'} size="xs" className="mt-0.5 shrink-0" />
      <span>
        {veces
          ? `${numero(veces)} veces más que el período anterior (había ${numero(anterior)})`
          : `${numero(Math.abs(redondeada))}${enPuntos ? ' puntos' : ' %'} ${sube ? 'más' : 'menos'} que el período anterior`}
      </span>
    </span>
  );
};

/**
 * Un número grande con lo que es y una línea de contexto. Es la forma de las
 * métricas que pide la comisión: se leen de un vistazo, sin gráfico. Con
 * `ayuda` lleva su definición, y con `cambio` la comparación con el período
 * anterior.
 */
export const Kpi = ({ titulo, valor, detalle, destacado = false, ayuda: textoAyuda, cambio }) => {
  const ayuda = useAyuda();
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col rounded-card border p-4 sm:p-5',
        destacado ? 'border-primary-200 bg-primary-50' : 'border-surface-border bg-surface'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-ink-muted">{titulo}</p>
        {textoAyuda && (
          <button
            type="button"
            onClick={ayuda.alternar}
            aria-expanded={ayuda.abierta}
            aria-controls={ayuda.id}
            aria-label={`Qué es «${titulo}»`}
            className={cn(
              '-mr-1.5 -mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-pill transition-colors duration-base',
              ayuda.abierta ? 'bg-ink text-surface' : 'text-ink-faint hover:bg-ink/5 hover:text-ink'
            )}
          >
            <Icon name="info" size="xs" />
          </button>
        )}
      </div>
      <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-ink sm:text-[2rem]">{valor}</p>
      {detalle && <p className="mt-1 text-sm leading-snug text-ink-muted">{detalle}</p>}
      {cambio && <div className="mt-2">{cambio}</div>}
      {textoAyuda && (
        <Desplegable abierta={ayuda.abierta} id={ayuda.id} className="pt-3 text-sm leading-relaxed text-ink-soft">
          {textoAyuda}
        </Desplegable>
      )}
    </div>
  );
};

/* ---------- Panel de un gráfico ---------- */

/**
 * La tarjeta de cada gráfico. `lectura` es la frase que resume lo que dice el
 * gráfico con los datos de ahora («octubre fue el mes con más gente»), y
 * `ayuda` explica cómo leerlo; las dos en castellano llano, para que el
 * gráfico se entienda sin que nadie lo explique.
 */
export const Panel = ({ titulo, descripcion, accion, ayuda: textoAyuda, lectura, className, children }) => {
  const ayuda = useAyuda();
  return (
    <Card as="section" className={cn('flex min-w-0 flex-col', className)}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="text-lg font-semibold text-ink">{titulo}</h2>
            {textoAyuda && <BotonAyuda ayuda={ayuda} etiqueta="¿Cómo se lee?" />}
          </div>
          {descripcion && <p className="mt-1 max-w-prose text-sm leading-relaxed text-ink-muted">{descripcion}</p>}
        </div>
        {accion}
      </header>
      {textoAyuda && (
        <Desplegable
          abierta={ayuda.abierta}
          id={ayuda.id}
          className="mb-4 rounded-control border border-surface-border bg-surface-sunken px-4 py-3 text-sm leading-relaxed text-ink-soft"
        >
          {textoAyuda}
        </Desplegable>
      )}
      {lectura && (
        <p className="mb-4 flex items-start gap-2.5 rounded-control bg-primary-50 px-3.5 py-2.5 text-sm leading-relaxed text-ink">
          <Icon name="idea" size="sm" className="mt-0.5 shrink-0 text-primary-700" />
          <span>{lectura}</span>
        </p>
      )}
      {children}
    </Card>
  );
};

/* ---------- Leyenda y tooltip (recharts) ---------- */

/**
 * La leyenda. Si los items traen `onToggle`, cada uno es un botón que prende
 * y apaga su serie: así se puede mirar una sola.
 */
export const Leyenda = ({ items }) => (
  <ul className="mb-3 flex flex-wrap gap-x-2 gap-y-1 text-sm text-ink-soft">
    {items.map((item) => (
      <li key={item.etiqueta}>
        {item.onToggle ? (
          <button
            type="button"
            onClick={item.onToggle}
            aria-pressed={item.activo !== false}
            title={item.activo !== false ? 'Tocá para ocultar' : 'Tocá para mostrar'}
            className={cn(
              'flex min-h-[32px] items-center gap-2 rounded-pill px-2.5 transition-[opacity,background-color] duration-base hover:bg-ink/5',
              item.activo === false && 'opacity-45'
            )}
          >
            <span aria-hidden className="h-2.5 w-2.5 rounded-[3px]" style={{ background: item.color }} />
            <span className={cn(item.activo === false && 'line-through')}>{item.etiqueta}</span>
          </button>
        ) : (
          <span className="flex min-h-[32px] items-center gap-2 px-2.5">
            <span aria-hidden className="h-2.5 w-2.5 rounded-[3px]" style={{ background: item.color }} />
            {item.etiqueta}
          </span>
        )}
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
const textoSobre = (fondo) => (RAMPA.indexOf(fondo) >= 5 ? '#ffffff' : EJE.tinta);

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
export const MapaTemporadas = ({ celdas, onCelda }) => {
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
                    {onCelda && <span className="block text-xs text-ink-muted">Tocá para ver quiénes vinieron ese mes</span>}
                  </>
                );
                return (
                  <button
                    key={m}
                    type="button"
                    aria-label={`${DIAS_LARGOS[dia]} de ${mesLargo(m)}: ${n} participaciones`}
                    className="h-7 cursor-pointer rounded-[4px] outline-none transition-transform duration-fast hover:scale-[1.08] focus-visible:ring-2 focus-visible:ring-ink/40 motion-reduce:transition-none"
                    style={{ background: colorRampa(n, maximo) }}
                    onMouseEnter={(e) => mostrar(e, contenido)}
                    onFocus={(e) => mostrar(e, contenido)}
                    onBlur={ocultar}
                    onClick={onCelda ? () => onCelda({ mes: m, dia }) : undefined}
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
export const MatrizCruce = ({ categorias, matriz, onCelda }) => {
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
                      {onCelda && <span className="block text-xs text-ink-muted">Tocá para ver quiénes son</span>}
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
                    onClick={onCelda ? () => onCelda(fila.nombre, col.nombre) : undefined}
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
/* `base` corre el cero de la escala: para promedios (edades) que van de 22
   a 32, barras desde 0 se verían todas iguales. */
export const BarrasHorizontales = ({ filas, formato = numero, color = RAMPA[6], vacio, onFila, accionFila = 'Ver quiénes', base = 0 }) => {
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
          {/* Con `onFila` la fila entera es un botón: tocarla abre la
              pregunta armada («quiénes son estos»). */}
          {(() => {
            const contenido = (
              <>
                <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-ink-soft">{f.etiqueta}</span>
                  <span className="shrink-0 font-semibold tabular-nums text-ink">{formato(f.valor)}</span>
                </div>
                <div className="h-2.5 rounded-pill bg-surface-sunken">
                  <div
                    className="h-full rounded-pill transition-[width] duration-slow ease-standard motion-reduce:transition-none"
                    style={{ width: `${maximo > base ? Math.max(2, ((f.valor - base) / (maximo - base)) * 100) : 0}%`, background: f.color ?? color }}
                  />
                </div>
                {(f.detalle || (onFila && activa === i)) && (
                  <p className="mt-1 flex items-center justify-between gap-2 text-xs text-ink-muted">
                    <span>{f.detalle}</span>
                    {onFila && activa === i && (
                      <span className="inline-flex items-center gap-1 font-medium text-primary-700">
                        {accionFila}
                        <Icon name="forward" size="xs" className="rtl:-scale-x-100" />
                      </span>
                    )}
                  </p>
                )}
              </>
            );
            return onFila ? (
              <button
                type="button"
                onClick={() => onFila(f)}
                onFocus={() => setActiva(i)}
                className="-mx-2 block w-[calc(100%+1rem)] rounded-control px-2 py-1 text-start transition-colors duration-base hover:bg-ink/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
              >
                {contenido}
              </button>
            ) : (
              contenido
            );
          })()}
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
