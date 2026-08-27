import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import {
  formatDateEsAR,
  formatLocalDateToString,
  formatUtcCalendarDateToString,
  formatUtcCalendarDayAndTime,
} from '../../utils/dateUtils';
import { buildGoogleCalendarTemplateUrl } from '../../utils/googleCalendarActivityUrl';
import { getPagoEstadoLabel, getPagoEstadoTone } from '../../utils/paymentUtils';
import LoadingScreen from '../../components/layout/LoadingScreen';
import PageContainer from '../../components/layout/PageContainer';
import PendingPaymentProofsModal from '../../components/admin/PendingPaymentProofsModal';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Icon,
  ImageLightbox,
  Modal,
  Select,
  useConfirm,
} from '../../components/ui';
import { renderPlantilla, plantillaContext, buildWaLink } from '../../utils/whatsapp';
import { formatActivityPrice, formatPrice } from '../../utils/priceUtils';

const GMAIL_INVITE_BODY_MAX = 7500;

/** Día concreto para el enlace «Agregar a calendario» (única = actividad; recurrente = primera fecha de la vista). */
const getCalendarDateOptionForEmail = (activity, sortedDateStrings) => {
  if (!activity) return null;
  if (activity.tipo !== 'recurrente' && activity.fecha) {
    return { fecha: activity.fecha, hora: activity.hora };
  }
  if (activity.tipo === 'recurrente' && sortedDateStrings?.length) {
    return {
      fecha: new Date(`${sortedDateStrings[0]}T00:00:00.000Z`),
      hora: activity.hora,
    };
  }
  return null;
};

