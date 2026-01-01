import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';

const TagsManagement = () => {
  const { showSuccess, showError } = useToast();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    color: '#3B82F6',
    activa: true
  });
  const [filter, setFilter] = useState('all'); // all, active, inactive

  useEffect(() => {
    fetchTags();
  }, [filter]);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? `?activa=${filter === 'active'}` : '';
      const response = await axios.get(`/tags${params}`);
      setTags(response.data.tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
      showError('Error al cargar las tags');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTag) {
        await axios.put(`/tags/${editingTag._id}`, formData);
        showSuccess('Tag actualizada exitosamente');
      } else {
        await axios.post('/tags', formData);
        showSuccess('Tag creada exitosamente');
      }
      resetForm();
      fetchTags();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al guardar la tag';
      showError(errorMessage);
    }
  };

  const handleEdit = (tag) => {
    setEditingTag(tag);
    setFormData({
      nombre: tag.nombre,
      descripcion: tag.descripcion || '',
      color: tag.color || '#3B82F6',
      activa: tag.activa !== undefined ? tag.activa : true
    });
    setShowForm(true);
  };

  const handleDelete = async (tagId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta tag?')) {
      return;
    }

    try {
      await axios.delete(`/tags/${tagId}`);
      showSuccess('Tag eliminada exitosamente');
      fetchTags();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al eliminar la tag';
      if (error.response?.data?.details) {
        const details = error.response.data.details;
        showError(`${errorMessage}\n\nEn uso por:\n- ${details.actividades} actividad(es)\n- ${details.usuarios} usuario(s)`);
      } else {
        showError(errorMessage);
      }
    }
  };

  const handleToggleActive = async (tag) => {
    try {
      await axios.put(`/tags/${tag._id}`, { activa: !tag.activa });
      fetchTags();
    } catch (error) {
      showError('Error al cambiar el estado de la tag');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      color: '#3B82F6',
      activa: true
    });
    setEditingTag(null);
    setShowForm(false);
  };

  const filteredTags = tags.filter(tag => {
    if (filter === 'all') return true;
    if (filter === 'active') return tag.activa;
    if (filter === 'inactive') return !tag.activa;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-light-bg flex flex-col items-center justify-center">
        <div className="spinner"></div>
        <p className="mt-4 text-gray-600">Cargando tags...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-4xl font-bold text-primary">Gestión de Tags</h1>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="btn btn-primary"
          >
            Nueva Tag
          </button>
        </div>

        {/* Filtro */}
        <div className="card mb-8">
          <div className="form-group">
            <label>Filtrar por estado</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white max-w-xs"
            >
              <option value="all">Todas</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
            </select>
          </div>
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="card mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              {editingTag ? 'Editar Tag' : 'Nueva Tag'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  className="bg-white"
                  placeholder="Ej: música, teatro, danza"
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  className="bg-white"
                  rows="3"
                  placeholder="Descripción opcional de la tag"
                />
              </div>

              <div className="form-group">
                <label>Color</label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="h-10 w-20 cursor-pointer"
                  />
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="bg-white flex-1"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="activa"
                    checked={formData.activa}
                    onChange={handleInputChange}
                    className="w-5 h-5"
                  />
                  <span>Tag activa</span>
                </label>
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary">
                  {editingTag ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de tags */}
        {filteredTags.length === 0 ? (
          <div className="card">
            <p className="text-gray-600 text-center py-4">
              No hay tags {filter !== 'all' && (filter === 'active' ? 'activas' : 'inactivas')}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTags.map(tag => (
              <div
                key={tag._id}
                className={`card hover:shadow-xl transition-shadow ${
                  !tag.activa ? 'opacity-60' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <h2 className="text-xl font-bold text-gray-800 capitalize">
                      {tag.nombre}
                    </h2>
                  </div>
                  <span
                    className={`badge ${
                      tag.activa ? 'badge-success' : 'badge-secondary'
                    }`}
                  >
                    {tag.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                {tag.descripcion && (
                  <p className="text-gray-600 mb-4 text-sm">{tag.descripcion}</p>
                )}

                <div className="mb-4 text-sm text-gray-600">
                  <p>
                    <strong>Color:</strong>{' '}
                    <span className="inline-block w-4 h-4 rounded-full align-middle mr-1"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.color}
                  </p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleEdit(tag)}
                    className="btn btn-secondary flex-1 min-w-[100px]"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleToggleActive(tag)}
                    className={`btn flex-1 min-w-[100px] ${
                      tag.activa ? 'btn-warning' : 'btn-success'
                    }`}
                  >
                    {tag.activa ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => handleDelete(tag._id)}
                    className="btn btn-danger flex-1 min-w-[100px]"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagsManagement;

