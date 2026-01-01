import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [inscriptions, setInscriptions] = useState([]);
  const [loadingInscriptions, setLoadingInscriptions] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    tags: [],
    estado: '',
    role: '',
    restriccionesAlimentarias: [],
    comoSeEntero: ''
  });

  useEffect(() => {
    fetchUser();
    fetchAvailableTags();
  }, [id]);

  useEffect(() => {
    if (user && user._id) {
      fetchUserInscriptions();
    }
  }, [user]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`/users/${id}`);
      const userData = response.data.user;
      if (!userData) {
        throw new Error('Usuario no encontrado en la respuesta');
      }
      setUser(userData);
      setFormData({
        nombre: userData.nombre || '',
        apellido: userData.apellido || '',
        email: userData.email || '',
        telefono: userData.telefono || '',
        tags: userData.tags || [],
        estado: userData.estado || '',
        role: userData.role || '',
        restriccionesAlimentarias: userData.restriccionesAlimentarias || [],
        comoSeEntero: userData.comoSeEntero || ''
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Error al cargar la información del usuario';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTags = async () => {
    try {
      const response = await axios.get('/tags?activa=true');
      setAvailableTags(response.data.tags || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchUserInscriptions = async () => {
    try {
      setLoadingInscriptions(true);
      const response = await axios.get(`/inscriptions?userId=${user._id}`);
      const allInscriptions = response.data.inscriptions || [];
      // Obtener las últimas 10
      setInscriptions(allInscriptions.slice(0, 10));
    } catch (error) {
      console.error('Error fetching user inscriptions:', error);
      setInscriptions([]);
    } finally {
      setLoadingInscriptions(false);
    }
  };

  const handleApproveInscription = async (e, inscriptionId) => {
    e.stopPropagation(); // Evitar que se active el click de la fila
    try {
      await axios.put(`/inscriptions/${inscriptionId}/approve`);
      showSuccess('Inscripción aprobada exitosamente');
      fetchUserInscriptions();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al aprobar inscripción');
    }
  };

  const handleRejectInscription = async (e, inscriptionId) => {
    e.stopPropagation(); // Evitar que se active el click de la fila
    if (!window.confirm('¿Estás seguro de que deseas rechazar esta inscripción?')) {
      return;
    }
    try {
      await axios.put(`/inscriptions/${inscriptionId}/reject`);
      showSuccess('Inscripción rechazada');
      fetchUserInscriptions();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al rechazar inscripción');
    }
  };

  const handleRowClick = (inscription) => {
    if (inscription.activityId?._id) {
      navigate(`/admin/activities/${inscription.activityId._id}/inscriptions`);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddTag = () => {
    if (tagInput) {
      const tagNombreLower = tagInput.toLowerCase();
      const alreadyExists = formData.tags.some(t => t.toLowerCase() === tagNombreLower);
      if (!alreadyExists) {
        const tagFromBackend = availableTags.find(t => t.nombre.toLowerCase() === tagNombreLower);
        const tagToAdd = tagFromBackend ? tagFromBackend.nombre : tagInput;
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagToAdd]
        }));
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleApprove = async () => {
    if (!window.confirm('¿Estás seguro de que deseas aprobar este usuario?')) {
      return;
    }
    try {
      await axios.put(`/users/${id}/approve`);
      showSuccess('Usuario aprobado exitosamente');
      fetchUser();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al aprobar usuario');
    }
  };

  const handleReject = async () => {
    if (!window.confirm('¿Estás seguro de que deseas rechazar este usuario?')) {
      return;
    }
    try {
      await axios.put(`/users/${id}/reject`);
      showSuccess('Usuario rechazado');
      fetchUser();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al rechazar usuario');
    }
  };

  const handleSetPending = async () => {
    if (!window.confirm('¿Estás seguro de que deseas poner este usuario como pendiente?')) {
      return;
    }
    try {
      await axios.put(`/users/${id}`, {
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono,
        tags: formData.tags,
        estado: 'pending'
      });
      showSuccess('Usuario puesto como pendiente');
      fetchUser();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al cambiar estado del usuario');
    }
  };

  const handleEstadoChange = async (e) => {
    const newEstado = e.target.value;
    if (newEstado === formData.estado) return;

    const confirmMessages = {
      approved: '¿Estás seguro de que deseas aprobar este usuario?',
      rejected: '¿Estás seguro de que deseas rechazar este usuario?',
      pending: '¿Estás seguro de que deseas poner este usuario como pendiente?'
    };

    if (!window.confirm(confirmMessages[newEstado])) {
      return;
    }

    try {
      if (newEstado === 'approved') {
        await axios.put(`/users/${id}/approve`);
        showSuccess('Usuario aprobado exitosamente');
      } else if (newEstado === 'rejected') {
        await axios.put(`/users/${id}/reject`);
        showSuccess('Usuario rechazado');
      } else {
        await axios.put(`/users/${id}`, {
          nombre: formData.nombre,
          apellido: formData.apellido,
          telefono: formData.telefono,
          tags: formData.tags,
          estado: 'pending'
        });
        showSuccess('Usuario puesto como pendiente');
      }
      fetchUser();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al cambiar estado del usuario');
      // Revertir el select al estado anterior
      e.target.value = formData.estado;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await axios.put(`/users/${id}`, {
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono,
        tags: formData.tags
      });
      showSuccess('Usuario actualizado exitosamente');
      fetchUser();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al actualizar usuario');
    } finally {
      setSaving(false);
    }
  };

  const getEstadoBadgeInscription = (estado) => {
    const badges = {
      aceptada: { class: 'badge-success', text: 'Aceptada' },
      pendiente: { class: 'badge-warning', text: 'Pendiente' },
      cancelada: { class: 'badge-danger', text: 'Cancelada' },
      en_espera: { class: 'badge-secondary', text: 'En Espera' }
    };
    const badge = badges[estado] || badges.pendiente;
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      approved: { class: 'badge-success', text: 'Aprobado' },
      pending: { class: 'badge-warning', text: 'Pendiente' },
      rejected: { class: 'badge-danger', text: 'Rechazado' }
    };
    const badge = badges[estado] || badges.pending;
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light-bg flex flex-col items-center justify-center">
        <div className="spinner"></div>
        <p className="mt-4 text-gray-600">Cargando información del usuario...</p>
      </div>
    );
  }

  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-light-bg py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="card">
            {error ? (
              <>
                <p className="text-red-600 font-semibold mb-2">Error al cargar el usuario</p>
                <p className="text-gray-600 mb-4">{error}</p>
              </>
            ) : (
              <p className="text-red-600">Usuario no encontrado</p>
            )}
            <button onClick={() => navigate('/admin/users')} className="btn btn-secondary mt-4">
              Volver a Usuarios
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-primary">
            {user.nombre} {user.apellido}
          </h1>
          <button
            onClick={() => navigate('/admin/users')}
            className="btn btn-secondary"
          >
            ← Volver
          </button>
        </div>

        {error && (
          <div className="alert alert-error mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="card">
          {/* Información Básica */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Información Básica</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
                <p className="text-sm text-gray-500 mt-1">El email no se puede modificar</p>
              </div>

              <div className="form-group">
                <label>Estado</label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleEstadoChange}
                  className="bg-white"
                >
                  <option value="pending">Pendiente</option>
                  <option value="approved">Aprobado</option>
                  <option value="rejected">Rechazado</option>
                </select>
              </div>

              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="bg-white"
                />
              </div>

              <div className="form-group">
                <label>Apellido *</label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  required
                  className="bg-white"
                />
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="bg-white"
                />
              </div>

              <div className="form-group">
                <label>Rol</label>
                <input
                  type="text"
                  value={formData.role === 'admin' ? 'Administrador' : 'Participante'}
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
                <p className="text-sm text-gray-500 mt-1">El rol no se puede modificar desde aquí</p>
              </div>
            </div>
          </div>

          {/* Información del Onboarding */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Información del Onboarding</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group md:col-span-2">
                <label>Restricciones Alimentarias</label>
                {formData.restriccionesAlimentarias && formData.restriccionesAlimentarias.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.restriccionesAlimentarias.map((restriccion, index) => (
                      <span
                        key={index}
                        className="badge badge-secondary"
                      >
                        {restriccion}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 mt-2 italic">No tiene restricciones alimentarias</p>
                )}
              </div>

              <div className="form-group md:col-span-2">
                <label>¿Cómo se enteró de esta propuesta?</label>
                {formData.comoSeEntero ? (
                  <p className="mt-2 text-gray-700 bg-gray-50 p-3 rounded border border-gray-200">
                    {formData.comoSeEntero}
                  </p>
                ) : (
                  <p className="text-gray-500 mt-2 italic">No especificado</p>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Tags</h2>
            <div className="form-group">
              <label>Tags del Usuario</label>
              <div className="flex gap-3 mb-3">
                <select
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="flex-1 bg-white"
                >
                  <option value="">Seleccionar tag</option>
                  {availableTags.length > 0 ? (
                    availableTags
                      .filter(tag => {
                        const tagNombreLower = tag.nombre.toLowerCase();
                        return !formData.tags.some(t => t.toLowerCase() === tagNombreLower);
                      })
                      .map(tag => (
                        <option key={tag._id} value={tag.nombre}>
                          {tag.nombre.charAt(0).toUpperCase() + tag.nombre.slice(1)}
                          {tag.descripcion && ` - ${tag.descripcion}`}
                        </option>
                      ))
                  ) : (
                    <option value="" disabled>No hay tags disponibles</option>
                  )}
                </select>
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="btn btn-secondary"
                  disabled={!tagInput}
                >
                  Agregar
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tagNombre => {
                  const tag = availableTags.find(t => t.nombre.toLowerCase() === tagNombre.toLowerCase());
                  const tagColor = tag?.color || '#3B82F6';
                  return (
                    <span
                      key={tagNombre}
                      className="badge flex items-center gap-2 text-white"
                      style={{ backgroundColor: tagColor }}
                    >
                      {tagNombre.charAt(0).toUpperCase() + tagNombre.slice(1)}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tagNombre)}
                        className="bg-transparent border-none text-white cursor-pointer hover:text-gray-200 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
              {availableTags.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  No hay tags disponibles. <a href="/admin/tags" className="text-primary hover:underline">Crear tags</a>
                </p>
              )}
            </div>
          </div>

          {/* Inscripciones Recientes */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Inscripciones Recientes</h2>
            {loadingInscriptions ? (
              <div className="text-center py-8">
                <div className="spinner mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando inscripciones...</p>
              </div>
            ) : inscriptions.length === 0 ? (
              <div className="card">
                <p className="text-gray-600 text-center py-4">Este usuario no tiene inscripciones.</p>
              </div>
            ) : (
              <div className="card overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="p-4 text-left font-semibold text-gray-700">Actividad</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Fecha</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Hora</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Estado</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Fecha Inscripción</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inscriptions.map(inscription => (
                      <tr 
                        key={inscription._id} 
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleRowClick(inscription)}
                      >
                        <td className="p-4">
                          <div className="font-medium text-gray-800">
                            {inscription.activityId?.titulo || 'Actividad eliminada'}
                          </div>
                          {inscription.activityId?.lugar && (
                            <div className="text-sm text-gray-500 mt-1">
                              📍 {inscription.activityId.lugar}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          {inscription.fecha 
                            ? new Date(inscription.fecha).toLocaleDateString('es-AR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : '-'}
                        </td>
                        <td className="p-4">
                          {inscription.hora || inscription.activityId?.hora || '-'}
                        </td>
                        <td className="p-4">
                          {getEstadoBadgeInscription(inscription.estado)}
                        </td>
                        <td className="p-4">
                          {inscription.fechaInscripcion 
                            ? new Date(inscription.fechaInscripcion).toLocaleDateString('es-AR', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '-'}
                        </td>
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          {inscription.estado === 'pendiente' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => handleApproveInscription(e, inscription._id)}
                                className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
                                title="Aprobar inscripción"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => handleRejectInscription(e, inscription._id)}
                                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                                title="Rechazar inscripción"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {inscriptions.length >= 10 && (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Mostrando las últimas 10 inscripciones
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserDetail;

