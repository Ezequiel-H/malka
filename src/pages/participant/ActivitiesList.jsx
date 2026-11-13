import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import useCargaSuave from '../../hooks/useCargaSuave';
import { useDebounce } from '../../hooks/useDebounce';
import { activityPublicTags, publicTagColor, publicTagIcon, DEFAULT_PUBLIC_TAG_COLOR } from '../../utils/tagFields';
import { formatActivityPrice } from '../../utils/priceUtils';
import { formatUtcCalendarDateToString } from '../../utils/dateUtils';
import { diasHasta, fechaEn, hoyIso, horaDe, ocurreEl, sumarDias } from '../../utils/participante';
import PageContainer from '../../components/layout/PageContainer';
import BirthDatePrompt from '../../components/profile/BirthDatePrompt';
import DatosFaltantesPrompt from '../../components/profile/DatosFaltantesPrompt';
import { Segmentado } from '../../components/admin/metricas/piezas';
import { EmptyState, Icon, IconoColor, Skeleton, cn } from '../../components/ui';
import { useIdioma } from '../../i18n';

/* Hasta dónde mira cada «cuándo». «Todo» son 30 días: es lo que el back
   calcula de encuentros por actividad. */
const VENTANA = { hoy: 1, semana: 7, finde: 7, todo: 30 };
const QUEDAN_POCOS = 4;

const diaDe = (valor) => (valor ? formatUtcCalendarDateToString(valor) : null);

/*
 * Las actividades y, de cada una, sus encuentros de los próximos 30 días con
 * los lugares que quedan y si la persona ya está anotada (el back lo calcula
 * por fecha). Si ese pedido falla para una actividad, sus días salen de sus
 * reglas, sin cupo.
 */
const pedir = (q) => async (signal) => {
  const [actividades, tags] = await Promise.all([
    axios.get('/activities', { params: q ? { search: q } : {}, signal }).then((r) => r.data.activities ?? []),
    axios.get('/tags', { signal }).then((r) => r.data.tags ?? []).catch(() => []),
  ]);
  const hoy = hoyIso();
  const conFechas = await Promise.all(
    actividades.map((a) =>
      axios
        .get(`/inscriptions/activity/${a._id}/available-dates`, { signal })
        .then((r) =>
          (r.data.availableDates ?? []).map((d) => ({
            dia: d.fechaStr,
            hora: d.hora || horaDe(a),
            quedan: d.cuposDisponibles ?? null,
            lleno: d.tieneCupo === false,
            estado: d.estadoInscripcion ?? null,
          })),
        )
        .catch(() =>
          Array.from({ length: VENTANA.todo }, (_, i) => sumarDias(hoy, i))
            .filter((dia) => ocurreEl(a, dia))
            .map((dia) => ({ dia, hora: horaDe(a), quedan: null, lleno: false, estado: diaDe(a.fechaInscripcion) === dia ? a.estadoInscripcion : null })),
        )
        .then((fechas) => ({ ...a, fechas: fechas.filter((f) => f.dia >= hoy) })),
    ),
  );
  return { actividades: conFechas, tags };
};

/* Los días que entran en cada «cuándo»: el finde son el sábado y el domingo que vienen. */
const diasDe = (cuando, hoy) => {
  const dias = Array.from({ length: VENTANA[cuando] }, (_, i) => sumarDias(hoy, i));
  if (cuando !== 'finde') return dias;
  return dias.filter((d) => [0, 6].includes(new Date(`${d}T00:00:00Z`).getUTCDay())).slice(0, 2);
};

/* Una fila: la hora adelante, el color de la propuesta y lo que ayuda a decidir. */
const Fila = ({ a, f, color, icono, t }) => (
  <li>
    <Link
      to={`/activities/${a._id}?fecha=${f.dia}`}
      className="flex items-center gap-3 rounded-[18px] border border-transparent bg-surface p-3 transition-[border-color,transform] duration-base hover:border-surface-border active:scale-[0.99] motion-reduce:active:scale-100"
    >
      <span className="w-12 shrink-0 text-center font-grotesk text-sm font-semibold tabular-nums text-ink">{f.hora || '—'}</span>
      <IconoColor icono={icono} color={color} />
      <span className="min-w-0 flex-1">
        <span dir="auto" className="block truncate font-grotesk font-semibold text-ink">
          {a.titulo}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="tabular-nums text-ink-muted">{a.esGratuita ? t('comun.gratis') : formatActivityPrice(a)}</span>
          {f.estado === 'aceptada' && <span className="rounded-pill bg-success-50 px-2 py-0.5 font-semibold text-success-700">{t('cartelera.vas')}</span>}
          {f.estado === 'pendiente' && <span className="rounded-pill bg-warning-50 px-2 py-0.5 font-semibold text-warning-700">{t('cartelera.pendiente')}</span>}
          {f.estado === 'en_espera' && <span className="rounded-pill bg-info-50 px-2 py-0.5 font-semibold text-info-700">{t('cartelera.enEspera')}</span>}
          {!f.estado && f.lleno && <span className="rounded-pill bg-ink/[0.06] px-2 py-0.5 font-semibold text-ink-soft">{t('cartelera.lleno')}</span>}
          {!f.estado && !f.lleno && f.quedan !== null && f.quedan <= QUEDAN_POCOS && (
            <span className="rounded-pill bg-warning-50 px-2 py-0.5 font-semibold text-warning-700">{t('cartelera.quedan', { n: f.quedan })}</span>
          )}
        </span>
      </span>
      <Icon name="chevronRight" size="sm" className="shrink-0 text-ink-faint rtl:-scale-x-100" />
    </Link>
  </li>
);

