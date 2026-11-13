import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { formatUtcCalendarDateToString } from '../../utils/dateUtils';
import { buildGoogleCalendarTemplateUrl } from '../../utils/googleCalendarActivityUrl';
import { postInscription } from '../../utils/paymentUtils';
import { formatActivityPrice } from '../../utils/priceUtils';
import { activityPublicTags, publicTagColor, publicTagIcon, DEFAULT_PUBLIC_TAG_COLOR } from '../../utils/tagFields';
import { fechaEn, horaDe } from '../../utils/participante';
import ActivityDescription from '../../components/activities/ActivityDescription';
import ActivityTags from '../../components/activities/ActivityTags';
import InscriptionStatusBadge from '../../components/activities/InscriptionStatusBadge';
import LoadingScreen from '../../components/layout/LoadingScreen';
import PageContainer from '../../components/layout/PageContainer';
import InscriptionConfirmModal from '../../components/activities/InscriptionConfirmModal';
import { Button, EmptyState, Icon, IconoColor, Modal, Skeleton, cn } from '../../components/ui';
import { useIdioma } from '../../i18n';

const VISIBLES = 6;
const POCOS_LUGARES = 4;

/**
 * El detalle de una actividad. Se anota en un paso: se elige el día (en las
 * recurrentes, tocando la fila) y el botón de abajo, al alcance del pulgar,
 * hace la inscripción. Las pagas siguen pasando por la confirmación con el
 * comprobante (o el WhatsApp, en los viajes).
 */
