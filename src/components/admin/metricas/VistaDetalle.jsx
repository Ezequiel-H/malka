import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Badge, Button, EmptyState, Field, Icon, Select, Skeleton, Table, cn } from '../../ui';
import useCargaSuave from '../../../hooks/useCargaSuave';
import { ESTADOS } from '../ResumenPersona';
import { nombrePais } from '../../../utils/paises';
import { RAMPA } from './colores';
import { BarrasHorizontales, Kpi, Panel, colorRampa, mesLargo, numero, pesos, porciento } from './piezas';

/* ---------- Las dimensiones por las que se filtra ---------- */

const TRAMOS_EDAD = [
  { valor: '<18', etiqueta: 'Menos de 18', min: 0, max: 17 },
  { valor: '18-21', etiqueta: '18 a 21', min: 18, max: 21 },
  { valor: '22-25', etiqueta: '22 a 25', min: 22, max: 25 },
  { valor: '26-29', etiqueta: '26 a 29', min: 26, max: 29 },
  { valor: '30-35', etiqueta: '30 a 35', min: 30, max: 35 },
  { valor: '36+', etiqueta: '36 o más', min: 36, max: Infinity },
];
const TRAMOS_VECES = [
  { valor: '0', etiqueta: 'No vino', min: 0, max: 0 },
  { valor: '1', etiqueta: '1 vez', min: 1, max: 1 },
  { valor: '2-4', etiqueta: '2 a 4', min: 2, max: 4 },
  { valor: '5-9', etiqueta: '5 a 9', min: 5, max: 9 },
  { valor: '10-24', etiqueta: '10 a 24', min: 10, max: 24 },
  { valor: '25+', etiqueta: '25 o más', min: 25, max: Infinity },
];
const RESIDENCIA = { buenos_aires: 'Buenos Aires', argentina: 'Otra ciudad de Argentina', exterior: 'Otro país' };
const IDIOMA = { es: 'Castellano', en: 'Inglés', he: 'Hebreo' };
const SIN_DATO = '__sin__';
const tramo = (lista, n) => (n === null || n === undefined ? SIN_DATO : lista.find((t) => n >= t.min && n <= t.max)?.valor ?? SIN_DATO);
const primeraMayuscula = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
const titulo = (t) => (t ?? '').replace(/^\[[A-Z]\]\s*/, '');

/**
 * Cada dimensión sabe sus opciones (a partir de los datos), cómo se llama
 * cada valor y qué valores tiene una persona. Filtrar es: la persona pasa si,
 * en cada dimensión con algo elegido, tiene al menos uno de los valores
 * (Y entre filtros, O dentro de uno). Las de «sólo» son al revés: todo lo
 * que hizo tiene que estar entre lo elegido.
 */
