import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';

// Helper function to format date as YYYY-MM-DD - simple date, no timezone conversion
// Just extract the year, month, day as simple numbers
const formatDateToString = (date) => {
  if (!date) return '';
  
  // If it's already a string in YYYY-MM-DD format, return it as-is
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    return date.substring(0, 10);
  }
  
  // For Date objects, extract year, month, day as simple numbers
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ActivityInscriptions = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
      
      const filteredInscriptions = allInscriptions.filter(inscription => {
        const inscriptionDate = new Date(inscription.fecha);
        inscriptionDate.setHours(0, 0, 0, 0);
        return inscriptionDate >= yesterday;
      });

      setAllInscriptions(filteredInscriptions);
      
      // Agrupar por fecha si es actividad recurrente (usando todas las inscripciones filtradas)
      if (activity?.tipo === 'recurrente') {
        const grouped = {};
        filteredInscriptions.forEach(inscription => {
          const fechaStr = formatDateToString(inscription.fecha);
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

  const handleApprove = async (inscriptionId) => {
    try {
      await axios.put(`/inscriptions/${inscriptionId}/approve`);
      showSuccess('Inscripción aprobada exitosamente');
      fetchInscriptions();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al aprobar inscripción');
    }
  };

  const handleReject = async (inscriptionId) => {
    if (!window.confirm('¿Estás seguro de que deseas rechazar esta inscripción?')) {
      return;
    }
    try {
      await axios.put(`/inscriptions/${inscriptionId}/reject`);
      showSuccess('Inscripción rechazada');
      fetchInscriptions();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al rechazar inscripción');
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
    return new Date(date).toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderInscriptionCard = (inscription) => (
    <div key={inscription._id} className="card hover:shadow-xl transition-shadow">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h4 className="text-lg font-bold text-gray-800 mb-2">
                {inscription.userId?.nombre} {inscription.userId?.apellido}
              </h4>
              <div className="flex items-center gap-3">
                {getEstadoBadge(inscription.estado)}
                <select
                  value={inscription.estado}
                  onChange={(e) => handleStatusChange(inscription._id, e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary transition-colors cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="aceptada">Aceptada</option>
                  <option value="cancelada">Cancelada</option>
                  <option value="en_espera">En lista de espera</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1"><strong>Email:</strong></p>
              <p className="text-gray-800">{inscription.userId?.email}</p>
            </div>
            {inscription.userId?.telefono && (
              <div>
                <p className="text-sm text-gray-600 mb-1"><strong>Teléfono:</strong></p>
                <p className="text-gray-800">{inscription.userId.telefono}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600 mb-1"><strong>Fecha de inscripción:</strong></p>
              <p className="text-gray-800">
                {new Date(inscription.fechaInscripcion).toLocaleDateString('es-AR')}
              </p>
            </div>
            {inscription.notas && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 mb-1"><strong>Notas:</strong></p>
                <p className="text-gray-800">{inscription.notas}</p>
              </div>
            )}
            {inscription.userId?.tags && inscription.userId.tags.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 mb-1"><strong>Tags:</strong></p>
                <div className="flex flex-wrap gap-2">
                  {inscription.userId.tags.map(tag => (
                    <span key={tag} className="badge badge-secondary">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

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
    ? Object.keys(filteredGrouped).sort((a, b) => new Date(a) - new Date(b))
    : [];

  return (
    <div className="min-h-screen bg-light-bg py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/admin/activities')}
            className="btn btn-secondary"
          >
            ← Volver
          </button>
          <h1 className="text-4xl font-bold text-primary">Inscripciones</h1>
        </div>

        {/* Información de la actividad */}
        <div className="card mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{activity.titulo}</h2>
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
                  className="btn btn-secondary text-sm inline-block"
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">Resumen</h2>
            <div className="flex items-center gap-3">
              <label className="text-gray-700 font-medium">Filtrar por estado:</label>
              <select
                value={estadoFilter}
                onChange={handleFilterChange}
                className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="todos">Todos</option>
                <option value="pendiente">Pendientes</option>
                <option value="aceptada">Aceptadas</option>
                <option value="cancelada">Canceladas</option>
                <option value="en_espera">En espera</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-500">
                {allInscriptions.filter(i => i.estado === 'pendiente').length}
              </p>
              <p className="text-gray-600">Pendientes</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {allInscriptions.filter(i => i.estado === 'aceptada').length}
              </p>
              <p className="text-gray-600">Aceptadas</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">
                {allInscriptions.filter(i => i.estado === 'cancelada').length}
              </p>
              <p className="text-gray-600">Canceladas</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
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
                const fecha = new Date(fechaStr);
                
                return (
                  <div key={fechaStr}>
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">
                        {formatDate(fecha)}
                      </h3>
                      {activity.hora && (
                        <p className="text-gray-600">Hora: {activity.hora}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        {fechaInscriptions.length} inscripción{fechaInscriptions.length !== 1 ? 'es' : ''}
                      </p>
                    </div>
                    <div className="space-y-4">
                      {fechaInscriptions.map(inscription => renderInscriptionCard(inscription))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          // Actividad única: mostrar todas juntas
          <div className="space-y-4">
            {inscriptions.map(inscription => renderInscriptionCard(inscription))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityInscriptions;

