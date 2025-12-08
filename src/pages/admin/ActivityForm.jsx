import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';

const ActivityForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    categorias: [],
    tipo: 'unica',
    fecha: '',
    hora: '',
    lugar: 'Malka, 3 de Febrero 1325',
    ubicacionOnline: 'https://maps.app.goo.gl/Wd2mjrQy7MJiKmMZ8',
    precio: 0,
    esGratuita: true,
    cupo: '',
    requiereAprobacion: false,
    estado: 'borrador',
    duracion: '',
    politicaCancelacion: '',
    recordatoriosAutomaticos: true,
    visibilidad: 'publica',
    tagsVisibilidad: [],
    // Recurrencia
    recurrence: {
      frequency: 'weekly',
      daysOfWeek: [], // Array para múltiples días
      dayOfMonth: '',
      endDate: '',
      occurrences: '',
      hora: '' // Hora para actividades recurrentes
    }
  });

  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableTags, setAvailableTags] = useState([]);

  useEffect(() => {
    fetchAvailableTags();
    if (isEdit) {
      fetchActivity();
    }
  }, [id]);

  const fetchAvailableTags = async () => {
    try {
      const response = await axios.get('/tags?activa=true');
      const tags = response.data.tags || [];
      setAvailableTags(tags);
      console.log('Tags cargadas:', tags); // Debug
    } catch (error) {
      console.error('Error fetching tags:', error);
      setAvailableTags([]);
    }
  };

  const fetchActivity = async () => {
    try {
      const response = await axios.get(`/activities/${id}`);
      const activity = response.data.activity;
      const recurrence = activity.recurrence || formData.recurrence;
      
      // Asegurar que daysOfWeek y dayOfMonth sean arrays
      if (recurrence && !Array.isArray(recurrence.daysOfWeek) && recurrence.dayOfWeek !== undefined) {
        recurrence.daysOfWeek = [recurrence.dayOfWeek];
      }
      if (recurrence && !Array.isArray(recurrence.dayOfMonth) && recurrence.dayOfMonth !== undefined && typeof recurrence.dayOfMonth === 'number') {
        recurrence.dayOfMonth = [recurrence.dayOfMonth];
      }
      
      setFormData({
        ...activity,
        fecha: activity.fecha ? new Date(activity.fecha).toISOString().split('T')[0] : '',
        cupo: activity.cupo || '',
        duracion: activity.duracion || '',
        hora: activity.hora || (recurrence?.hora || ''),
        recurrence: {
          ...formData.recurrence,
          ...recurrence,
          daysOfWeek: recurrence.daysOfWeek || [],
          dayOfMonth: recurrence.dayOfMonth || [],
          endDate: recurrence.endDate ? new Date(recurrence.endDate).toISOString().split('T')[0] : '',
          hora: recurrence.hora || activity.hora || ''
        }
      });
    } catch (error) {
      console.error('Error fetching activity:', error);
      setError('Error al cargar la actividad');
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
    if (tagInput.trim() && !formData.tagsVisibilidad.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tagsVisibilidad: [...prev.tagsVisibilidad, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleAddTagFromSelect = (tagNombre) => {
    if (tagNombre) {
      const tagNombreLower = tagNombre.toLowerCase();
      const alreadyExists = formData.tagsVisibilidad.some(t => t.toLowerCase() === tagNombreLower);
      if (!alreadyExists) {
        // Usar el nombre exacto de la tag del backend para mantener consistencia
        const tagFromBackend = availableTags.find(t => t.nombre.toLowerCase() === tagNombreLower);
        const tagToAdd = tagFromBackend ? tagFromBackend.nombre : tagNombre;
        setFormData(prev => ({
          ...prev,
          tagsVisibilidad: [...prev.tagsVisibilidad, tagToAdd]
        }));
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tagsVisibilidad: prev.tagsVisibilidad.filter(t => t !== tag)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validar recurrencia
      if (formData.tipo === 'recurrente') {
        if (formData.recurrence.frequency === 'weekly' && (!formData.recurrence.daysOfWeek || formData.recurrence.daysOfWeek.length === 0)) {
          setError('Debes seleccionar al menos un día de la semana');
          setLoading(false);
          return;
        }
        if (formData.recurrence.frequency === 'monthly' && (!formData.recurrence.dayOfMonth || formData.recurrence.dayOfMonth.length === 0)) {
          setError('Debes seleccionar al menos un día del mes');
          setLoading(false);
          return;
        }
        if (!formData.recurrence.hora && !formData.hora) {
          setError('Debes especificar la hora para actividades recurrentes');
          setLoading(false);
          return;
        }
      }

      const dataToSend = {
        ...formData,
        fecha: formData.tipo === 'unica' ? formData.fecha : (formData.tipo === 'recurrente' && formData.recurrence.frequency === 'daily' ? formData.fecha : undefined),
        hora: formData.tipo === 'recurrente' ? (formData.recurrence.hora || formData.hora) : formData.hora,
        cupo: formData.cupo ? Number(formData.cupo) : null,
        duracion: formData.duracion ? Number(formData.duracion) : null,
        precio: formData.esGratuita ? 0 : Number(formData.precio),
        recurrence: formData.tipo === 'recurrente' ? {
          ...formData.recurrence,
          dayOfWeek: formData.recurrence.daysOfWeek?.[0], // Mantener compatibilidad con el modelo
          daysOfWeek: formData.recurrence.daysOfWeek || [],
          dayOfMonth: formData.recurrence.dayOfMonth || [],
          endDate: formData.recurrence.endDate || null,
          occurrences: formData.recurrence.occurrences || null,
          hora: formData.recurrence.hora || formData.hora
        } : undefined
      };

      if (isEdit) {
        await axios.put(`/activities/${id}`, dataToSend);
        showSuccess('Actividad actualizada exitosamente');
      } else {
        await axios.post('/activities', dataToSend);
        showSuccess('Actividad creada exitosamente');
      }
      navigate('/admin/activities');
    } catch (error) {
      setError(error.response?.data?.message || 'Error al guardar la actividad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-bg py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-primary">
          {isEdit ? 'Editar Actividad' : 'Nueva Actividad'}
        </h1>

        {error && (
          <div className="alert alert-error">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label>Título *</label>
          <input
            type="text"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            required
            className="bg-white"
          />
        </div>

        <div className="form-group">
          <label>Descripción *</label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            required
            className="bg-white"
          />
        </div>

        <div className="form-group">
          <label>Tags / Categorías</label>
          <p className="text-sm text-gray-600 mb-2">
            Selecciona las tags que categorizan esta actividad
          </p>
          <div className="flex gap-3 mb-3">
            <select
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
              }}
              className="flex-1 bg-white"
            >
              <option value="">Seleccionar tag</option>
              {availableTags.length > 0 ? (
                availableTags
                  .filter(tag => {
                    const tagNombreLower = tag.nombre.toLowerCase();
                    return !formData.categorias.some(c => c.toLowerCase() === tagNombreLower);
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
              onClick={() => {
                if (tagInput) {
                  const tagNombreLower = tagInput.toLowerCase();
                  const alreadyExists = formData.categorias.some(c => c.toLowerCase() === tagNombreLower);
                  if (!alreadyExists) {
                    const tagFromBackend = availableTags.find(t => t.nombre.toLowerCase() === tagNombreLower);
                    const tagToAdd = tagFromBackend ? tagFromBackend.nombre : tagInput;
                    setFormData(prev => ({
                      ...prev,
                      categorias: [...prev.categorias, tagToAdd]
                    }));
                    setTagInput('');
                  }
                }
              }} 
              className="btn btn-secondary"
              disabled={!tagInput}
            >
              Agregar
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.categorias.map(cat => {
              const tag = availableTags.find(t => t.nombre.toLowerCase() === cat.toLowerCase());
              const tagColor = tag?.color || '#3B82F6';
              return (
                <span 
                  key={cat} 
                  className="badge flex items-center gap-2 text-white"
                  style={{ backgroundColor: tagColor }}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        categorias: prev.categorias.filter(c => c !== cat)
                      }));
                    }}
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

        <div className="form-group">
          <label>Tipo *</label>
          <select
            name="tipo"
            value={formData.tipo}
            onChange={handleChange}
            required
            className="bg-white"
          >
            <option value="unica">Única</option>
            <option value="recurrente">Recurrente</option>
          </select>
        </div>

        {formData.tipo === 'unica' ? (
          <>
            <div className="form-group">
              <label>Fecha</label>
              <input
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                className="bg-white"
              />
            </div>
            <div className="form-group">
              <label>Hora</label>
              <input
                type="time"
                name="hora"
                value={formData.hora}
                onChange={handleChange}
                className="bg-white"
              />
            </div>
          </>
        ) : (
          <>
            <div className="form-group">
              <label>Frecuencia *</label>
              <select
                name="recurrence.frequency"
                value={formData.recurrence.frequency}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  recurrence: { 
                    ...prev.recurrence, 
                    frequency: e.target.value,
                    daysOfWeek: e.target.value === 'weekly' ? prev.recurrence.daysOfWeek : [],
                    dayOfMonth: e.target.value === 'monthly' ? prev.recurrence.dayOfMonth : ''
                  }
                }))}
                className="bg-white"
                required
              >
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
                <option value="daily">Diaria</option>
              </select>
            </div>

            <div className="form-group">
              <label>Hora *</label>
              <input
                type="time"
                value={formData.recurrence.hora || formData.hora}
                onChange={(e) => {
                  const hora = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    hora,
                    recurrence: { ...prev.recurrence, hora }
                  }));
                }}
                className="bg-white"
                required
              />
            </div>

            {formData.recurrence.frequency === 'weekly' && (
              <div className="form-group">
                <label>Días de la Semana *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                  {[
                    { value: 0, label: 'Domingo' },
                    { value: 1, label: 'Lunes' },
                    { value: 2, label: 'Martes' },
                    { value: 3, label: 'Miércoles' },
                    { value: 4, label: 'Jueves' },
                    { value: 5, label: 'Viernes' },
                    { value: 6, label: 'Sábado' }
                  ].map(day => (
                    <label key={day.value} className="flex items-center cursor-pointer p-2 border rounded hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.recurrence.daysOfWeek?.includes(day.value) || false}
                        onChange={(e) => {
                          const daysOfWeek = formData.recurrence.daysOfWeek || [];
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              recurrence: {
                                ...prev.recurrence,
                                daysOfWeek: [...daysOfWeek, day.value].sort((a, b) => a - b)
                              }
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              recurrence: {
                                ...prev.recurrence,
                                daysOfWeek: daysOfWeek.filter(d => d !== day.value)
                              }
                            }));
                          }
                        }}
                        className="mr-2 w-4 h-4 text-primary focus:ring-primary rounded"
                      />
                      <span>{day.label}</span>
                    </label>
                  ))}
                </div>
                {formData.recurrence.daysOfWeek?.length === 0 && (
                  <p className="text-sm text-red-500 mt-1">Selecciona al menos un día</p>
                )}
              </div>
            )}

            {formData.recurrence.frequency === 'monthly' && (
              <div className="form-group">
                <label>Días del Mes *</label>
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-2">Selecciona los días del mes (1-31):</p>
                  <div className="grid grid-cols-8 sm:grid-cols-10 gap-2">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <label key={day} className="flex items-center justify-center cursor-pointer p-2 border rounded hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.recurrence.dayOfMonth?.includes(day) || false}
                          onChange={(e) => {
                            const dayOfMonth = formData.recurrence.dayOfMonth || [];
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                recurrence: {
                                  ...prev.recurrence,
                                  dayOfMonth: [...dayOfMonth, day].sort((a, b) => a - b)
                                }
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                recurrence: {
                                  ...prev.recurrence,
                                  dayOfMonth: dayOfMonth.filter(d => d !== day)
                                }
                              }));
                            }
                          }}
                          className="mr-1 w-4 h-4 text-primary focus:ring-primary rounded"
                        />
                        <span className="text-sm">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {(!formData.recurrence.dayOfMonth || formData.recurrence.dayOfMonth.length === 0) && (
                  <p className="text-sm text-red-500 mt-1">Selecciona al menos un día del mes</p>
                )}
              </div>
            )}

            {formData.recurrence.frequency === 'daily' && (
              <div className="form-group">
                <label>Fecha de Inicio</label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  className="bg-white"
                />
              </div>
            )}

            <div className="form-group">
              <label>Fecha de Fin (opcional)</label>
              <input
                type="date"
                value={formData.recurrence.endDate ? new Date(formData.recurrence.endDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  recurrence: { ...prev.recurrence, endDate: e.target.value ? new Date(e.target.value).toISOString() : '' }
                }))}
                className="bg-white"
              />
              <p className="text-sm text-gray-500 mt-1">Deja vacío si no tiene fecha de fin</p>
            </div>

            <div className="form-group">
              <label>Número de Ocurrencias (opcional)</label>
              <input
                type="number"
                min="1"
                value={formData.recurrence.occurrences || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  recurrence: { ...prev.recurrence, occurrences: e.target.value ? Number(e.target.value) : null }
                }))}
                className="bg-white"
                placeholder="Ej: 10 (para 10 sesiones)"
              />
              <p className="text-sm text-gray-500 mt-1">Deja vacío si no hay límite de ocurrencias</p>
            </div>
          </>
        )}

        <div className="form-group">
          <label>Lugar</label>
          <input
            type="text"
            name="lugar"
            value={formData.lugar}
            onChange={handleChange}
            className="bg-white"
          />
        </div>

        <div className="form-group">
          <label>Link de Google Maps</label>
          <input
            type="url"
            name="ubicacionOnline"
            value={formData.ubicacionOnline}
            onChange={handleChange}
            placeholder="https://maps.google.com/..."
            className="bg-white"
          />
          <p className="text-sm text-gray-500 mt-1">Ingresa el link de Google Maps de la ubicación del evento</p>
        </div>

        <div className="form-group">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="esGratuita"
              checked={formData.esGratuita}
              onChange={handleChange}
              className="mr-2 w-4 h-4 text-primary focus:ring-primary rounded"
            />
            <span>Actividad Gratuita</span>
          </label>
        </div>

        {!formData.esGratuita && (
          <div className="form-group">
            <label>Precio</label>
            <input
              type="number"
              name="precio"
              value={formData.precio}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="bg-white"
            />
          </div>
        )}

        <div className="form-group">
          <label>Cupo Máximo (opcional)</label>
          <input
            type="number"
            name="cupo"
            value={formData.cupo}
            onChange={handleChange}
            min="1"
            className="bg-white"
          />
        </div>

        <div className="form-group">
          <label>Duración (minutos)</label>
          <input
            type="number"
            name="duracion"
            value={formData.duracion}
            onChange={handleChange}
            min="0"
            className="bg-white"
          />
        </div>

        <div className="form-group">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="requiereAprobacion"
              checked={formData.requiereAprobacion}
              onChange={handleChange}
              className="mr-2 w-4 h-4 text-primary focus:ring-primary rounded"
            />
            <span>Requiere Aprobación</span>
          </label>
        </div>

        <div className="form-group">
          <label>Estado</label>
          <select
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            className="bg-white"
          >
            <option value="borrador">Borrador</option>
            <option value="publicada">Publicada</option>
          </select>
        </div>

        <div className="form-group">
          <label>Visibilidad</label>
          <select
            name="visibilidad"
            value={formData.visibilidad}
            onChange={handleChange}
            className="bg-white"
          >
            <option value="publica">Pública (visible para todos los usuarios aprobados)</option>
            <option value="privada">Privada (solo visible para usuarios con las tags requeridas)</option>
          </select>
          {formData.visibilidad === 'privada' && formData.tagsVisibilidad.length === 0 && (
            <p className="text-sm text-yellow-600 mt-2">
              ⚠️ Debes seleccionar al menos una tag para que la actividad privada sea visible
            </p>
          )}
        </div>

        {formData.visibilidad === 'privada' && (
          <div className="form-group">
            <label>Tags de Visibilidad</label>
            <p className="text-sm text-gray-600 mb-2">
              Selecciona las tags requeridas para que los usuarios puedan ver esta actividad
            </p>
            <div className="flex gap-3 mb-3">
              <select
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                }}
                className="flex-1 bg-white"
              >
                <option value="">Seleccionar tag</option>
                {availableTags.length > 0 ? (
                  availableTags
                    .filter(tag => {
                      const tagNombreLower = tag.nombre.toLowerCase();
                      return !formData.tagsVisibilidad.some(t => t.toLowerCase() === tagNombreLower);
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
                onClick={() => {
                  if (tagInput) {
                    handleAddTagFromSelect(tagInput);
                    setTagInput('');
                  }
                }} 
                className="btn btn-secondary"
                disabled={!tagInput}
              >
                Agregar
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tagsVisibilidad.map(tagNombre => {
                const tag = availableTags.find(t => t.nombre === tagNombre);
                const tagColor = tag?.color || '#F59E0B';
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
        )}

        <div className="form-group">
          <label>Política de Cancelación</label>
          <textarea
            name="politicaCancelacion"
            value={formData.politicaCancelacion}
            onChange={handleChange}
            placeholder="Describe la política de cancelación..."
            className="bg-white"
          />
        </div>

        <div className="form-group">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="recordatoriosAutomaticos"
              checked={formData.recordatoriosAutomaticos}
              onChange={handleChange}
              className="mr-2 w-4 h-4 text-primary focus:ring-primary rounded"
            />
            <span>Recordatorios Automáticos</span>
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="btn btn-primary flex-1"
            disabled={loading}
          >
            {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'} Actividad
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/activities')}
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

export default ActivityForm;

