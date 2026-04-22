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

const GMAIL_INVITE_BODY_MAX = 7500;

/** Día concreto para el enlace «Agregar a calendario» (única = actividad; recurrente = primera fecha de la vista). */
const getCalendarDateOptionForEmail = (activity, sortedDateStrings) => {
  if (!activity) return null;
  if (activity.tipo === 'unica' && activity.fecha) {
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
  if (activity.tipo === 'unica' && activity.fecha) {
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
  if (activity.tipo === 'unica' && activity.fecha) {
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
    `💳${activity.esGratuita ? 'Actividad gratuita' : `Valor: $${activity.precio ?? '—'}`}`
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

const ActivityInscriptions = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fechaHighlight = searchParams.get('fecha');
  const { showSuccess, showError } = useToast();
  const [activity, setActivity] = useState(null);
  const [inscriptions, setInscriptions] = useState([]);
  const [allInscriptions, setAllInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupedInscriptions, setGroupedInscriptions] = useState({});
  const [estadoFilter, setEstadoFilter] = useState('todos');

  useEffect(() => {
    fetchActivity();
  }, [id]);

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

  const handleStatusChange = async (inscriptionId, newStatus) => {
    try {
      await axios.put(`/inscriptions/${inscriptionId}/status`, { estado: newStatus });
      showSuccess(`Estado actualizado a ${getEstadoLabel(newStatus)}`);
      fetchInscriptions();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al actualizar estado');
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

  const getEstadoBadge = (estado) => {
    const badges = {
      aceptada: { class: 'badge-success', text: 'Aceptada' },
      pendiente: { class: 'badge-warning', text: 'Pendiente' },
      cancelada: { class: 'badge-danger', text: 'Cancelada' },
      en_espera: { class: 'badge-info', text: 'En lista de espera' }
    };
    const badge = badges[estado] || badges.pendiente;
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
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
    <div className="hidden sm:grid sm:grid-cols-12 sm:gap-x-3 sm:items-center px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
      <div className="sm:col-span-4">Participante</div>
      <div className="sm:col-span-5">Contacto</div>
      <div className="sm:col-span-3 text-right">Estado</div>
    </div>
  );

  const renderInscriptionCard = (inscription) => {
    const nombreCompleto =
      [inscription.userId?.nombre, inscription.userId?.apellido].filter(Boolean).join(' ').trim() || '—';
    const telefono = inscription.userId?.telefono || '—';
    const email = inscription.userId?.email || '—';
    const userHref = adminUserPath(inscription.userId);
    const participantLabel =
      nombreCompleto !== '—'
        ? nombreCompleto
        : typeof inscription.userId === 'object' && inscription.userId?.email
          ? inscription.userId.email
          : 'Ver perfil';
    return (
      <div
        key={inscription._id}
        className="px-4 py-2.5 grid grid-cols-1 gap-2 sm:grid-cols-12 sm:gap-x-3 sm:items-center text-sm hover:bg-gray-50/80"
      >
        <div className="sm:col-span-4 font-medium text-gray-900 truncate">
          {userHref ? (
            <Link to={userHref} className="text-primary hover:underline">
              {participantLabel}
            </Link>
          ) : (
            nombreCompleto
          )}
        </div>
        <div className="sm:col-span-5 text-gray-700 min-w-0 space-y-0.5">
          <div className="break-words">{telefono}</div>
          <div className="break-words text-gray-600">{email}</div>
        </div>
        <div className="sm:col-span-3 flex flex-wrap items-center gap-2 sm:justify-end shrink-0">
          {getEstadoBadge(inscription.estado)}
          <select
            value={inscription.estado}
            onChange={(e) => handleStatusChange(inscription._id, e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-xs bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="pendiente">Pendiente</option>
            <option value="aceptada">Aceptada</option>
            <option value="cancelada">Cancelada</option>
            <option value="en_espera">En lista de espera</option>
          </select>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light-bg flex flex-col items-center justify-center">
        <div className="spinner"></div>
        <p className="mt-4 text-gray-600">Cargando inscripciones...</p>
      </div>
    );
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

  return (
    <div className="min-h-screen bg-light-bg py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto min-w-0">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <button
            onClick={() => navigate('/admin/activities')}
            className="btn btn-secondary w-full shrink-0 justify-center sm:w-auto"
          >
            ← Volver
          </button>
          <h1 className="text-2xl font-bold text-primary sm:text-3xl md:text-4xl">Inscripciones</h1>
        </div>

        {/* Información de la actividad */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-800 sm:text-2xl mb-4 break-words">{activity.titulo}</h2>
          {activity.descripcion && (
            <p className="text-gray-600 mb-4">{activity.descripcion}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activity.fecha && (
              <div>
                <p className="text-sm text-gray-600"><strong>Fecha:</strong> {formatDate(activity.fecha)}</p>
              </div>
            )}
            {activity.hora && (
              <div>
                <p className="text-sm text-gray-600"><strong>Hora:</strong> {activity.hora}</p>
              </div>
            )}
            {activity.lugar && (
              <div>
                <p className="text-sm text-gray-600"><strong>Lugar:</strong> {activity.lugar}</p>
              </div>
            )}
            {activity.ubicacionOnline && (
              <div>
                <p className="text-sm text-gray-600 mb-2"><strong>Ubicación:</strong></p>
                <a
                  href={activity.ubicacionOnline}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary w-full justify-center text-sm sm:w-auto"
                  title="Ver ubicación en Google Maps"
                >
                  🗺️ ¿Cómo llego?
                </a>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">
                <strong>Precio:</strong> {activity.esGratuita ? 'Gratis' : `$${activity.precio}`}
              </p>
            </div>
            {activity.cupo && (
              <div>
                <p className="text-sm text-gray-600">
                  <strong>Cupo:</strong> {activity.cupo}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">
                <strong>Tipo:</strong> {activity.tipo === 'recurrente' ? 'Recurrente' : 'Única'}
              </p>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="card mb-8">
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <h2 className="text-xl font-semibold text-gray-800 sm:text-2xl">Resumen</h2>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-2">
                <button
                  type="button"
                  onClick={copyConfirmedEmailsToClipboard}
                  className="btn btn-secondary w-full shrink-0 justify-center text-sm sm:w-auto"
                  title="Copia los correos de participantes con inscripción aceptada, separados por coma, para pegarlos en Para o CCO"
                >
                  Copiar emails (inscripciones aceptadas)
                </button>
                <button
                  type="button"
                  onClick={handleOpenGmailCompose}
                  className="btn btn-secondary w-full shrink-0 justify-center text-sm sm:w-auto no-underline"
                  title="Abre Gmail con CCO y asunto del evento. El cuerpo se copia al portapapeles para pegarlo y mantener links clickeables."
                >
                  Redactar en Gmail (CCO)
                </button>
              </div>
            </div>
            <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 md:w-auto">
              <label className="shrink-0 font-medium text-gray-700">Filtrar por estado:</label>
              <select
                value={estadoFilter}
                onChange={handleFilterChange}
                className="w-full min-w-0 rounded border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary sm:w-auto sm:min-w-[12rem]"
              >
                <option value="todos">Todos</option>
                <option value="pendiente">Pendientes</option>
                <option value="aceptada">Aceptadas</option>
                <option value="cancelada">Canceladas</option>
                <option value="en_espera">En espera</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-500 sm:text-3xl">
                {allInscriptions.filter(i => i.estado === 'pendiente').length}
              </p>
              <p className="text-gray-600">Pendientes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 sm:text-3xl">
                {allInscriptions.filter(i => i.estado === 'aceptada').length}
              </p>
              <p className="text-gray-600">Aceptadas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600 sm:text-3xl">
                {allInscriptions.filter(i => i.estado === 'cancelada').length}
              </p>
              <p className="text-gray-600">Canceladas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600 sm:text-3xl">
                {allInscriptions.filter(i => i.estado === 'en_espera').length}
              </p>
              <p className="text-gray-600">En espera</p>
            </div>
          </div>
        </div>

        {/* Lista de inscripciones */}
        {allInscriptions.length === 0 ? (
          <div className="card">
            <p className="text-gray-600 text-center py-4">
              No hay inscripciones para esta actividad (solo se muestran inscripciones de ayer en adelante).
            </p>
          </div>
        ) : inscriptions.length === 0 ? (
          <div className="card">
            <p className="text-gray-600 text-center py-4">
              No hay inscripciones con el estado seleccionado.
            </p>
          </div>
        ) : activity.tipo === 'recurrente' ? (
          // Actividad recurrente: agrupar por fecha
          <div className="space-y-8">
            {sortedDates.length === 0 ? (
              <div className="card">
                <p className="text-gray-600 text-center py-4">
                  No hay inscripciones con el estado seleccionado.
                </p>
              </div>
            ) : (
              sortedDates.map(fechaStr => {
                const fechaInscriptions = filteredGrouped[fechaStr];
                return (
                  <div key={fechaStr} id={`inscription-fecha-${fechaStr}`}>
                    <div className="mb-2">
                      <h3 className="text-base font-bold text-gray-800 tabular-nums">
                        {formatUtcCalendarDayAndTime(new Date(`${fechaStr}T00:00:00.000Z`), activity.hora)}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {fechaInscriptions.length} inscripción{fechaInscriptions.length !== 1 ? 'es' : ''}
                      </p>
                    </div>
                    <div className="card p-0 overflow-hidden divide-y divide-gray-100">
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
            className="card p-0 overflow-hidden divide-y divide-gray-100"
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
      </div>
    </div>
  );
};

export default ActivityInscriptions;