const buildGmailInvitationSubject = (activity, sortedDateStrings) => {
  const titulo = activity?.titulo?.trim() || 'Actividad';
  if (activity.tipo !== 'recurrente' && activity.fecha) {
    const datePart = formatDateEsAR(activity.fecha, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timePart = activity.hora?.trim() ? ` · ${activity.hora.trim()}` : '';
    return `${titulo} — ${datePart}${timePart}`;
  }
  if (activity.tipo === 'recurrente' && sortedDateStrings?.length) {
    const first = new Date(`${sortedDateStrings[0]}T00:00:00.000Z`);
    const line = formatUtcCalendarDayAndTime(first, activity.hora);
    return `${titulo} — ${line}`;
  }
  return titulo;
};

const buildCompactGoogleCalendarUrl = (activity, dateOption = null) => {
  if (!activity) return null;
  const baseDate = dateOption?.fecha ?? activity.fecha;
  if (!baseDate) return null;

  const horaStr = dateOption?.hora || activity.hora || '19:00';
  const [hours, minutes] = String(horaStr).split(':');
  const baseDateStr =
    typeof baseDate === 'string'
      ? baseDate.substring(0, 10)
      : formatUtcCalendarDateToString(baseDate);
  const [year, month, day] = baseDateStr.split('-').map(Number);
  if (!year || !month || !day) return null;

  const startTs = Date.UTC(
    year,
    month - 1,
    day,
    parseInt(hours, 10) || 19,
    parseInt(minutes, 10) || 0,
    0
  );
  const duration = activity.duracion || 60;
  const endTs = startTs + duration * 60000;

  const pad = (n) => String(n).padStart(2, '0');
  const formatCalendarDate = (timestamp) => {
    const d = new Date(timestamp);
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
      d.getUTCHours()
    )}${pad(d.getUTCMinutes())}00`;
  };

  const params = new URLSearchParams();
  params.set('action', 'TEMPLATE');
  params.set('text', activity.titulo || 'Actividad');
  params.set('dates', `${formatCalendarDate(startTs)}/${formatCalendarDate(endTs)}`);
  params.set('ctz', 'America/Argentina/Buenos_Aires');
  // Para email usamos versión corta: sin "details" para evitar URLs enormes no clickeables.
  params.set('location', activity.ubicacionOnline || activity.lugar || '');
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const buildFechaHoraBodyBlock = (activity, sortedDateStrings) => {
  if (activity.tipo !== 'recurrente' && activity.fecha) {
    const d = formatDateEsAR(activity.fecha, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const t = activity.hora?.trim();
    return t ? `${d} · ${t}` : d;
  }
  if (activity.tipo === 'recurrente' && sortedDateStrings?.length) {
    const max = 8;
    const bullets = sortedDateStrings.slice(0, max).map((fechaStr) => {
      const day = new Date(`${fechaStr}T00:00:00.000Z`);
      return `• ${formatUtcCalendarDayAndTime(day, activity.hora)}`;
    });
    if (sortedDateStrings.length > max) {
      bullets.push(
        `• … y ${sortedDateStrings.length - max} fecha(s) más (según inscripciones de esta vista).`
      );
    }
    return ['Actividad recurrente — fechas con inscripciones en esta vista:', ...bullets].join('\n');
  }
  return '— (definir en la plataforma)';
};

const buildGmailInvitationBody = (activity, sortedDateStrings, calendarUrl, mapsUrl) => {
  const lines = [];
  lines.push('¡Hola! ¿Cómo estás? Espero que muy bien 💫');
  lines.push('Soy Tami de Malka.');
  lines.push(
    `Te escribo para confirmar tu lugar para ${activity.titulo ? `la actividad "${activity.titulo}"` : 'la actividad'} ✨`
  );
  lines.push('');
  lines.push(`📍¿Dónde? ${activity.lugar?.trim() || 'A confirmar'}`);
  lines.push(`🕐¿Cuándo? ${buildFechaHoraBodyBlock(activity, sortedDateStrings)}`);
  lines.push(
    `💳${activity.esGratuita ? 'Actividad gratuita' : `Valor: ${formatPrice(activity.precio, activity.moneda)}`}`
  );
  if (typeof activity.duracion === 'number' && activity.duracion > 0) {
    lines.push(`⏱️Duración estimada: ${activity.duracion} minutos`);
  }
  if (activity.cupo) {
    lines.push(`👥Cupo: ${activity.cupo}`);
  }
  if (activity.descripcion?.trim()) {
    lines.push('');
    lines.push('📝Sobre la actividad:');
    lines.push(activity.descripcion.trim());
  }
  lines.push('');
  lines.push('📅 Agregar a Google Calendar:');
  lines.push(
    calendarUrl || '(No hay fecha suficiente para generar el enlace.)'
  );
  lines.push('');
  lines.push('🗺️ Mapa / cómo llegar:');
  lines.push(
    mapsUrl?.trim() || '(Sin enlace cargado en la actividad.)'
  );
  lines.push('');
  lines.push('¡Te mando un beso grande y ojalá tengas una semana hermosa! 🌿');

  let text = lines.join('\n');
  if (text.length > GMAIL_INVITE_BODY_MAX) {
    text = `${text.slice(0, GMAIL_INVITE_BODY_MAX - 1)}…`;
  }
  return text;
};

const ESTADO_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'aceptada', label: 'Aceptada' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'en_espera', label: 'En lista de espera' },
];

const FILTRO_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'aceptada', label: 'Aceptadas' },
  { value: 'cancelada', label: 'Canceladas' },
  { value: 'en_espera', label: 'En espera' },
];

/* Números en tinta: cuatro colores fuertes convertían el resumen en un
   semáforo. El estado ya lo dice el label. */
const RESUMEN = [
  { estado: 'pendiente', label: 'Pendientes' },
  { estado: 'aceptada', label: 'Aceptadas' },
  { estado: 'cancelada', label: 'Canceladas' },
  { estado: 'en_espera', label: 'En espera' },
];

const ActivityInscriptions = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fechaHighlight = searchParams.get('fecha');
  const { showSuccess, showError } = useToast();
  const confirm = useConfirm();
  const [activity, setActivity] = useState(null);
  const [inscriptions, setInscriptions] = useState([]);
  const [allInscriptions, setAllInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupedInscriptions, setGroupedInscriptions] = useState({});
  const [comprobanteAbierto, setComprobanteAbierto] = useState(null);
  const [showProofsModal, setShowProofsModal] = useState(false);
  const [estadoFilter, setEstadoFilter] = useState('todos');
  /* Contacto por WhatsApp con plantillas de Ajustes. */
  const [waTarget, setWaTarget] = useState(null);
  const [waPlantillas, setWaPlantillas] = useState([]);

  useEffect(() => {
    fetchActivity();
  }, [id]);

  useEffect(() => {
    axios
      .get('/settings')
      .then((res) => setWaPlantillas(res.data.settings?.plantillasWhatsApp || []))
      .catch(() => setWaPlantillas([]));
  }, []);

  useEffect(() => {
    if (activity) {
      fetchInscriptions();
    }
  }, [activity, id]);

  useEffect(() => {
    if (loading || !fechaHighlight) return;
    const el = document.getElementById(`inscription-fecha-${fechaHighlight}`);
    if (el) {
      const t = window.setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
      return () => window.clearTimeout(t);
    }
  }, [loading, fechaHighlight, activity, groupedInscriptions, estadoFilter, allInscriptions]);

  const applyFilter = (inscriptionsToFilter, filter) => {
    if (filter === 'todos') {
      setInscriptions(inscriptionsToFilter);
    } else {
      const filtered = inscriptionsToFilter.filter(inscription => inscription.estado === filter);
      setInscriptions(filtered);
    }
  };

  const fetchActivity = async () => {
    try {
      const response = await axios.get(`/activities/${id}`);
      setActivity(response.data.activity);
    } catch (error) {
      console.error('Error fetching activity:', error);
      showError('Error al cargar la actividad');
      navigate('/admin/activities');
    }
  };

  const fetchInscriptions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/inscriptions/activity/${id}`);
      const allInscriptions = response.data.inscriptions || [];
      
      // Filtrar inscripciones: solo las que son de ayer o futuras
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const yesterdayStr = formatLocalDateToString(yesterday);

      const filteredInscriptions = allInscriptions.filter((inscription) => {
        const dayStr = formatUtcCalendarDateToString(inscription.fecha);
        if (!dayStr) return false;
        return dayStr >= yesterdayStr;
      });

      setAllInscriptions(filteredInscriptions);
      
      // Agrupar por fecha si es actividad recurrente (usando todas las inscripciones filtradas)
      if (activity?.tipo === 'recurrente') {
        const grouped = {};
        filteredInscriptions.forEach(inscription => {
          const fechaStr = formatUtcCalendarDateToString(inscription.fecha);
          if (!grouped[fechaStr]) {
            grouped[fechaStr] = [];
          }
          grouped[fechaStr].push(inscription);
        });
        setGroupedInscriptions(grouped);
      } else {
        setGroupedInscriptions({});
      }
      
      // Aplicar filtro inicial
      applyFilter(filteredInscriptions, estadoFilter);
    } catch (error) {
      console.error('Error fetching inscriptions:', error);
      showError('Error al cargar las inscripciones');
    } finally {
      setLoading(false);
    }
  };

  const estadoLabel = (estado) =>
    ESTADO_OPTIONS.find((o) => o.value === estado)?.label ?? estado;

  const handleStatusChange = async (inscriptionId, newStatus) => {
    const ok = await confirm({
      title: `¿Cambiar el estado a "${estadoLabel(newStatus)}"?`,
      description: 'La persona ve este estado en sus inscripciones.',
      confirmLabel: 'Cambiar estado',
      tone: newStatus === 'cancelada' ? 'danger' : 'primary',
    });
    if (!ok) return;

    try {
      await axios.put(`/inscriptions/${inscriptionId}/status`, { estado: newStatus });
      showSuccess(`Estado actualizado a ${getEstadoLabel(newStatus)}`);
      fetchInscriptions();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al actualizar estado');
    }
  };

  const handleApprovePayment = async (inscriptionId) => {
    const ok = await confirm({
      title: '¿Aprobar este pago?',
      description: 'La inscripción queda confirmada y la persona recibe el estado aprobado.',
      confirmLabel: 'Aprobar pago',
      tone: 'primary',
    });
    if (!ok) return;

    try {
      const response = await axios.put(`/inscriptions/${inscriptionId}/payment/approve`);
      showSuccess(response.data.message || 'Pago aprobado');
      fetchInscriptions();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al aprobar pago');
    }
  };

  const handleRejectPayment = async (inscriptionId) => {
    const motivoRechazo = await confirm({
      title: '¿Rechazar este pago?',
      description: 'La persona va a tener que subir un comprobante nuevo.',
      confirmLabel: 'Rechazar pago',
      prompt: { label: 'Motivo del rechazo', optional: true, placeholder: 'Ej: el monto no coincide' },
    });
    if (motivoRechazo === false) return;

    try {
      const response = await axios.put(`/inscriptions/${inscriptionId}/payment/reject`, { motivoRechazo });
      showSuccess(response.data.message || 'Pago rechazado');
      fetchInscriptions();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al rechazar pago');
    }
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      aceptada: 'Aceptada',
      pendiente: 'Pendiente',
      cancelada: 'Cancelada',
      en_espera: 'En lista de espera'
    };
    return labels[estado] || estado;
  };

  const handleFilterChange = (e) => {
    const newFilter = e.target.value;
    setEstadoFilter(newFilter);
    applyFilter(allInscriptions, newFilter);
  };

  const getConfirmedInscriptionEmails = () => {
    const seen = new Set();
    const emails = [];
    for (const inscription of allInscriptions) {
      if (inscription.estado !== 'aceptada') continue;
      const raw =
        typeof inscription.userId === 'object' && inscription.userId?.email
          ? String(inscription.userId.email).trim()
          : '';
      if (!raw) continue;
      const key = raw.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      emails.push(raw);
    }
    return emails;
  };

  const copyConfirmedEmailsToClipboard = async () => {
    const emails = getConfirmedInscriptionEmails();
    const text = emails.join(', ');
    if (!text) {
      showError('No hay inscripciones aceptadas con email para copiar.');
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      showSuccess(
        emails.length === 1
          ? '1 email copiado al portapapeles (separado por coma para pegar en el cliente de correo).'
          : `${emails.length} emails copiados al portapapeles (separados por coma).`
      );
    } catch {
      showError('No se pudo copiar. Revisá los permisos del portapapeles en el navegador.');
    }
  };

  const formatDate = (date) => {
    return formatDateEsAR(date, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const adminUserPath = (userRef) => {
    const uid = typeof userRef === 'object' && userRef !== null ? userRef._id : userRef;
    return uid ? `/admin/users/${uid}` : null;
  };

  const inscriptionListHeader = (
    <div className="hidden border-b border-surface-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink-muted sm:grid sm:grid-cols-12 sm:items-center sm:gap-x-3">
      <div className="sm:col-span-4">Participante</div>
      <div className="sm:col-span-3">Pago</div>
      <div className="sm:col-span-5 text-right">Estado</div>
    </div>
  );

  const renderInscriptionCard = (inscription) => {
    const nombreCompleto =
      [inscription.userId?.nombre, inscription.userId?.apellido].filter(Boolean).join(' ').trim();
    const contacto = [inscription.userId?.email, inscription.userId?.telefono]
      .filter(Boolean)
      .join(' · ');
    const userHref = adminUserPath(inscription.userId);
    const participantLabel =
      nombreCompleto ||
      (typeof inscription.userId === 'object' && inscription.userId?.email) ||
      'Ver perfil';
    const pago = inscription.pago;
    const pagoPendiente = pago?.comprobante?.url && pago.estadoPago === 'pendiente';

    return (
      <div
        key={inscription._id}
        className="grid grid-cols-1 gap-2 px-4 py-3 text-sm transition-control duration-fast hover:bg-primary-50/40 sm:grid-cols-12 sm:items-center sm:gap-x-3"
      >
        <div className="min-w-0 sm:col-span-4">
          {userHref ? (
            <Link
              to={userHref}
              className="block truncate font-medium text-ink hover:text-primary hover:underline"
            >
              {participantLabel}
            </Link>
          ) : (
            <span className="block truncate font-medium text-ink">{nombreCompleto || '—'}</span>
          )}
          <span className="block truncate text-xs text-ink-muted">{contacto || '—'}</span>
        </div>

        {/* Pago: badge arriba, link al comprobante abajo. */}
        <div className="min-w-0 sm:col-span-3">
          {pago?.comprobante?.url && (
            <>
              <Badge tone={getPagoEstadoTone(pago.estadoPago)} dot>
                {getPagoEstadoLabel(pago.estadoPago)}
              </Badge>
              <button
                type="button"
                onClick={() =>
                  setComprobanteAbierto({
                    url: pago.comprobante.url,
                    titulo: participantLabel,
                  })
                }
                className="mt-0.5 block text-xs font-medium text-primary hover:underline"
              >
                Ver comprobante
              </button>
            </>
          )}
        </div>

        {/* Acciones en UNA línea: aprobar/rechazar sólo si hay pago por
            revisar, y el select de estado. Antes esto era una torre de tres
            pisos que estiraba cada fila. */}
        <div className="flex flex-wrap items-center gap-2 sm:col-span-5 sm:justify-end">
          {pagoPendiente && (
            <>
              <Button size="sm" icon="check" onClick={() => handleApprovePayment(inscription._id)}>
                Aprobar
              </Button>
              <Button
                size="sm"
                variant="secondary"
                icon="close"
                onClick={() => handleRejectPayment(inscription._id)}
                className="hover:border-danger-500/40 hover:bg-danger-50 hover:text-danger-600"
              >
                Rechazar
              </Button>
            </>
          )}
          {inscription.userId?.telefono && (
            <Button
              size="sm"
              variant="ghost"
              icon="whatsapp"
              iconOnly
              label="Escribir por WhatsApp"
              title="Escribir por WhatsApp"
              onClick={() => setWaTarget(inscription)}
            />
          )}
          <Select
            options={ESTADO_OPTIONS}
            value={inscription.estado}
            onChange={(value) => handleStatusChange(inscription._id, value)}
            size="sm"
            className="w-40"
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return <LoadingScreen message="Cargando inscripciones..." />;
  }

  if (!activity) {
    return null;
  }

  // Filtrar y agrupar inscripciones según el filtro de estado
  const getFilteredGroupedInscriptions = () => {
    if (estadoFilter === 'todos') {
      return groupedInscriptions;
    }
    const filtered = {};
    Object.keys(groupedInscriptions).forEach(fechaStr => {
      const filteredByDate = groupedInscriptions[fechaStr].filter(
        inscription => inscription.estado === estadoFilter
      );
      if (filteredByDate.length > 0) {
        filtered[fechaStr] = filteredByDate;
      }
    });
    return filtered;
  };

  // Ordenar fechas para actividades recurrentes
  const filteredGrouped = activity.tipo === 'recurrente' ? getFilteredGroupedInscriptions() : {};
  const sortedDates = activity.tipo === 'recurrente' 
    ? Object.keys(filteredGrouped).sort()
    : [];

  const getConfirmedGmailComposePayload = (sortedDateStrings) => {
    const emails = getConfirmedInscriptionEmails();
    if (!emails.length || !activity) return null;
    const dateOption = getCalendarDateOptionForEmail(activity, sortedDateStrings);
    const calendarUrl =
      buildCompactGoogleCalendarUrl(activity, dateOption) ||
      buildGoogleCalendarTemplateUrl(activity, dateOption);
    const mapsUrl = activity.ubicacionOnline?.trim() || '';
    const subject = buildGmailInvitationSubject(activity, sortedDateStrings);
    const body = buildGmailInvitationBody(
      activity,
      sortedDateStrings,
      calendarUrl,
      mapsUrl
    );
    const params = new URLSearchParams();
    params.set('view', 'cm');
    params.set('fs', '1');
    params.set('bcc', emails.join(','));
    params.set('su', subject);
    return {
      href: `https://mail.google.com/mail/?${params.toString()}`,
      body,
    };
  };

  const confirmedGmailComposePayload = getConfirmedGmailComposePayload(sortedDates);

  const copyTextToClipboard = async (text) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  };

  const handleOpenGmailCompose = async () => {
    if (!confirmedGmailComposePayload) {
      showError('No hay inscripciones aceptadas con email para redactar el correo.');
      return;
    }

    window.open(confirmedGmailComposePayload.href, '_blank', 'noopener,noreferrer');

    try {
      await copyTextToClipboard(confirmedGmailComposePayload.body);
      showSuccess(
        'Gmail abierto. El texto de invitacion se copio al portapapeles para pegarlo (Cmd/Ctrl+V) y conservar links clickeables.'
      );
    } catch {
      showError(
        'Gmail abierto. No se pudo copiar el cuerpo automaticamente; pegalo manualmente desde la app.'
      );
    }
  };

  const pagosPendientesCount = allInscriptions.filter(
    (i) => i.pago?.estadoPago === 'pendiente' && i.pago?.comprobante?.url
  ).length;

  return (
    <PageContainer
      title="Inscripciones"
      back={
        <Button
          variant="ghost"
          size="sm"
          icon="back"
          iconOnly
          label="Volver a actividades"
          onClick={() => navigate('/admin/activities')}
        />
      }
      actions={
        <Button icon="document" onClick={() => setShowProofsModal(true)}>
          Revisar comprobantes
          {pagosPendientesCount > 0 && (
            /* Contador integrado al botón: pill translúcido del mismo esquema,
               no un badge de otro color peleando con el fondo verde. */
            <span className="ml-1 rounded-pill bg-white/25 px-2 py-0.5 text-xs font-semibold tabular-nums text-white">
              {pagosPendientesCount}
            </span>
          )}
        </Button>
      }
    >

        {/* Información de la actividad */}
        <Card className="mb-8">
          <h2 className="mb-4 break-words text-xl font-bold text-ink sm:text-2xl">
            {activity.titulo}
          </h2>
          {activity.descripcion && <p className="mb-4 text-ink-muted">{activity.descripcion}</p>}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-soft">
            {activity.fecha && (
              <span className="flex items-center gap-1.5">
                <Icon name="activity" size="sm" className="shrink-0 text-ink-faint" />
                {formatDate(activity.fecha)}
              </span>
            )}
            {activity.hora && (
              <span className="flex items-center gap-1.5">
                <Icon name="time" size="sm" className="shrink-0 text-ink-faint" />
                {activity.hora}
              </span>
            )}
            {activity.lugar && (
              <span className="flex min-w-0 items-center gap-1.5">
                <Icon name="location" size="sm" className="shrink-0 text-ink-faint" />
                <span className="truncate">{activity.lugar}</span>
              </span>
            )}
            {activity.cupo && (
              <span className="flex items-center gap-1.5">
                <Icon name="users" size="sm" className="shrink-0 text-ink-faint" />
                Cupo {activity.cupo}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Icon name="payment" size="sm" className="shrink-0 text-ink-faint" />
              {activity.esGratuita ? (
                <Badge tone="success" size="sm">
                  Gratis
                </Badge>
              ) : (
                <span className="font-semibold text-ink">{formatActivityPrice(activity)}</span>
              )}
            </span>
            <Badge tone="neutral" size="sm">
              {activity.tipo === 'recurrente' ? 'Recurrente' : activity.tipo === 'viaje' ? 'Viaje' : 'Única'}
            </Badge>
            {activity.ubicacionOnline && (
              <Button
                variant="link"
                size="sm"
                icon="location"
                href={activity.ubicacionOnline}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-0 px-0 py-0"
              >
                ¿Cómo llego?
              </Button>
            )}
                    </div>
        </Card>

        {/* Estadísticas */}
        <Card className="mb-8">
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <h2 className="text-xl font-semibold text-ink sm:text-2xl">Resumen</h2>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon="mail"
                  onClick={copyConfirmedEmailsToClipboard}
                  title="Copia los correos de participantes con inscripción aceptada, separados por coma, para pegarlos en Para o CCO"
                  className="w-full shrink-0 sm:w-auto"
                >
                  Copiar emails (inscripciones aceptadas)
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon="mail"
                  onClick={handleOpenGmailCompose}
                  title="Abre Gmail con CCO y asunto del evento. El cuerpo se copia al portapapeles para pegarlo y mantener links clickeables."
                  className="w-full shrink-0 sm:w-auto"
                >
                  Redactar en Gmail (CCO)
                </Button>
              </div>
            </div>
            <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 md:w-auto">
              <Field label="Filtrar por estado" className="mb-0 w-full min-w-0 sm:w-56">
                <Select
                  options={FILTRO_OPTIONS}
                  value={estadoFilter}
                  onChange={(value) => handleFilterChange({ target: { value: value ?? 'todos' } })}
                />
              </Field>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {RESUMEN.map(({ estado, label }) => (
              <div key={estado} className="rounded-card border border-surface-border bg-surface px-3 py-3 text-center">
                <p className="text-2xl font-bold tabular-nums tracking-tight text-ink sm:text-3xl">
                  {allInscriptions.filter((i) => i.estado === estado).length}
                </p>
                <p className="mt-0.5 text-sm text-ink-muted">{label}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Lista de inscripciones */}
        {allInscriptions.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon="users"
              title="Sin inscripciones"
              description="No hay inscripciones para esta actividad. Sólo se muestran las de ayer en adelante."
            />
          </Card>
        ) : inscriptions.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon="search"
              title="Sin resultados"
              description="No hay inscripciones con el estado seleccionado."
            />
          </Card>
        ) : activity.tipo === 'recurrente' ? (
          // Actividad recurrente: agrupar por fecha
          <div className="space-y-8">
            {sortedDates.length === 0 ? (
              <Card padding="none">
            <EmptyState
              icon="search"
              title="Sin resultados"
              description="No hay inscripciones con el estado seleccionado."
            />
          </Card>
            ) : (
              sortedDates.map(fechaStr => {
                const fechaInscriptions = filteredGrouped[fechaStr];
                return (
                  <div key={fechaStr} id={`inscription-fecha-${fechaStr}`}>
                    <div className="mb-2">
                      <h3 className="text-base font-bold tabular-nums text-ink">
                        {formatUtcCalendarDayAndTime(new Date(`${fechaStr}T00:00:00.000Z`), activity.hora)}
                      </h3>
                      <p className="text-xs text-ink-muted">
                        {fechaInscriptions.length} inscripción{fechaInscriptions.length !== 1 ? 'es' : ''}
                      </p>
                    </div>
                    <div className="overflow-hidden rounded-card border border-surface-border bg-surface shadow-card divide-y divide-surface-border">
                      {inscriptionListHeader}
                      {fechaInscriptions.map(inscription => renderInscriptionCard(inscription))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          // Actividad única: mostrar todas juntas
          <div
            className="overflow-hidden rounded-card border border-surface-border bg-surface shadow-card divide-y divide-surface-border"
            id={
              activity.fecha
                ? `inscription-fecha-${formatUtcCalendarDateToString(activity.fecha)}`
                : undefined
            }
          >
            {inscriptionListHeader}
            {inscriptions.map(inscription => renderInscriptionCard(inscription))}
          </div>
        )}
      <PendingPaymentProofsModal
        open={showProofsModal}
        activityId={id}
        onClose={() => setShowProofsModal(false)}
        onReviewed={fetchInscriptions}
      />

      <Modal
        open={Boolean(waTarget)}
        onClose={() => setWaTarget(null)}
        size="sm"
        title="Escribir por WhatsApp"
        description={
          waTarget
            ? [waTarget.userId?.nombre, waTarget.userId?.apellido].filter(Boolean).join(' ') ||
              waTarget.userId?.email
            : undefined
        }
      >
        {waTarget && (
          <div className="space-y-2">
            {waPlantillas.map((p) => {
              const texto = renderPlantilla(
                p.mensaje,
                plantillaContext({
                  user: waTarget.userId,
                  activity,
                  fecha: waTarget.fecha,
                  hora: waTarget.hora || activity?.hora,
                })
              );
              return (
                <Button
                  key={p._id ?? p.nombre}
                  variant="secondary"
                  icon="whatsapp"
                  fullWidth
                  href={buildWaLink(waTarget.userId?.telefono, texto)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setWaTarget(null)}
                  className="justify-start text-left"
                >
                  {p.nombre}
                </Button>
              );
            })}

            <Button
              variant="secondary"
              icon="whatsapp"
              fullWidth
              href={buildWaLink(waTarget.userId?.telefono, '')}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setWaTarget(null)}
              className="justify-start text-left"
            >
              Chat vacío (sin plantilla)
            </Button>

            {waPlantillas.length === 0 && (
              <p className="pt-1 text-sm text-ink-muted">
                Podés crear plantillas con variables en Ajustes → WhatsApp.
              </p>
            )}
          </div>
        )}
      </Modal>

      <ImageLightbox
        open={Boolean(comprobanteAbierto)}
        src={comprobanteAbierto?.url}
        title={`Comprobante · ${comprobanteAbierto?.titulo ?? ''}`}
        onClose={() => setComprobanteAbierto(null)}
      />
    </PageContainer>
  );
};

export default ActivityInscriptions;

