import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';

const ActivityInscriptions = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [activity, setActivity] = useState(null);
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupedInscriptions, setGroupedInscriptions] = useState({});

  useEffect(() => {
    fetchActivity();
  }, [id]);

  useEffect(() => {
    if (activity) {
      fetchInscriptions();
    }
  }, [activity, id]);

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

      setInscriptions(filteredInscriptions);
      
      // Agrupar por fecha si es actividad recurrente
      if (activity?.tipo === 'recurrente') {
        const grouped = {};
        filteredInscriptions.forEach(inscription => {
          const fechaStr = new Date(inscription.fecha).toISOString().split('T')[0];
          if (!grouped[fechaStr]) {
            grouped[fechaStr] = [];
          }
          grouped[fechaStr].push(inscription);
        });
        setGroupedInscriptions(grouped);
      } else {
        setGroupedInscriptions({});
      }
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
            <div>
              <h4 className="text-lg font-bold text-gray-800 mb-2">
                {inscription.userId?.nombre} {inscription.userId?.apellido}
              </h4>
              {getEstadoBadge(inscription.estado)}
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

        {inscription.estado === 'pendiente' && (
          <div className="flex flex-col gap-2 md:min-w-[200px]">
            <button
              onClick={() => handleApprove(inscription._id)}
              className="btn btn-success w-full"
            >
              Aprobar
            </button>
            <button
              onClick={() => handleReject(inscription._id)}
              className="btn btn-danger w-full"
            >
              Rechazar
            </button>
          </div>
        )}
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

  // Ordenar fechas para actividades recurrentes
  const sortedDates = activity.tipo === 'recurrente' 
    ? Object.keys(groupedInscriptions).sort((a, b) => new Date(a) - new Date(b))
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
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Resumen</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-500">
                {inscriptions.filter(i => i.estado === 'pendiente').length}
              </p>
              <p className="text-gray-600">Pendientes</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {inscriptions.filter(i => i.estado === 'aceptada').length}
              </p>
              <p className="text-gray-600">Aceptadas</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">
                {inscriptions.filter(i => i.estado === 'cancelada').length}
              </p>
              <p className="text-gray-600">Canceladas</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {inscriptions.filter(i => i.estado === 'en_espera').length}
              </p>
              <p className="text-gray-600">En espera</p>
            </div>
          </div>
        </div>

        {/* Lista de inscripciones */}
        {inscriptions.length === 0 ? (
          <div className="card">
            <p className="text-gray-600 text-center py-4">
              No hay inscripciones para esta actividad (solo se muestran inscripciones de ayer en adelante).
            </p>
          </div>
        ) : activity.tipo === 'recurrente' ? (
          // Actividad recurrente: agrupar por fecha
          <div className="space-y-8">
            {sortedDates.map(fechaStr => {
              const fechaInscriptions = groupedInscriptions[fechaStr];
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
            })}
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

