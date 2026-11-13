import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import useCargaSuave from '../../hooks/useCargaSuave';
import { activityPublicTags, publicTagColor, publicTagIcon, userPublicTags, DEFAULT_PUBLIC_TAG_COLOR } from '../../utils/tagFields';
import { formatActivityPrice } from '../../utils/priceUtils';
import { buildGoogleCalendarTemplateUrl } from '../../utils/googleCalendarActivityUrl';
import { diasHasta, fechaEn, hoyIso, horaDe, inscripcionesVigentes, ocurreEl, sumarDias } from '../../utils/participante';
import PageContainer from '../../components/layout/PageContainer';
import { Button, Icon, IconoColor, Skeleton, cn } from '../../components/ui';
import { useIdioma } from '../../i18n';

const DIAS_A_MOSTRAR = 7;

/* Lo que necesita el inicio, en un solo pedido que no parpadea. */
const pedir = (signal) =>
  Promise.all([
    axios.get('/activities', { signal }).then((r) => r.data.activities ?? []),
    axios.get('/inscriptions/my', { signal }).then((r) => r.data.inscriptions ?? []),
    axios.get('/tags', { signal }).then((r) => r.data.tags ?? []).catch(() => []),
    axios.get('/me/resumen', { signal }).then((r) => r.data).catch(() => null),
  ]).then(([actividades, inscripciones, tags, resumen]) => ({ actividades, inscripciones, tags, resumen }));

/**
 * El inicio de quien participa: lo próximo que tiene (con cómo llegar y el
 * calendario a mano), los próximos días por día y lo que le puede gustar
 * según sus intereses. Pensado primero para el celular.
 */