/**
 * La cartelera de quien participa, como agenda de los próximos días: cada día
 * con sus encuentros, la hora adelante y lo que hace falta para decidir
 * (precio, si quedan pocos lugares, si ya va). Los viajes van arriba,
 * destacados. Se filtra por cuándo y por propuesta, y todo queda en la
 * dirección. Anotarse se hace en la actividad, con el día ya elegido.
 */
const ActivitiesList = () => {
  const { t, locale } = useIdioma();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const cuando = VENTANA[params.get('cuando')] ? params.get('cuando') : 'semana';
  const elegidas = (params.get('tags') ?? '').split(',').filter(Boolean);
  const [texto, setTexto] = useState(q);
  const buscado = useDebounce(texto.trim(), 350);

  const cambiar = (cambios) =>
    setParams(
      (prev) => {
        const sig = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(cambios)) {
          if (!v || (Array.isArray(v) && !v.length)) sig.delete(k);
          else sig.set(k, Array.isArray(v) ? v.join(',') : v);
        }
        return sig;
      },
      { replace: true },
    );

  useEffect(() => {
    if (buscado !== q) cambiar({ q: buscado });
    // La búsqueda va a la dirección (y al back) 350 ms después de la última tecla.
  }, [buscado]);

  const { datos, cargando, actualizando, error } = useCargaSuave(pedir(q), `cartelera|${q}`);

  const hoy = hoyIso();
  const tags = datos?.tags ?? [];
  const tagDe = (a) => activityPublicTags(a)[0];
  const colorDe = (a) => (tagDe(a) ? publicTagColor(tags, tagDe(a)) : DEFAULT_PUBLIC_TAG_COLOR);
  const iconoDe = (a) => (tagDe(a) && publicTagIcon(tags, tagDe(a))) || (a.tipo === 'viaje' ? 'plane' : 'activity');

  const actividades = (datos?.actividades ?? []).filter((a) => !elegidas.length || activityPublicTags(a).some((c) => elegidas.includes(c)));
  /* Las propuestas que tienen algo en la cartelera, con su color del catálogo. */
  const propuestas = [...new Set((datos?.actividades ?? []).flatMap(activityPublicTags))].sort((x, y) => x.localeCompare(y, locale));

  /* Los viajes que vienen van arriba, aparte: no se pierden entre los semanales. */
  const viajes = actividades.filter((a) => a.tipo === 'viaje' && (diaDe(a.fechaFin) ?? diaDe(a.fecha) ?? '') >= hoy);
  const dias = diasDe(cuando, hoy)
    .map((dia) => ({
      dia,
      items: actividades
        .filter((a) => a.tipo !== 'viaje')
        .flatMap((a) => a.fechas.filter((f) => f.dia === dia).map((f) => ({ a, f })))
        .sort((x, y) => String(x.f.hora).localeCompare(String(y.f.hora))),
    }))
    .filter((d) => d.items.length);

  const tituloDia = (dia) => {
    const n = diasHasta(dia, hoy);
    if (n === 0) return [t('cartelera.hoy'), fechaEn(dia, locale, { weekday: 'long', day: 'numeric' })];
    if (n === 1) return [t('cartelera.maniana'), fechaEn(dia, locale, { weekday: 'long', day: 'numeric' })];
    return [fechaEn(dia, locale, { weekday: 'long' }), fechaEn(dia, locale, { day: 'numeric', month: 'long' })];
  };
  const fechasViaje = (a) => {
    const desde = diaDe(a.fecha);
    const hasta = diaDe(a.fechaFin);
    const corto = { day: 'numeric', month: 'short' };
    return hasta && hasta !== desde ? `${fechaEn(desde, locale, corto)} – ${fechaEn(hasta, locale, corto)}` : fechaEn(desde, locale, corto);
  };

  const filtros = `${cuando}|${elegidas.join()}|${q}`;

  return (
    <PageContainer title={t('cartelera.titulo')} maxWidth="4xl">
      <BirthDatePrompt className="mb-6" />
      <DatosFaltantesPrompt className="mb-6" />

      <div className="space-y-3">
        <label className="flex min-h-[44px] items-center gap-2 rounded-pill border border-surface-border bg-surface px-4 text-ink-muted focus-within:border-ink/40">
          <Icon name="search" size="sm" />
          <input
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={t('cartelera.buscarPlaceholder')}
            aria-label={t('cartelera.buscar')}
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
          />
        </label>

        <Segmentado
          opciones={['hoy', 'semana', 'finde', 'todo'].map((v) => ({ valor: v, etiqueta: t(`cartelera.${v}`) }))}
          valor={cuando}
          onChange={(v) => cambiar({ cuando: v === 'semana' ? null : v })}
          etiqueta={t('cartelera.cuando')}
          className="flex w-full sm:inline-flex sm:w-auto [&>button]:flex-1"
        />

        {propuestas.length > 0 && (
          <div role="group" aria-label={t('cartelera.propuestas')} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {propuestas.map((n) => {
              const activo = elegidas.includes(n);
              const color = publicTagColor(tags, n) || DEFAULT_PUBLIC_TAG_COLOR;
              return (
                <button
                  key={n}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => cambiar({ tags: activo ? elegidas.filter((x) => x !== n) : [...elegidas, n] })}
                  className={cn(
                    'inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-pill border px-3 text-sm capitalize transition-colors duration-base',
                    activo ? 'border-transparent text-surface' : 'border-surface-border bg-surface text-ink-soft hover:border-ink/25',
                  )}
                  style={activo ? { background: color } : undefined}
                >
                  <Icon name={publicTagIcon(tags, n) || 'tag'} size="xs" />
                  <span dir="auto">{n}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error && !datos ? (
        <div className="mt-6 rounded-[18px] border border-surface-border bg-surface">
          <EmptyState icon="error" title={t('cartelera.sinResultados')} description={t('cartelera.sinResultadosTexto')} />
        </div>
      ) : !datos ? (
        <div className="mt-6 space-y-3" aria-hidden>
          {cargando && [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[4.5rem] rounded-[18px]" />)}
        </div>
      ) : (
        <div key={filtros} className={cn('mt-6 animate-fade-in space-y-6 transition-opacity duration-base', actualizando && 'opacity-60')}>
          {viajes.map((a) => {
            const proximo = a.fechas[0];
            const ocupado = a.cupo && proximo?.quedan !== null && proximo?.quedan !== undefined ? (a.cupo - proximo.quedan) / a.cupo : null;
            return (
              <Link key={a._id} to={`/activities/${a._id}`} className="block overflow-hidden rounded-[22px] bg-ink text-surface transition-colors duration-base hover:bg-ink/95">
                <div className="p-5">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-label text-surface/60">{t('cartelera.especial', { fechas: fechasViaje(a) })}</p>
                  <h2 dir="auto" className="mt-1 font-grotesk text-lg font-semibold">
                    {a.titulo}
                  </h2>
                  <p className="text-sm text-surface/75">
                    {a.esGratuita ? t('comun.gratis') : formatActivityPrice(a)}
                    {proximo?.estado === 'aceptada'
                      ? ` · ${t('cartelera.vas')}`
                      : proximo?.lleno
                        ? ` · ${t('cartelera.lleno')}`
                        : proximo?.quedan !== null && proximo?.quedan !== undefined
                          ? ` · ${t('cartelera.quedanLugares', { n: proximo.quedan })}`
                          : ''}
                  </p>
                  {ocupado !== null && (
                    <div className="mt-3 h-1.5 rounded-pill bg-surface/15">
                      <div className="h-1.5 rounded-pill bg-surface" style={{ width: `${Math.min(100, ocupado * 100)}%` }} />
                    </div>
                  )}
                </div>
                <span className="flex items-center justify-between border-t border-surface/15 px-5 py-3 text-sm font-semibold">
                  {t('cartelera.verViaje')}
                  <Icon name="chevronRight" size="sm" className="rtl:-scale-x-100" />
                </span>
              </Link>
            );
          })}

          {dias.length ? (
            dias.map((d) => {
              const [titulo, fecha] = tituloDia(d.dia);
              return (
                <section key={d.dia} aria-label={`${titulo} ${fecha}`}>
                  <h2 className="mb-2 flex items-baseline gap-2 px-1">
                    <span className="font-grotesk text-base font-semibold text-ink first-letter:uppercase">{titulo}</span>
                    <span className="text-sm text-ink-muted">{fecha}</span>
                  </h2>
                  <ul className="space-y-2">
                    {d.items.map(({ a, f }) => (
                      <Fila key={`${a._id}-${f.dia}`} a={a} f={f} color={colorDe(a)} icono={iconoDe(a)} t={t} />
                    ))}
                  </ul>
                </section>
              );
            })
          ) : (
            <div className="rounded-[18px] border border-dashed border-surface-border px-4 py-6 text-center text-sm text-ink-muted">
              <p>{t(q || elegidas.length ? 'cartelera.sinResultadosTexto' : 'cartelera.vacioDias')}</p>
              {cuando !== 'todo' && (
                <button type="button" onClick={() => cambiar({ cuando: 'todo' })} className="mt-2 font-semibold text-ink underline underline-offset-2">
                  {t('cartelera.verTodo')}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
};

export default ActivitiesList;
