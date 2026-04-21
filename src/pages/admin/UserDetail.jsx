import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';
import { userPrivateTags } from '../../utils/tagFields';
import { formatUtcCalendarDayAndTime } from '../../utils/dateUtils';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [availablePrivateTags, setAvailablePrivateTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [tagInputPrivados, setTagInputPrivados] = useState('');
  const [inscriptions, setInscriptions] = useState([]);
  const [loadingInscriptions, setLoadingInscriptions] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    dni: '',
    telefono: '',
    tags: [],
    tagsPrivados: [],
    estado: '',
    role: '',
    restriccionesAlimentarias: [],
    comoSeEntero: ''
  });

  useEffect(() => {
    fetchUser();
    fetchAvailableTags();
    fetchAvailablePrivateTags();
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
        dni: userData.dni || '',
        telefono: userData.telefono || '',
        tags: userData.tags || [],
        tagsPrivados: userPrivateTags(userData),
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

  const fetchAvailablePrivateTags = async () => {
    try {
      const response = await axios.get('/tags-privados?activa=true');
      setAvailablePrivateTags(response.data.tags || []);
    } catch (error) {
      console.error('Error fetching tags privados:', error);
      setAvailablePrivateTags([]);
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
    const next =
      type === 'checkbox' ? checked : name === 'dni' ? value.replace(/ /g, '').trim() : value;
    setFormData(prev => ({
      ...prev,
      [name]: next
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

  const handleAddPrivateTag = () => {
    if (!tagInputPrivados) return;
    const tagNombreLower = tagInputPrivados.toLowerCase();
    if (formData.tagsPrivados.some(t => t.toLowerCase() === tagNombreLower)) return;
    const tagFromBackend = availablePrivateTags.find(t => t.nombre.toLowerCase() === tagNombreLower);
    const tagToAdd = tagFromBackend ? tagFromBackend.nombre : tagInputPrivados;
    setFormData(prev => ({
      ...prev,
      tagsPrivados: [...prev.tagsPrivados, tagToAdd]
    }));
    setTagInputPrivados('');
  };

  const handleRemovePrivateTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tagsPrivados: prev.tagsPrivados.filter(t => t !== tag)
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
        dni: formData.dni.replace(/ /g, '').trim(),
        telefono: formData.telefono,
        tags: formData.tags,
        tagsPrivados: formData.tagsPrivados,
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
          dni: formData.dni.replace(/ /g, '').trim(),
          telefono: formData.telefono,
          tags: formData.tags,
          tagsPrivados: formData.tagsPrivados,
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

  const handleChangePassword = async (e) => {
    e?.preventDefault?.();
    if (newPassword.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('Las contraseñas no coinciden');
      return;
    }
    if (!window.confirm('¿Estás seguro de que deseas cambiar la contraseña de este usuario?')) {
      return;
    }
    setSavingPassword(true);
    try {
      await axios.put(`/users/${id}/password`, { password: newPassword });
      showSuccess('Contraseña actualizada');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.msg ||
        'Error al cambiar la contraseña';
      showError(msg);
    } finally {
      setSavingPassword(false);
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
        dni: formData.dni.replace(/ /g, '').trim(),
        telefono: formData.telefono,
        tags: formData.tags,
        tagsPrivados: formData.tagsPrivados
      });
      showSuccess('Usuario actualizado exitosamente');
      fetchUser();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al actualizar usuario');
    } finally {
      setSaving(false);
    }
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
                <label>DNI</label>
                <input
                  type="text"
                  name="dni"
                  value={formData.dni}
                  onChange={handleChange}
                  inputMode="numeric"
                  autoComplete="off"
                  minLength={7}
                  maxLength={10}
                  pattern="\d{7,10}"
                  title="Entre 7 y 10 dígitos"
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

          {/* Contraseña (admin) */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Contraseña</h2>
            <p className="text-sm text-gray-600 mb-4">
              Establecé una nueva contraseña para este usuario. No podés ver la contraseña actual.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="admin-new-password">Nueva contraseña</label>
                <input
                  id="admin-new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleChangePassword(e);
                    }
                  }}
                  className="bg-white"
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label htmlFor="admin-confirm-password">Confirmar contraseña</label>
                <input
                  id="admin-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleChangePassword(e);
                    }
                  }}
                  className="bg-white"
                  minLength={6}
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={savingPassword || !newPassword || !confirmPassword}
                  onClick={handleChangePassword}
                >
                  {savingPassword ? 'Guardando…' : 'Actualizar contraseña'}
                </button>
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

          {/* Tags públicos */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Tags públicos</h2>
            <p className="text-sm text-gray-600 mb-4">
              Intereses del participante (también puede editarlos en &quot;Mis intereses&quot;). Catálogo:{' '}
              <a href="/admin/tags" className="text-primary hover:underline">tags públicos</a>.
            </p>
            <div className="form-group">
              <label>Tags del usuario</label>
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

          {/* Tags privados (admin) */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Tags privados</h2>
            <p className="text-sm text-gray-600 mb-4">
              Solo administración: segmentan qué actividades privadas puede ver este usuario. No se muestran al
              participante. Gestioná el catálogo en{' '}
              <a href="/admin/tags-privados" className="text-primary hover:underline">Tags privados</a>.
            </p>
            <div className="form-group">
              <label>Tags privados del usuario</label>
              <div className="flex gap-3 mb-3">
                <select
                  value={tagInputPrivados}
                  onChange={(e) => setTagInputPrivados(e.target.value)}
                  className="flex-1 bg-white"
                >
                  <option value="">Seleccionar tag privada</option>
                  {availablePrivateTags.length > 0 ? (
                    availablePrivateTags
                      .filter(tag => {
                        const tagNombreLower = tag.nombre.toLowerCase();
                        return !formData.tagsPrivados.some(t => t.toLowerCase() === tagNombreLower);
                      })
                      .map(tag => (
                        <option key={tag._id} value={tag.nombre}>
                          {tag.nombre.charAt(0).toUpperCase() + tag.nombre.slice(1)}
                          {tag.descripcion && ` - ${tag.descripcion}`}
                        </option>
                      ))
                  ) : (
                    <option value="" disabled>No hay tags privadas disponibles</option>
                  )}
                </select>
                <button
                  type="button"
                  onClick={handleAddPrivateTag}
                  className="btn btn-secondary"
                  disabled={!tagInputPrivados}
                >
                  Agregar
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tagsPrivados.map(tagNombre => {
                  const tag = availablePrivateTags.find(
                    t => t.nombre.toLowerCase() === tagNombre.toLowerCase()
                  );
                  const tagColor = tag?.color || '#92400E';
                  return (
                    <span
                      key={tagNombre}
                      className="badge flex items-center gap-2 text-white"
                      style={{ backgroundColor: tagColor }}
                    >
                      {tagNombre.charAt(0).toUpperCase() + tagNombre.slice(1)}
                      <button
                        type="button"
                        onClick={() => handleRemovePrivateTag(tagNombre)}
                        className="bg-transparent border-none text-white cursor-pointer hover:text-gray-200 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
              {availablePrivateTags.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  No hay tags privadas.{' '}
                  <a href="/admin/tags-privados" className="text-primary hover:underline">
                    Crear en catálogo privado
                  </a>
                </p>
              )}
            </div>
          </div>

          {/* Inscripciones Recientes */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-2 text-gray-800">Inscripciones Recientes</h2>
            <p className="text-sm text-gray-600 mb-4 break-words">
              {[formData.nombre, formData.apellido].filter(Boolean).join(' ').trim() || '—'}
              {' · '}
              {formData.telefono || '—'}
              {' · '}
              {formData.email || '—'}
            </p>
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
                      <th className="p-3 text-left align-middle font-semibold text-gray-700 text-sm">Evento</th>
                      <th className="p-3 text-left align-middle font-semibold text-gray-700 text-sm">Fecha y hora</th>
                      <th className="p-3 text-right align-middle font-semibold text-gray-700 text-sm w-28">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inscriptions.map(inscription => (
                      <tr 
                        key={inscription._id} 
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleRowClick(inscription)}
                      >
                        <td className="p-3 text-sm align-middle">
                          <div className="font-medium text-gray-800">
                            {inscription.activityId?.titulo || 'Actividad eliminada'}
                          </div>
                        </td>
                        <td className="p-3 text-sm align-middle text-gray-700 tabular-nums whitespace-nowrap">
                          {formatUtcCalendarDayAndTime(
                            inscription.fecha,
                            inscription.hora || inscription.activityId?.hora
                          )}
                        </td>
                        <td className="p-3 text-sm align-middle text-right" onClick={(e) => e.stopPropagation()}>
                          {inscription.estado === 'pendiente' ? (
                            <div className="flex items-center justify-end gap-2">
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