const ActivityDetail = () => {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { t, idioma, locale } = useIdioma();

  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableDates, setAvailableDates] = useState([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [verTodas, setVerTodas] = useState(false);
  const [elegida, setElegida] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showCancelPolicyModal, setShowCancelPolicyModal] = useState(false);
  const [publicTagCatalog, setPublicTagCatalog] = useState([]);
  const [comprobanteFile, setComprobanteFile] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(null); // { estado, fecha, hora } tras anotarse

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get('/tags');
        if (!cancelled) setPublicTagCatalog(res.data.tags || []);
      } catch (e) {
        console.error('Error loading tag catalog:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [id]);

  const fetchActivity = async ({ silencioso = false } = {}) => {
    try {
      if (!silencioso) setLoading(true);
      const response = await axios.get(`/activities/${id}`);
      const fetched = response.data.activity;
      setActivity(fetched);

      if (fetched.tipo === 'recurrente') {
        setLoadingDates(true);
        try {
          const datesRes = await axios.get(`/inscriptions/activity/${id}/available-dates`);
          setAvailableDates(datesRes.data.availableDates || []);
        } catch (error) {
          console.error('Error fetching available dates:', error);
          showError(t('cartelera.errorFechas'));
        } finally {
          setLoadingDates(false);
        }
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
      showError(error.response?.data?.message || t('detalle.errorCarga'));
      navigate('/activities');
    } finally {
      setLoading(false);
    }
  };

  /* El día elegido: el que vino en la dirección (desde el inicio) o el primero
     al que todavía se puede anotar. */
  const diaDe = (d) => formatUtcCalendarDateToString(d.fecha);
  useEffect(() => {
    if (!availableDates.length) return;
    setElegida((actual) => {
      if (actual && availableDates.some((d) => diaDe(d) === actual)) return actual;
      const pedido = params.get('fecha');
      if (pedido && availableDates.some((d) => diaDe(d) === pedido)) return pedido;
      return diaDe(availableDates.find((d) => !d.estadoInscripcion && d.tieneCupo) ?? availableDates[0]);
    });
  }, [availableDates]);

  if (loading) {
    return <LoadingScreen message={t('detalle.cargando')} />;
  }
  if (!activity) return null;

  const esRecurrente = activity.tipo === 'recurrente';
  const esViaje = activity.tipo === 'viaje';
  const tag = activityPublicTags(activity)[0];
  const color = tag ? publicTagColor(publicTagCatalog, tag) : DEFAULT_PUBLIC_TAG_COLOR;
  const icono = (tag && publicTagIcon(publicTagCatalog, tag)) || (esViaje ? 'plane' : 'activity');
  const precio = activity.esGratuita ? t('comun.gratis') : formatActivityPrice(activity);

  /* La fecha a la que apunta el botón de abajo. */
  const opcion = esRecurrente
    ? availableDates.find((d) => diaDe(d) === elegida) ?? null
    : activity.fecha
      ? {
          fecha: activity.fecha,
          fechaStr: formatUtcCalendarDateToString(activity.fecha),
          hora: activity.hora,
          estadoInscripcion: activity.estadoInscripcion,
          tieneCupo: true,
        }
      : null;
  const diaOpcion = opcion ? opcion.fechaStr ?? diaDe(opcion) : null;
  const diaTexto = diaOpcion ? fechaEn(diaOpcion, locale, { weekday: 'short', day: 'numeric', month: 'short' }) : '';
  const lleno = opcion && !opcion.tieneCupo;

  const handleInscribe = async (fecha, file = null) => {
    setEnviando(true);
    try {
      const response = await postInscription(axios, {
        activityId: activity._id,
        fecha,
        comprobanteFile: file,
        esGratuita: activity.esGratuita,
        tipo: activity.tipo,
      });
      // El mensaje del back está en castellano: en otro idioma va el propio.
      showSuccess((idioma === 'es' && response.data.message) || t('cartelera.inscripcionOk'));
      setListo({ estado: response.data.inscription?.estado ?? 'aceptada', fecha, hora: opcion?.hora ?? horaDe(activity) });
      setShowConfirmModal(false);
      setSelectedDate(null);
      setComprobanteFile(null);
      await fetchActivity({ silencioso: true });
    } catch (error) {
      showError(error.response?.data?.message || t('cartelera.inscripcionError'));
    } finally {
      setEnviando(false);
    }
  };

  /* Un paso: gratis se anota directo; pago (o viaje) confirma con el
     comprobante o la coordinación por WhatsApp. */
  const anotarme = () => {
    if (!opcion) return;
    const fecha = diaOpcion;
    if (activity.esGratuita) {
      handleInscribe(fecha);
      return;
    }
    setSelectedDate({ fecha: opcion.fecha, fechaStr: fecha, hora: opcion.hora ?? activity.hora });
    setComprobanteFile(null);
    setShowConfirmModal(true);
  };

  const handleConfirmInscription = () => {
    if (!selectedDate) return;
    if (!activity.esGratuita && !esViaje && !comprobanteFile) {
      showError(t('cartelera.faltaComprobante'));
      return;
    }
    handleInscribe(selectedDate.fechaStr, comprobanteFile);
  };

  /* Las recurrentes agendan el día elegido; las únicas y los viajes, su propia fecha (el viaje, de punta a punta). */
  const linkCalendario = (fecha, hora) => buildGoogleCalendarTemplateUrl(activity, esRecurrente ? { fecha, hora } : null);

  const cuandoTexto = esRecurrente
    ? horaDe(activity)
    : activity.fecha
      ? `${fechaEn(formatUtcCalendarDateToString(activity.fecha), locale)}${esViaje && activity.fechaFin ? ` → ${fechaEn(formatUtcCalendarDateToString(activity.fechaFin), locale)}` : ''}`
      : '';
  const datos = [
    { icono: esRecurrente ? 'time' : 'activity', valor: cuandoTexto || '—', detalle: esRecurrente ? t('detalle.cadaSemana') : activity.hora || (activity.duracion ? t('info.minutos', { minutos: activity.duracion }) : '') },
    { icono: 'location', valor: activity.lugar || 'Malka', detalle: activity.ubicacionOnline ? t('cartelera.comoLlego') : '', href: activity.ubicacionOnline },
    { icono: 'payment', valor: precio, detalle: activity.esGratuita ? '' : esRecurrente ? t('detalle.porEncuentro') : '' },
  ];

  const fechasVisibles = verTodas ? availableDates : availableDates.slice(0, VISIBLES);
  const yaAnotada = opcion?.estadoInscripcion;

  return (
    <PageContainer maxWidth="3xl">
      <Button variant="link" size="sm" icon="back" to="/activities" className="mb-4 min-h-0 px-0 rtl:[&_svg]:-scale-x-100">
        {t('detalle.volver')}
      </Button>

      {activity.fotos?.length > 0 ? (
        <div className={cn('mb-5 grid gap-3', activity.fotos.length > 1 && 'md:grid-cols-2')}>
          {activity.fotos.map((foto, index) => (
            <img key={index} src={foto} alt={`${activity.titulo} - ${index + 1}`} className="h-56 w-full rounded-[22px] object-cover sm:h-64" />
          ))}
        </div>
      ) : (
        <div aria-hidden="true" className="mb-5 flex h-36 items-end justify-end rounded-[22px] p-5" style={{ background: `${color}24` }}>
          <IconoColor icono={icono} color={color} tamano="lg" />
        </div>
      )}

      <h1 dir="auto" className="font-grotesk text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        {activity.titulo}
      </h1>
      <div className="mt-2">
        <ActivityDescription activity={activity} variant="detail" />
      </div>
      <ActivityTags activity={activity} catalog={publicTagCatalog} variant="detail" />

      <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
        {datos.map((d) => {
          const contenido = (
            <>
              <Icon name={d.icono} size="sm" className="mx-auto text-ink-muted" />
              <dd dir="auto" className="mt-1 break-words font-grotesk text-sm font-semibold text-ink">
                {d.valor}
              </dd>
              {d.detalle && <dt className={cn('text-xs', d.href ? 'font-medium text-primary' : 'text-ink-muted')}>{d.detalle}</dt>}
            </>
          );
          return d.href ? (
            <a key={d.icono} href={d.href} target="_blank" rel="noopener noreferrer" className="rounded-[16px] bg-surface px-2 py-3 transition-colors duration-base hover:bg-ink/[0.03]">
              {contenido}
            </a>
          ) : (
            <div key={d.icono} className="rounded-[16px] bg-surface px-2 py-3">
              {contenido}
            </div>
          );
        })}
      </dl>

      {esRecurrente && (
        <section className="mt-7" aria-labelledby="elegi-el-dia">
          <h2 id="elegi-el-dia" className="mb-3 font-grotesk text-lg font-semibold text-ink">
            {t('detalle.elegiDia')}
          </h2>
          {loadingDates && !availableDates.length ? (
            <Skeleton className="h-40 rounded-[16px]" />
          ) : availableDates.length === 0 ? (
            <EmptyState icon="activity" title={t('fechas.sinFechas')} description={t('fechas.sinFechasTexto')} />
          ) : (
            <div className="space-y-2" role="radiogroup" aria-labelledby="elegi-el-dia">
              {fechasVisibles.map((d) => {
                const dia = diaDe(d);
                const activa = dia === elegida;
                const cupos = d.cuposDisponibles;
                return (
                  <button
                    key={dia}
                    type="button"
                    role="radio"
                    aria-checked={activa}
                    onClick={() => {
                      setElegida(dia);
                      setListo(null);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-[16px] border px-4 py-3 text-start transition-colors duration-base',
                      activa ? 'border-ink bg-surface' : 'border-transparent bg-surface/70 hover:bg-surface',
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block font-grotesk font-semibold text-ink first-letter:uppercase">{fechaEn(dia, locale, { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                      {d.hora && <span className="text-sm text-ink-muted">{d.hora}</span>}
                    </span>
                    <span className="shrink-0 text-end text-sm">
                      {d.estadoInscripcion ? (
                        <span className="font-semibold text-success-700">{t(`estadoInscripcion.largo.${d.estadoInscripcion}`)}</span>
                      ) : !d.tieneCupo ? (
                        <span className="text-ink-muted">{t('detalle.lleno')}</span>
                      ) : cupos === null || cupos === undefined ? (
                        <span className="text-ink-muted">{t('fechas.sinLimite')}</span>
                      ) : (
                        <span className={cn(cupos <= POCOS_LUGARES ? 'font-semibold text-warning-700' : 'text-ink-muted')}>
                          {t(cupos <= POCOS_LUGARES ? 'detalle.quedan' : 'detalle.lugares', { cupos })}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
              {availableDates.length > VISIBLES && (
                <Button variant="ghost" size="sm" onClick={() => setVerTodas((v) => !v)} icon={verTodas ? 'chevronUp' : 'chevronDown'}>
                  {verTodas ? t('detalle.verMenos') : t('detalle.masFechas', { cantidad: availableDates.length - VISIBLES })}
                </Button>
              )}
            </div>
          )}
        </section>
      )}

      {activity.politicaCancelacion && (
        <Button variant="ghost" size="sm" icon="policy" className="mt-5" onClick={() => setShowCancelPolicyModal(true)}>
          {t('detalle.politica')}
        </Button>
      )}

      {/* Anotarse en un paso: la barra queda abajo, al alcance del pulgar
          (arriba de la barra de pestañas en el celular). */}
      {opcion && (
        <div className="sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 -mx-4 mt-8 border-t border-surface-border bg-surface-page/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-[18px] sm:border lg:bottom-4">
          {listo && listo.fecha === diaOpcion ? (
            <div className="flex animate-fade-in-up items-center gap-3">
              <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-pill', listo.estado === 'aceptada' ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700')}>
                <Icon name={listo.estado === 'aceptada' ? 'check' : 'time'} size="sm" />
              </span>
              <span className="min-w-0 flex-1 text-sm">
                <span className="block font-semibold text-ink">{t(`detalle.listo.${listo.estado}`, { dia: diaTexto })}</span>
                <span className="text-ink-muted">{t('detalle.listoTexto')}</span>
              </span>
              <Button size="sm" variant="soft" icon="addToCalendar" href={linkCalendario(listo.fecha, listo.hora) || undefined} target="_blank" rel="noopener noreferrer">
                {t('detalle.agendar')}
              </Button>
            </div>
          ) : yaAnotada ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <InscriptionStatusBadge estado={yaAnotada} />
              <span className="flex gap-2">
                <Button size="sm" variant="soft" icon="addToCalendar" href={linkCalendario(diaOpcion, opcion.hora) || undefined} target="_blank" rel="noopener noreferrer">
                  {t('detalle.agendar')}
                </Button>
                <Button size="sm" variant="secondary" to="/my-inscriptions">
                  {t('detalle.verMisCosas')}
                </Button>
              </span>
            </div>
          ) : (
            <Button fullWidth icon={lleno ? 'time' : 'check'} loading={enviando} onClick={anotarme}>
              {lleno ? t('detalle.sumarmeEspera', { dia: diaTexto }) : t('detalle.anotarmeAl', { dia: diaTexto, precio })}
            </Button>
          )}
        </div>
      )}

      <Modal
        open={showCancelPolicyModal}
        onClose={() => setShowCancelPolicyModal(false)}
        title={t('detalle.politica')}
        footer={<Button onClick={() => setShowCancelPolicyModal(false)}>{t('comun.cerrar')}</Button>}
      >
        <p dir="auto" className="whitespace-pre-wrap leading-relaxed text-ink-soft">
          {activity.politicaCancelacion}
        </p>
      </Modal>

      {showConfirmModal && selectedDate && (
        <InscriptionConfirmModal
          activity={activity}
          selectedDate={selectedDate}
          onComprobanteChange={setComprobanteFile}
          onConfirm={handleConfirmInscription}
          onAddToCalendar={() => {
            const url = linkCalendario(selectedDate.fechaStr, selectedDate.hora);
            if (url) window.open(url, '_blank');
          }}
          onClose={() => {
            setShowConfirmModal(false);
            setSelectedDate(null);
            setComprobanteFile(null);
          }}
        />
      )}
    </PageContainer>
  );
};

export default ActivityDetail;