const armarDimensiones = (datos) => {
  const actividadPorId = new Map(datos.actividades.map((a) => [a.id, titulo(a.titulo)]));
  const nacionalidades = [...new Set(datos.personas.map((p) => p.nacionalidad).filter(Boolean))];
  const comoSeEntero = [...new Set(datos.personas.map((p) => p.comoSeEntero).filter(Boolean))];
  return [
    { clave: 'estado', etiqueta: 'Estado', opciones: Object.entries(ESTADOS).map(([v, e]) => ({ value: v, label: e.etiqueta })), de: (p) => [p.estado] },
    { clave: 'veces', etiqueta: 'Veces en el período', opciones: TRAMOS_VECES.map((t) => ({ value: t.valor, label: t.etiqueta })), de: (p) => [tramo(TRAMOS_VECES, p.veces)] },
    { clave: 'nueva', etiqueta: 'Primera vez', opciones: [{ value: 'si', label: 'Vino por primera vez en el período' }], de: (p) => (p.nuevaEnRango ? ['si'] : []) },
    {
      clave: 'edad',
      etiqueta: 'Edad',
      opciones: [...TRAMOS_EDAD.map((t) => ({ value: t.valor, label: t.etiqueta })), { value: SIN_DATO, label: 'Sin fecha de nacimiento' }],
      de: (p) => [tramo(TRAMOS_EDAD, p.edad)],
    },
    {
      clave: 'origen',
      etiqueta: 'Origen',
      opciones: [
        { value: 'AR', label: 'Argentinas' },
        { value: 'extranjera', label: 'Extranjeras' },
        { value: SIN_DATO, label: 'Sin nacionalidad cargada' },
      ],
      de: (p) => [!p.nacionalidad ? SIN_DATO : p.nacionalidad === 'AR' ? 'AR' : 'extranjera'],
    },
    {
      clave: 'nacionalidad',
      etiqueta: 'Nacionalidad',
      opciones: nacionalidades.map((c) => ({ value: c, label: nombrePais(c) })).sort((a, b) => a.label.localeCompare(b.label)),
      de: (p) => (p.nacionalidad ? [p.nacionalidad] : []),
    },
    {
      clave: 'vive',
      etiqueta: 'Dónde vive',
      opciones: [...Object.entries(RESIDENCIA).map(([v, l]) => ({ value: v, label: l })), { value: SIN_DATO, label: 'Sin dato' }],
      de: (p) => [p.residencia ?? SIN_DATO],
    },
    {
      clave: 'propuesta',
      etiqueta: 'Hizo la propuesta',
      opciones: datos.categorias.map((c) => ({ value: c.nombre, label: c.nombre })),
      de: (p) => p.categorias,
    },
    {
      clave: 'tambien',
      etiqueta: 'Hizo también la propuesta',
      opciones: datos.categorias.map((c) => ({ value: c.nombre, label: c.nombre })),
      de: (p) => p.categorias,
    },
    {
      clave: 'actividad',
      etiqueta: 'Vino a la actividad',
      opciones: datos.actividades.map((a) => ({ value: a.id, label: titulo(a.titulo) })).sort((a, b) => a.label.localeCompare(b.label)),
      de: (p) => p.actividades,
      etiquetaDe: (v) => actividadPorId.get(v) ?? v,
    },
    {
      clave: 'solo',
      etiqueta: 'Vino sólo a',
      opciones: datos.actividades.map((a) => ({ value: a.id, label: titulo(a.titulo) })).sort((a, b) => a.label.localeCompare(b.label)),
      de: (p) => p.actividades,
      solo: true,
      etiquetaDe: (v) => actividadPorId.get(v) ?? v,
    },
    {
      clave: 'pago',
      etiqueta: 'Pagó',
      opciones: [
        { value: 'si', label: 'Pagó algo en el período' },
        { value: 'no', label: 'No pagó nada en el período' },
      ],
      de: (p) => [p.pagado > 0 ? 'si' : 'no'],
    },
    {
      clave: 'entero',
      etiqueta: 'Cómo se enteró',
      opciones: comoSeEntero.map((c) => ({ value: c, label: c })).sort((a, b) => a.label.localeCompare(b.label)),
      de: (p) => (p.comoSeEntero ? [p.comoSeEntero] : []),
    },
    { clave: 'idioma', etiqueta: 'Idioma', opciones: Object.entries(IDIOMA).map(([v, l]) => ({ value: v, label: l })), de: (p) => [p.idioma] },
  ];
};

const pasa = (persona, dimensiones, filtros) =>
  dimensiones.every((d) => {
    const elegidos = filtros[d.clave];
    if (!elegidos?.length) return true;
    const propios = d.de(persona);
    if (d.solo) return propios.length > 0 && propios.every((v) => elegidos.includes(v));
    return propios.some((v) => elegidos.includes(v));
  });

/* ---------- El grupo en una frase ---------- */

/**
 * Lo que tiene de particular el grupo filtrado, dicho como lo diría alguien
 * del equipo: cuántas son, cómo vienen, qué hacen y qué edad tienen.
 */
