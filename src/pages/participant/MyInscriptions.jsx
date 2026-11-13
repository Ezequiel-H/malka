import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import useCargaSuave from '../../hooks/useCargaSuave';
import { getPagoEstadoLabel, getPagoEstadoTone, putComprobante } from '../../utils/paymentUtils';
import { activityPublicTags, publicTagColor, DEFAULT_PUBLIC_TAG_COLOR } from '../../utils/tagFields';
import { diasHasta, fechaEn, hoyIso } from '../../utils/participante';
import { formatUtcCalendarDateToString } from '../../utils/dateUtils';
import PageContainer from '../../components/layout/PageContainer';
import { Badge, Button, EmptyState, FileInput, Icon, Skeleton, cn, useConfirm } from '../../components/ui';
import { useIdioma } from '../../i18n';

const TONOS = {
  aceptada: 'bg-success-50 text-success-700',
  pendiente: 'bg-warning-50 text-warning-700',
  en_espera: 'bg-info-50 text-info-700',
};

const pedir = (signal) =>
  Promise.all([
    axios.get('/inscriptions/my', { signal }).then((r) => r.data.inscriptions ?? []),
    axios.get('/me/resumen', { signal }).then((r) => r.data).catch(() => null),
    axios.get('/tags', { signal }).then((r) => r.data.tags ?? []).catch(() => []),
  ]).then(([inscripciones, resumen, tags]) => ({ inscripciones, resumen, tags }));

/**
 * «Mis cosas»: cuántas veces vino este año y lo que viene, como una línea de
 * tiempo con su estado. Lo que ya pasó no se lista (sólo cuenta en el número).
 */