const Inicio = () => {
  const { user } = useAuth();
  const { t, locale } = useIdioma();
  const hoy = hoyIso();
  const [dia, setDia] = useState(hoy);
  const { datos } = useCargaSuave(pedir, 'inicio');

  const tags = datos?.tags ?? [];
  const tagDe = (a) => activityPublicTags(a)[0];
  const colorDe = (a) => (tagDe(a) ? publicTagColor(tags, tagDe(a)) : DEFAULT_PUBLIC_TAG_COLOR);
  const iconoDe = (a) => (tagDe(a) && publicTagIcon(tags, tagDe(a))) || 'activity';
  const cuando = (iso) => {
    const n = diasHasta(iso, hoy);
    return n === 0 ? t('inicio.hoy') : n === 1 ? t('inicio.maniana') : t('inicio.enDias', { dias: n });
  };

  const actividades = datos?.actividades ?? [];
  const vigentes = inscripcionesVigentes(datos?.inscripciones).filter((i) => i.dia >= hoy).sort((a, b) => a.dia.localeCompare(b.dia));
  const proxima = vigentes[0];
  const actividadProxima = proxima && (actividades.find((a) => a._id === proxima.activityId._id) ?? proxima.activityId);
  const voyEl = (a, iso) => vigentes.some((i) => i.activityId._id === a._id && i.dia === iso);

  const dias = Array.from({ length: DIAS_A_MOSTRAR }, (_, i) => sumarDias(hoy, i));
  const delDia = (iso) => actividades.filter((a) => ocurreEl(a, iso)).sort((a, b) => horaDe(a).localeCompare(horaDe(b)));
  const elegido = delDia(dia);

  const intereses = userPublicTags(user);
  const paraVos = actividades
    .filter((a) => activityPublicTags(a).some((c) => intereses.includes(c)) && !vigentes.some((i) => i.activityId._id === a._id))
    .slice(0, 8);

  return (
    <PageContainer maxWidth="4xl">
      <div className="space-y-8">
        <header>
          <p className="text-sm text-ink-muted first-letter:uppercase">{fechaEn(hoy, locale, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="font-grotesk text-[1.8rem] font-semibold tracking-tight text-ink sm:text-[2.2rem]">{t('inicio.hola', { nombre: user?.nombre ?? '' })}</h1>
          {datos?.resumen?.veces > 0 && (
            <p className="mt-1 text-ink-soft">{t(datos.resumen.veces === 1 ? 'inicio.vinisteUna' : 'inicio.viniste', { veces: datos.resumen.veces })}</p>
          )}
        </header>

        {/* Lo próximo que tiene: lo primero que quiere saber al abrir. */}
        {!datos ? (
          <Skeleton className="h-44 rounded-[22px]" />
        ) : proxima ? (
          <section className="animate-fade-in overflow-hidden rounded-[22px] bg-ink text-surface" aria-labelledby="tu-proxima">
            <Link to={`/activities/${proxima.activityId._id}`} className="block p-5 transition-colors duration-base hover:bg-surface/[0.04] sm:p-6">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-label text-surface/70">
                <span className="h-2 w-2 rounded-pill" style={{ background: colorDe(proxima.activityId) }} />
                {t('inicio.tuProxima', { cuando: cuando(proxima.dia) })}
              </p>
              <h2 id="tu-proxima" dir="auto" className="mt-1 font-grotesk text-xl font-semibold sm:text-2xl">
                {proxima.activityId.titulo}
              </h2>
              <p className="text-sm text-surface/80">
                <span className="inline-block first-letter:uppercase">{fechaEn(proxima.dia, locale, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                {(proxima.hora || horaDe(actividadProxima)) && ` · ${proxima.hora || horaDe(actividadProxima)}`}
                {actividadProxima?.lugar && <span dir="auto">{` · ${actividadProxima.lugar}`}</span>}
              </p>
              {proxima.estado !== 'aceptada' && (
                <span className="mt-3 inline-flex rounded-pill bg-surface/15 px-2.5 py-0.5 text-xs font-semibold">{t(`estadoInscripcion.largo.${proxima.estado}`)}</span>
              )}
            </Link>
            <div className="flex border-t border-surface/15">
              <a
                href={buildGoogleCalendarTemplateUrl(actividadProxima, { fecha: proxima.dia, hora: proxima.hora || horaDe(actividadProxima) }) || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[48px] flex-1 items-center justify-center gap-2 text-sm font-semibold transition-colors duration-base hover:bg-surface/[0.06]"
              >
                <Icon name="addToCalendar" size="sm" />
                {t('inicio.calendario')}
              </a>
              {actividadProxima?.ubicacionOnline && (
                <a
                  href={actividadProxima.ubicacionOnline}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[48px] flex-1 items-center justify-center gap-2 border-s border-surface/15 text-sm font-semibold transition-colors duration-base hover:bg-surface/[0.06]"
                >
                  <Icon name="location" size="sm" />
                  {t('inicio.comoLlegar')}
                </a>
              )}
            </div>
          </section>
        ) : (
          <section className="animate-fade-in rounded-[22px] border border-dashed border-surface-border p-5 sm:p-6">
            <h2 className="font-grotesk text-lg font-semibold text-ink">{t('inicio.sinProxima')}</h2>
            <p className="mt-1 text-ink-soft">{t('inicio.sinProximaTexto')}</p>
            <Button size="sm" className="mt-4" icon="activity" to="/activities">
              {t('inicio.verCartelera')}
            </Button>
          </section>
        )}

        <section aria-labelledby="proximos-dias">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="proximos-dias" className="font-grotesk text-lg font-semibold text-ink">
              {t('inicio.semana')}
            </h2>
            <Link to="/activities" className="text-sm font-medium text-ink-muted hover:text-ink">
              {t('inicio.verCartelera')}
            </Link>
          </div>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2" role="tablist" aria-label={t('inicio.semana')}>
            {dias.map((iso) => {
              const hay = delDia(iso);
              const activo = iso === dia;
              return (
                <button
                  key={iso}
                  type="button"
                  role="tab"
                  aria-selected={activo}
                  onClick={() => setDia(iso)}
                  className={cn(
                    'flex min-w-0 flex-col items-center rounded-[14px] py-2 transition-colors duration-base',
                    activo ? 'bg-ink text-surface' : 'bg-surface text-ink-soft hover:bg-ink/[0.04]',
                  )}
                >
                  <span className="text-[0.7rem] font-medium opacity-70">{fechaEn(iso, locale, { weekday: 'short' })}</span>
                  <span className="font-grotesk text-lg font-semibold tabular-nums">{Number(iso.slice(8, 10))}</span>
                  <span className="mt-1 flex h-1.5 gap-0.5" aria-hidden>
                    {hay.slice(0, 3).map((a) => (
                      <span key={a._id} className="h-1.5 w-1.5 rounded-pill" style={{ background: activo ? 'currentColor' : colorDe(a) }} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
          {!datos ? (
            <Skeleton className="mt-4 h-20 rounded-[18px]" />
          ) : (
            <ul key={dia} className="mt-4 animate-fade-in space-y-3" role="tabpanel">
              {elegido.length ? (
                elegido.map((a) => {
                  const voy = voyEl(a, dia);
                  return (
                    <li key={a._id} className="flex items-center gap-3 rounded-[18px] bg-surface p-3.5">
                      <IconoColor icono={iconoDe(a)} color={colorDe(a)} />
                      <Link to={`/activities/${a._id}?fecha=${dia}`} className="min-w-0 flex-1">
                        <span dir="auto" className="block truncate font-grotesk font-semibold text-ink">
                          {a.titulo}
                        </span>
                        <span className="block text-sm text-ink-muted">
                          {[horaDe(a), a.esGratuita ? t('comun.gratis') : formatActivityPrice(a)].filter(Boolean).join(' · ')}
                        </span>
                      </Link>
                      {voy ? (
                        <span className="inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-pill bg-success-50 px-3 text-sm font-semibold text-success-700">
                          <Icon name="check" size="xs" />
                          {t('inicio.vas')}
                        </span>
                      ) : (
                        <Button size="sm" to={`/activities/${a._id}?fecha=${dia}`}>
                          {t('inicio.anotarme')}
                        </Button>
                      )}
                    </li>
                  );
                })
              ) : (
                <li className="rounded-[18px] border border-dashed border-surface-border px-4 py-6 text-center text-sm text-ink-muted">{t('inicio.diaLibre')}</li>
              )}
            </ul>
          )}
        </section>

        <section aria-labelledby="para-vos">
          <h2 id="para-vos" className="font-grotesk text-lg font-semibold text-ink">
            {t('inicio.paraVos')}
          </h2>
          {intereses.length === 0 ? (
            <div className="mt-3 rounded-[18px] border border-dashed border-surface-border p-4">
              <p className="text-sm text-ink-soft">{t('inicio.sinIntereses')}</p>
              <Button size="sm" variant="soft" className="mt-3" icon="tag" to="/my-profile#intereses">
                {t('inicio.elegirIntereses')}
              </Button>
            </div>
          ) : (
            <>
              <p className="mb-3 text-sm text-ink-muted">{t('inicio.porque', { temas: intereses.slice(0, 3).join(', ') })}</p>
              {datos && paraVos.length === 0 ? (
                <p className="rounded-[18px] border border-dashed border-surface-border px-4 py-5 text-sm text-ink-muted">{t('inicio.paraVosVacio')}</p>
              ) : (
                <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
                  {paraVos.map((a) => (
                    <Link
                      key={a._id}
                      to={`/activities/${a._id}`}
                      className="w-60 shrink-0 snap-start overflow-hidden rounded-[20px] border border-surface-border bg-surface transition-shadow duration-base hover:shadow-card sm:w-auto"
                    >
                      <span className="flex h-16 items-end p-3" style={{ background: `${colorDe(a)}1f` }}>
                        <IconoColor icono={iconoDe(a)} color={colorDe(a)} tamano="sm" />
                      </span>
                      <span className="block p-3.5">
                        <span dir="auto" className="block font-grotesk font-semibold leading-snug text-ink">
                          {a.titulo}
                        </span>
                        <span className="mt-0.5 block text-sm text-ink-muted first-letter:uppercase">
                          {fechaEn(String(a.proximaOcurrencia ?? a.fecha ?? '').slice(0, 10), locale)}
                          {horaDe(a) ? ` · ${horaDe(a)}` : ''}
                        </span>
                        <span className="mt-2 block text-sm font-semibold text-ink">{a.esGratuita ? t('comun.gratis') : formatActivityPrice(a)}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </PageContainer>
  );
};

export default Inicio;