const resumenGrupo = (gente, total) => {
  const partes = [`Son ${numero(gente.length)} personas, ${Math.round((gente.length / total) * 100)} de cada 100 registradas.`];
  const masComun = (de) => {
    const cuenta = new Map();
    for (const p of gente) for (const v of de(p)) cuenta.set(v, (cuenta.get(v) ?? 0) + 1);
    return [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
  };
  const estado = masComun((p) => [p.estado]);
  const COMO = {
    frecuente: 'son frecuentes',
    ocasional: 'vienen de vez en cuando',
    nueva: 'son nuevas',
    alejandose: 'se están alejando',
    inactiva: 'están inactivas',
    sin_participar: 'todavía no participaron',
  };
  if (estado) partes.push(`La mayoría (${numero(estado[1])}) ${COMO[estado[0]]}.`);
  const propuesta = masComun((p) => p.categorias);
  if (propuesta) partes.push(`Lo que más hacen es ${propuesta[0]} (${numero(propuesta[1])}).`);
  const edades = gente.map((p) => p.edad).filter((e) => e !== null);
  if (edades.length) partes.push(`Tienen ${numero(Math.round(edades.reduce((a, b) => a + b, 0) / edades.length))} años en promedio.`);
  const vinieron = gente.filter((p) => p.veces > 0);
  if (vinieron.length) {
    partes.push(`Las que vinieron, vinieron ${numero(Math.round((vinieron.reduce((t, p) => t + p.veces, 0) / vinieron.length) * 10) / 10)} veces cada una.`);
  }
  return partes.join(' ');
};

/* ---------- Preguntas rápidas ---------- */

const preguntasRapidas = (datos) => {
  const shabat = datos.actividades.filter((a) => /shabat/i.test(a.titulo)).map((a) => a.id);
  return [
    shabat.length && { etiqueta: 'Vinieron sólo a Shabat', filtros: { solo: shabat } },
    { etiqueta: 'Se están alejando', filtros: { estado: ['alejandose'] } },
    { etiqueta: 'Nuevas en el período', filtros: { nueva: ['si'] } },
    { etiqueta: 'Las que más vienen', filtros: { veces: ['10-24', '25+'] } },
    { etiqueta: 'Extranjeras', filtros: { origen: ['extranjera'] } },
    { etiqueta: 'Viven fuera de Buenos Aires', filtros: { vive: ['argentina', 'exterior'] } },
    { etiqueta: 'Menores de 26', filtros: { edad: ['<18', '18-21', '22-25'] } },
    { etiqueta: 'Vinieron y nunca pagaron', filtros: { veces: ['1', '2-4', '5-9', '10-24', '25+'], pago: ['no'] } },
  ].filter(Boolean);
};

/* ---------- CSV ---------- */

const celda = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const fechaCsv = (f) => (f ? new Date(f).toISOString().slice(0, 10) : '');

const descargarCsv = (personas, desde, hasta) => {
  const columnas = [
    ['Nombre', (p) => p.nombre],
    ['Email', (p) => p.email],
    ['Teléfono', (p) => p.telefono],
    ['Estado', (p) => ESTADOS[p.estado]?.etiqueta],
    ['Veces en el período', (p) => p.veces],
    ['Veces en total', (p) => p.vecesTotal],
    ['Primera vez', (p) => fechaCsv(p.primeraVez)],
    ['Última vez', (p) => fechaCsv(p.ultimaVez)],
    ['Edad', (p) => p.edad],
    ['Nacionalidad', (p) => (p.nacionalidad ? nombrePais(p.nacionalidad) : '')],
    ['Dónde vive', (p) => [RESIDENCIA[p.residencia], p.ciudad].filter(Boolean).join(' · ')],
    ['Propuestas', (p) => p.categorias.join(', ')],
    ['Pagó en el período', (p) => p.pagado],
    ['Cómo se enteró', (p) => p.comoSeEntero],
  ];
  const lineas = [columnas.map(([c]) => c).join(';'), ...personas.map((p) => columnas.map(([, f]) => celda(f(p))).join(';'))];
  // BOM: Excel abre bien los acentos.
  const blob = new Blob(['﻿' + lineas.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `malka-personas-${desde}-a-${hasta}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

/* ---------- La vista ---------- */

const ORDENES = [
  { value: 'veces', label: 'Más veces en el período' },
  { value: 'ultima', label: 'Vino hace más tiempo' },
  { value: 'reciente', label: 'Vino más recientemente' },
  { value: 'nombre', label: 'Nombre' },
  { value: 'edad', label: 'Edad' },
];
const ordenar = (lista, orden) => {
  const copia = [...lista];
  const t = (f) => (f ? new Date(f).getTime() : 0);
  if (orden === 'nombre') return copia.sort((a, b) => a.nombre.localeCompare(b.nombre));
  if (orden === 'edad') return copia.sort((a, b) => (a.edad ?? 999) - (b.edad ?? 999));
  if (orden === 'ultima') return copia.sort((a, b) => (t(a.ultimaVez) || Infinity) - (t(b.ultimaVez) || Infinity));
  if (orden === 'reciente') return copia.sort((a, b) => t(b.ultimaVez) - t(a.ultimaVez));
  return copia.sort((a, b) => b.veces - a.veces);
};
const POR_TANDA = 25;
const PREFIJO = 'f_';

/**
 * Personas en detalle: para cuando alguien de la comisión pregunta algo
 * puntual. Se arma la pregunta con filtros (o se toca una de las rápidas) y
 * al instante se ve cuántas son, cómo se reparten y quiénes son, con la
 * lista para descargar.
 */
const VistaDetalle = ({ desde, hasta }) => {
  const [params, setParams] = useSearchParams();
  const [orden, setOrden] = useState('veces');
  const [visibles, setVisibles] = useState(POR_TANDA);
  /* En el teléfono los doce filtros son varias pantallas: se despliegan a
     pedido. Los chips de lo elegido se ven siempre. */
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const { datos, cargando, actualizando, error } = useCargaSuave(
    (signal) => axios.get('/admin/metrics/people', { params: { from: desde, to: hasta }, signal }).then((r) => r.data),
    `${desde}|${hasta}`
  );

  const dimensiones = useMemo(() => (datos ? armarDimensiones(datos) : []), [datos]);
  const filtros = useMemo(
    () => Object.fromEntries(dimensiones.map((d) => [d.clave, (params.get(PREFIJO + d.clave) ?? '').split(',').filter(Boolean)])),
    [dimensiones, params]
  );
  const hayFiltros = Object.values(filtros).some((v) => v.length);

  const ponerFiltros = (nuevos) => {
    setVisibles(POR_TANDA);
    setParams(
      (actual) => {
        const n = new URLSearchParams(actual);
        for (const [k, v] of Object.entries(nuevos)) {
          if (v?.length) n.set(PREFIJO + k, v.join(','));
          else n.delete(PREFIJO + k);
        }
        return n;
      },
      { replace: true }
    );
  };
  /* Tocar una barra de los repartos suma ese valor como filtro. Los «sin
     dato» de nacionalidad no tienen filtro propio: se usa el de origen. */
  const sumarFiltro = (clave, valor) => {
    if (clave === 'nacionalidad' && valor === SIN_DATO) return ponerFiltros({ origen: [...new Set([...filtros.origen, SIN_DATO])] });
    if (!filtros[clave] || filtros[clave].includes(valor)) return;
    ponerFiltros({ [clave]: [...filtros[clave], valor] });
  };
  const limpiar = () => ponerFiltros(Object.fromEntries(dimensiones.map((d) => [d.clave, []])));

  /* Si se llegó tocando un gráfico, la pregunta ya está armada: se baja al
     resultado en vez de dejar a la persona frente a los filtros. */
  const irAlResultado = params.get('ir') === 'resultado';
  useEffect(() => {
    if (!irAlResultado || !datos) return;
    document.getElementById('detalle-resultado')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setParams(
      (actual) => {
        const n = new URLSearchParams(actual);
        n.delete('ir');
        return n;
      },
      { replace: true }
    );
  }, [irAlResultado, datos, setParams]);

  if (error) return <p className="text-sm text-danger-600">No se pudo armar el detalle de personas.</p>;
  if (cargando || !datos) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Armando el detalle">
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-96 rounded-card" />
      </div>
    );
  }

  const elegidas = datos.personas.filter((p) => pasa(p, dimensiones, filtros));
  const participaron = elegidas.filter((p) => p.veces > 0);
  const edades = elegidas.map((p) => p.edad).filter((e) => e !== null);
  const reparto = (de, etiquetaDe, limite = 6) => {
    const cuenta = new Map();
    for (const p of elegidas) for (const v of de(p)) cuenta.set(v, (cuenta.get(v) ?? 0) + 1);
    return [...cuenta.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limite)
      .map(([v, n]) => ({ etiqueta: etiquetaDe(v), valor: n, clave: v }));
  };
  const lista = ordenar(elegidas, orden);
  const maxCohorte = Math.max(0, ...datos.cohortes.flatMap((c) => c.despues.filter((v) => v !== null)));
  const etiquetaValor = (d, v) => d.etiquetaDe?.(v) ?? d.opciones.find((o) => o.value === v)?.label ?? v;

  return (
    <div className={cn('space-y-6 transition-opacity duration-base', actualizando && 'pointer-events-none opacity-50')}>
      <Panel titulo="Preguntas rápidas" descripcion="Un toque arma la pregunta; después se puede afinar con los filtros.">
        <div className="flex flex-wrap gap-2">
          {preguntasRapidas(datos).map((q) => (
            <button
              key={q.etiqueta}
              type="button"
              onClick={() => {
                limpiar();
                ponerFiltros(q.filtros);
              }}
              className="min-h-[36px] rounded-pill border border-surface-border bg-surface px-3.5 text-sm font-medium text-ink-soft transition-colors duration-base hover:border-ink/30 hover:text-ink"
            >
              {q.etiqueta}
            </button>
          ))}
        </div>
      </Panel>

      <Panel
        titulo="Filtros"
        descripcion="Se suman: tiene que cumplir todos. Dentro de un mismo filtro alcanza con uno de los valores."
        accion={
          hayFiltros && (
            <Button variant="link" size="sm" onClick={limpiar}>
              Sacar todos
            </Button>
          )
        }
      >
        <Button
          variant="secondary"
          size="sm"
          iconRight={filtrosAbiertos ? 'chevronUp' : 'chevronDown'}
          onClick={() => setFiltrosAbiertos((a) => !a)}
          aria-expanded={filtrosAbiertos}
          className="mb-3 sm:hidden"
        >
          {filtrosAbiertos ? 'Ocultar filtros' : 'Mostrar filtros'}
        </Button>
        <div className={cn('gap-x-4 sm:grid sm:grid-cols-2 lg:grid-cols-4', filtrosAbiertos ? 'grid animate-fade-in-up' : 'hidden')}>
          {dimensiones
            .filter((d) => d.opciones.length)
            .map((d) => (
              <Field key={d.clave} label={d.etiqueta} htmlFor={`filtro-${d.clave}`} className="mb-3">
                <Select
                  id={`filtro-${d.clave}`}
                  options={d.opciones.filter((o) => !filtros[d.clave].includes(o.value))}
                  value={null}
                  onChange={(v) => v && ponerFiltros({ [d.clave]: [...filtros[d.clave], v] })}
                  placeholder={filtros[d.clave].length ? 'Sumar otro…' : 'Todos'}
                  searchable={d.opciones.length > 8}
                  size="sm"
                />
              </Field>
            ))}
        </div>
        {hayFiltros && (
          <ul className="mt-2 flex flex-wrap gap-2" aria-label="Filtros activos">
            {dimensiones.flatMap((d) =>
              filtros[d.clave].map((v) => (
                <li key={`${d.clave}-${v}`} className="animate-fade-in">
                  <button
                    type="button"
                    onClick={() => ponerFiltros({ [d.clave]: filtros[d.clave].filter((x) => x !== v) })}
                    className="inline-flex min-h-[32px] items-center gap-1.5 rounded-pill bg-ink px-3 text-sm text-surface transition-opacity duration-base hover:opacity-85"
                    aria-label={`Sacar ${d.etiqueta}: ${etiquetaValor(d, v)}`}
                  >
                    <span className="text-surface/70">{d.etiqueta}:</span>
                    <span>{primeraMayuscula(etiquetaValor(d, v))}</span>
                    <span aria-hidden>×</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </Panel>

      <div id="detalle-resultado" className="scroll-mt-24" />
      {hayFiltros && elegidas.length > 0 && (
        <p className="flex animate-fade-in items-start gap-2.5 rounded-control bg-primary-50 px-4 py-3 text-sm leading-relaxed text-ink">
          <Icon name="idea" size="sm" className="mt-0.5 shrink-0 text-primary-700" />
          <span>{resumenGrupo(elegidas, datos.personas.length)}</span>
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Kpi
          titulo="Personas"
          valor={numero(elegidas.length)}
          detalle={hayFiltros ? `De ${numero(datos.personas.length)} registradas` : 'Todas las registradas'}
          destacado={hayFiltros}
        />
        <Kpi titulo="Vinieron en el período" valor={numero(participaron.length)} detalle={porciento(elegidas.length ? Math.round((participaron.length / elegidas.length) * 1000) / 10 : null)} />
        <Kpi
          titulo="Veces por persona"
          valor={participaron.length ? numero(Math.round((participaron.reduce((t, p) => t + p.veces, 0) / participaron.length) * 10) / 10) : '—'}
          detalle="Entre las que vinieron"
        />
        <Kpi
          titulo="Edad promedio"
          valor={edades.length ? numero(Math.round((edades.reduce((a, b) => a + b, 0) / edades.length) * 10) / 10) : '—'}
          detalle={`${numero(elegidas.length - edades.length)} sin fecha de nacimiento`}
        />
      </div>

      {elegidas.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Panel titulo="Cómo vienen">
            <BarrasHorizontales
              onFila={(f) => sumarFiltro('estado', f.clave)}
              accionFila="Filtrar por esto"
               filas={reparto((p) => [p.estado], (v) => ESTADOS[v]?.etiqueta ?? v)} color={RAMPA[6]} />
          </Panel>
          <Panel titulo="Qué propuestas hacen">
            <BarrasHorizontales
              onFila={(f) => sumarFiltro('propuesta', f.clave)}
              accionFila="Filtrar por esto"
              
              filas={reparto((p) => p.categorias, primeraMayuscula)}
              color={RAMPA[6]}
              vacio="No hicieron ninguna en el período."
            />
          </Panel>
          <Panel titulo="Edad">
            <BarrasHorizontales
              onFila={(f) => sumarFiltro('edad', f.clave)}
              accionFila="Filtrar por esto"
              
              filas={reparto((p) => [tramo(TRAMOS_EDAD, p.edad)], (v) => TRAMOS_EDAD.find((t) => t.valor === v)?.etiqueta ?? 'Sin dato', 7)}
              color={RAMPA[5]}
            />
          </Panel>
          <Panel titulo="Nacionalidad">
            <BarrasHorizontales
              onFila={(f) => sumarFiltro('nacionalidad', f.clave)}
              accionFila="Filtrar por esto"
               filas={reparto((p) => [p.nacionalidad ?? SIN_DATO], (v) => (v === SIN_DATO ? 'Sin dato' : nombrePais(v)))} color={RAMPA[5]} />
          </Panel>
          <Panel titulo="Dónde viven">
            <BarrasHorizontales
              onFila={(f) => sumarFiltro('vive', f.clave)}
              accionFila="Filtrar por esto"
               filas={reparto((p) => [p.residencia ?? SIN_DATO], (v) => RESIDENCIA[v] ?? 'Sin dato')} color={RAMPA[5]} />
          </Panel>
          <Panel titulo="Cómo se enteraron">
            <BarrasHorizontales
              onFila={(f) => sumarFiltro('entero', f.clave)}
              accionFila="Filtrar por esto"
               filas={reparto((p) => (p.comoSeEntero ? [p.comoSeEntero] : []), (v) => v)} color={RAMPA[5]} vacio="Nadie lo contó." />
          </Panel>
        </div>
      )}

      <Panel
        titulo="Quiénes son"
        descripcion={`${numero(elegidas.length)} personas. Tocá un nombre para ver su ficha.`}
        accion={
          <div className="flex flex-wrap items-end gap-2">
            <Field label="Ordenar" htmlFor="detalle-orden" className="mb-0 w-56">
              <Select id="detalle-orden" options={ORDENES} value={orden} onChange={(v) => v && setOrden(v)} size="sm" />
            </Field>
            <Button variant="secondary" size="sm" icon="download" onClick={() => descargarCsv(lista, desde, hasta)} disabled={!lista.length}>
              Descargar CSV
            </Button>
          </div>
        }
      >
        <Table
          stacked
          rows={lista.slice(0, visibles)}
          rowKey={(p) => p.id}
          empty={<EmptyState icon="users" title="Nadie cumple todos los filtros" description="Sacá alguno para ampliar la búsqueda." />}
          columns={[
            {
              key: 'nombre',
              header: 'Persona',
              render: (p) => (
                <Link to={`/admin/users/${p.id}`} className="font-medium text-ink hover:text-primary-700 hover:underline">
                  {p.nombre}
                </Link>
              ),
            },
            {
              key: 'estado',
              header: 'Estado',
              render: (p) => (
                <Badge tone={ESTADOS[p.estado]?.tono} icon={ESTADOS[p.estado]?.icono}>
                  {ESTADOS[p.estado]?.etiqueta}
                </Badge>
              ),
            },
            { key: 'veces', header: 'Veces', align: 'right', render: (p) => <span className="tabular-nums">{numero(p.veces)}</span> },
            {
              key: 'ultima',
              header: 'Última vez',
              render: (p) =>
                p.ultimaVez ? new Date(p.ultimaVez).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—',
            },
            { key: 'edad', header: 'Edad', align: 'right', render: (p) => p.edad ?? '—' },
            { key: 'nacionalidad', header: 'Nacionalidad', render: (p) => (p.nacionalidad ? nombrePais(p.nacionalidad) : '—') },
            { key: 'pagado', header: 'Pagó', align: 'right', render: (p) => (p.pagado ? pesos(p.pagado) : '—') },
          ]}
        />
        {lista.length > visibles && (
          <div className="mt-4 flex justify-center">
            <Button variant="secondary" size="sm" onClick={() => setVisibles((v) => v + POR_TANDA)}>
              Ver más ({numero(lista.length - visibles)} restantes)
            </Button>
          </div>
        )}
      </Panel>

      <Panel
        titulo="¿Vuelven?"
        descripcion="De quienes vinieron por primera vez cada mes, qué parte volvió el mes siguiente, a los dos y a los tres. Más oscuro, más volvieron. No mira los filtros."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[30rem] border-separate border-spacing-[3px] text-sm">
            <thead>
              <tr className="text-xs text-ink-muted">
                <th className="text-start font-medium">Primera vez</th>
                <th className="text-end font-medium">Personas</th>
                <th className="font-medium">Mes 1</th>
                <th className="font-medium">Mes 2</th>
                <th className="font-medium">Mes 3</th>
              </tr>
            </thead>
            <tbody>
              {datos.cohortes
                .filter((c) => c.personas > 0)
                .map((c) => (
                  <tr key={c.mes}>
                    <td className="whitespace-nowrap capitalize text-ink-soft">{mesLargo(c.mes)}</td>
                    <td className="text-end tabular-nums text-ink">{numero(c.personas)}</td>
                    {c.despues.map((v, i) => {
                      const fondo = v === null ? 'transparent' : colorRampa(v, maxCohorte);
                      const oscuro = v !== null && RAMPA.indexOf(fondo) >= 6;
                      return (
                        <td
                          key={i}
                          className={cn('h-9 rounded-[4px] text-center tabular-nums', v === null ? 'text-ink-faint' : oscuro ? 'font-semibold text-surface' : 'font-semibold text-ink')}
                          style={{ background: fondo }}
                          title={v === null ? 'Todavía no pasó' : `${v} % volvió`}
                        >
                          {v === null ? '·' : `${numero(v)} %`}
                        </td>
                      );
                    })}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
};

export default VistaDetalle;