const MyInscriptions = () => {
  const { showSuccess, showError } = useToast();
  const { t, idioma, locale } = useIdioma();
  const confirm = useConfirm();
  const { datos, cargando, recargar } = useCargaSuave(pedir, 'mis-cosas');
  const [subiendoId, setSubiendoId] = useState(null);
  const [archivo, setArchivo] = useState(null);

  const hoy = hoyIso();
  const conDia = (datos?.inscripciones ?? [])
    .filter((i) => i.fecha)
    .map((i) => ({ ...i, dia: formatUtcCalendarDateToString(i.fecha) }))
    .filter((i) => i.dia >= hoy)
    .sort((a, b) => a.dia.localeCompare(b.dia));
  const proximas = conDia.filter((i) => i.estado !== 'cancelada');
  const canceladas = conDia.filter((i) => i.estado === 'cancelada' && i.activityId);
  const tags = datos?.tags ?? [];
  const colorDe = (a) => {
    const tag = a && activityPublicTags(a)[0];
    return tag ? publicTagColor(tags, tag) : DEFAULT_PUBLIC_TAG_COLOR;
  };
  const cuando = (dia) => {
    const n = diasHasta(dia, hoy);
    return n === 0 ? t('inicio.hoy') : n === 1 ? t('inicio.maniana') : n < 7 ? t('inicio.enDias', { dias: n }) : null;
  };

  const cancelar = async (inscription) => {
    const titulo = inscription.activityId?.titulo;
    const ok = await confirm({
      title: titulo ? t('misInscripciones.cancelarTitulo', { titulo }) : t('misInscripciones.cancelarEsta'),
      description: t('misInscripciones.cancelarTexto'),
      confirmLabel: t('misInscripciones.cancelarInscripcion'),
      cancelLabel: t('comun.volver'),
    });
    if (!ok) return;
    try {
      await axios.put(`/inscriptions/${inscription._id}/cancel`);
      showSuccess(t('misInscripciones.cancelada'));
      recargar();
    } catch (error) {
      showError(error.response?.data?.message || t('misInscripciones.errorCancelar'));
    }
  };

  const subir = async (inscriptionId) => {
    if (!archivo) {
      showError(t('misInscripciones.elegiComprobante'));
      return;
    }
    try {
      const response = await putComprobante(axios, inscriptionId, archivo);
      showSuccess((idioma === 'es' && response.data.message) || t('misInscripciones.comprobanteOk'));
      setSubiendoId(null);
      setArchivo(null);
      recargar();
    } catch (error) {
      showError(error.response?.data?.message || t('misInscripciones.errorComprobante'));
    }
  };

  const veces = datos?.resumen?.veces;

  return (
    <PageContainer title={t('misCosas.titulo')} maxWidth="3xl">
      <div className="space-y-8">
        {/* Cuánto viene, para que se vea parte. Sólo el número. */}
        <section className="flex items-center gap-4 rounded-[22px] border border-surface-border bg-surface p-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-pill bg-primary-600/[0.12] text-primary-800">
            <Icon name="heart" />
          </span>
          {datos ? (
            <span className="animate-fade-in">
              <span className="block font-grotesk text-3xl font-semibold tabular-nums text-ink">
                {veces ?? '—'} <span className="text-base font-medium text-ink-muted">{t(veces === 1 ? 'misCosas.vez' : 'misCosas.veces')}</span>
              </span>
              <span className="text-sm text-ink-muted">{t('misCosas.vinisteAnio', { anio: datos.resumen?.anio ?? new Date().getFullYear() })}</span>
            </span>
          ) : (
            <Skeleton className="h-12 w-40" />
          )}
        </section>

        <section aria-labelledby="proximas">
          <h2 id="proximas" className="mb-3 font-grotesk text-lg font-semibold text-ink">
            {t('misCosas.proximas')}
          </h2>
          {cargando || !datos ? (
            <Skeleton className="h-40 rounded-[18px]" />
          ) : proximas.length === 0 ? (
            <div className="rounded-[18px] border border-surface-border bg-surface">
              <EmptyState
                icon="activity"
                title={t('misInscripciones.vacioTitulo')}
                description={t('misInscripciones.vacioTexto')}
                action={
                  <Button to="/activities" icon="activity" size="sm">
                    {t('misInscripciones.verActividades')}
                  </Button>
                }
              />
            </div>
          ) : (
            <ol className="relative animate-fade-in space-y-3 ps-6 before:absolute before:bottom-3 before:start-[7px] before:top-3 before:w-px before:bg-surface-border">
              {proximas.map((i) => {
                const a = i.activityId;
                const hora = i.hora || a?.hora || '';
                const pago = i.pago?.comprobante?.url ? i.pago.estadoPago : null;
                const pronto = cuando(i.dia);
                return (
                  <li key={i._id} className="relative">
                    <span className="absolute -start-6 top-5 h-3.5 w-3.5 rounded-pill ring-4 ring-surface-page" style={{ background: colorDe(a) }} aria-hidden />
                    <div className="rounded-[18px] border border-surface-border bg-surface p-4">
                      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                        <span className="min-w-0">
                          {a ? (
                            <Link to={`/activities/${a._id}`} dir="auto" className="block font-grotesk font-semibold text-ink hover:underline">
                              {a.titulo}
                            </Link>
                          ) : (
                            <span className="block font-grotesk font-semibold text-ink-muted">{t('misInscripciones.eliminada')}</span>
                          )}
                          <span className="text-sm text-ink-muted">
                            <span className="inline-block first-letter:uppercase">{fechaEn(i.dia, locale, { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                            {hora && ` · ${hora}`}
                            {pronto && ` · ${pronto}`}
                          </span>
                        </span>
                        <span className={cn('shrink-0 rounded-pill px-2.5 py-0.5 text-xs font-semibold', TONOS[i.estado])}>{t(`estadoInscripcion.largo.${i.estado}`)}</span>
                      </div>

                      {pago && (
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
                          <Badge tone={getPagoEstadoTone(pago)} dot>
                            {getPagoEstadoLabel(pago)}
                          </Badge>
                          {pago === 'rechazado' && i.pago.motivoRechazo && <span className="text-danger-600">{t('misInscripciones.motivo', { motivo: i.pago.motivoRechazo })}</span>}
                          {pago === 'pendiente' && i.estado === 'pendiente' && <span>{t('misInscripciones.enRevision')}</span>}
                        </div>
                      )}

                      {subiendoId === i._id ? (
                        <div className="mt-3 space-y-2">
                          <FileInput accept="image/*,application/pdf" value={archivo} onChange={setArchivo} maxSize={5 * 1024 * 1024} hint={t('confirmar.comprobanteAyuda')} />
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" icon="upload" onClick={() => subir(i._id)}>
                              {t('misInscripciones.enviarComprobante')}
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setSubiendoId(null);
                                setArchivo(null);
                              }}
                            >
                              {t('comun.cancelar')}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {pago === 'rechazado' && (
                            <Button
                              size="sm"
                              icon="upload"
                              onClick={() => {
                                setSubiendoId(i._id);
                                setArchivo(null);
                              }}
                            >
                              {t('misCosas.subirComprobante')}
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" icon="close" onClick={() => cancelar(i)} className="text-danger-600 hover:bg-danger-50 hover:text-danger-700">
                            {t('misInscripciones.cancelarInscripcion')}
                          </Button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {canceladas.length > 0 && (
          <section aria-labelledby="canceladas">
            <h2 id="canceladas" className="mb-3 text-sm font-semibold uppercase tracking-label text-ink-muted">
              {t('misInscripciones.grupos.cancelada')}
            </h2>
            <ul className="divide-y divide-surface-border rounded-[18px] border border-surface-border bg-surface">
              {canceladas.map((i) => (
                <li key={i._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <span className="min-w-0">
                    <span dir="auto" className="block text-sm font-semibold text-ink-soft">
                      {i.activityId.titulo}
                    </span>
                    <span className="text-xs text-ink-muted first-letter:uppercase">{fechaEn(i.dia, locale, { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                  </span>
                  <Button size="sm" variant="soft" to={`/activities/${i.activityId._id}?fecha=${i.dia}`}>
                    {t('misInscripciones.deNuevo')}
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </PageContainer>
  );
};

export default MyInscriptions;
