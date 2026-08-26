import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { DEFAULT_PUBLIC_TAG_COLOR, TAG_ICON_OPTIONS } from '../../utils/tagFields';
import LoadingScreen from '../../components/layout/LoadingScreen';
import PageContainer from '../../components/layout/PageContainer';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  ColorInput,
  EmptyState,
  Field,
  Icon,
  Input,
  Select,
  Textarea,
  useConfirm,
} from '../../components/ui';

/**
 * Catálogo de tags (público `/tags` o privado `/tags-privados`).
 */
const FILTER_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'active', label: 'Activas' },
  { value: 'inactive', label: 'Inactivas' },
];

const TagCatalogManagement = ({
  apiBase,
  title,
  description,
  crossLink,
  catalogScope,
  onCatalogScopeChange
}) => {
  const { showSuccess, showError } = useToast();
  const confirm = useConfirm();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    color: DEFAULT_PUBLIC_TAG_COLOR,
    activa: true
  });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTags();
  }, [filter, apiBase]);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? `?activa=${filter === 'active'}` : '';
      const response = await axios.get(`${apiBase}${params}`);
      setTags(response.data.tags || []);
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
        await axios.put(`${apiBase}/${editingTag._id}`, formData);
        showSuccess('Tag actualizada exitosamente');
      } else {
        await axios.post(apiBase, formData);
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
      color: tag.color || DEFAULT_PUBLIC_TAG_COLOR,
      icono: tag.icono || '',
      activa: tag.activa !== undefined ? tag.activa : true
    });
    setShowForm(true);
  };

  const handleDelete = async (tagId) => {
    const ok = await confirm({
      title: '¿Eliminar esta tag?',
      description: 'Se quita del catálogo. Las personas que la tengan asignada la pierden.',
      confirmLabel: 'Eliminar',
    });
    if (!ok) return;

    try {
      await axios.delete(`${apiBase}/${tagId}`);
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
      await axios.put(`${apiBase}/${tag._id}`, { activa: !tag.activa });
      fetchTags();
    } catch (error) {
      showError('Error al cambiar el estado de la tag');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      color: DEFAULT_PUBLIC_TAG_COLOR,
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
    return <LoadingScreen message="Cargando tags..." />;
  }

  return (
    <PageContainer
      title={title}
      actions={
        <>
          {onCatalogScopeChange && (
            <div
              className="inline-flex shrink-0 rounded-control bg-ink/[0.06] p-1"
              role="group"
              aria-label="Tipo de tags"
            >
              {[
                { scope: 'public', label: 'Normales' },
                { scope: 'private', label: 'Privados' },
              ].map(({ scope, label }) => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => onCatalogScopeChange(scope)}
                  aria-pressed={catalogScope === scope}
                  className={`rounded-[0.5rem] px-3 py-1.5 text-sm font-medium transition-control duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    catalogScope === scope
                      ? 'bg-surface text-primary shadow-subtle'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          <Button
            icon="add"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            Nueva tag
          </Button>
        </>
      }
    >
        {(description || (crossLink && !onCatalogScopeChange)) && (
          <p className="mb-6 max-w-2xl text-sm text-ink-muted">
            {description}
            {crossLink && !onCatalogScopeChange && (
              <>
                {' '}
                <Button variant="link" size="sm" to={crossLink.to} className="min-h-0 px-0 py-0">
                  {crossLink.label}
                </Button>
              </>
            )}
          </p>
        )}

        <Card className="mb-8">
          <Field label="Filtrar por estado" className="mb-0">
            <Select
              options={FILTER_OPTIONS}
              value={filter}
              onChange={(value) => setFilter(value ?? 'all')}
              className="max-w-xs"
            />
          </Field>
        </Card>

        {showForm && (
          <Card className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">
              {editingTag ? 'Editar tag' : 'Nueva tag'}
            </h2>
            <form onSubmit={handleSubmit}>
              <Field label="Nombre" required>
                <Input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  placeholder="Ej: música, staff, invitados VIP"
                />
              </Field>

              <Field label="Descripción">
                <Textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Descripción opcional"
                />
              </Field>

              <Field
                label="Icono"
                hint="Aparece en el chip de la tag para distinguirla de un vistazo."
              >
                <div className="flex flex-wrap gap-1.5">
                  {TAG_ICON_OPTIONS.map((nombre) => {
                    const activo = formData.icono === nombre;
                    return (
                      <button
                        key={nombre}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, icono: activo ? '' : nombre }))
                        }
                        aria-pressed={activo}
                        title={nombre}
                        className={`flex h-10 w-10 items-center justify-center rounded-control border transition-chrome duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-95 motion-reduce:transition-none ${
                          activo
                            ? 'border-primary bg-primary text-white shadow-subtle'
                            : 'border-surface-border bg-surface text-ink-soft hover:border-primary-300 hover:bg-primary-50'
                        }`}
                      >
                        <Icon name={nombre} size="md" />
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Color">
                {/* ColorInput emite el hex directo, no un evento; se envuelve
                    para reusar el mismo handleInputChange del resto del form. */}
                <ColorInput
                  value={formData.color}
                  onChange={(hex) =>
                    handleInputChange({ target: { name: 'color', value: hex, type: 'text' } })
                  }
                />
              </Field>

              <div className="mb-5">
                <Checkbox
                  name="activa"
                  label="Tag activa"
                  checked={formData.activa}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="submit" icon="check" className="w-full sm:w-auto">
                  {editingTag ? 'Actualizar' : 'Crear'}
                </Button>
                <Button type="button" variant="secondary" onClick={resetForm} className="w-full sm:w-auto">
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        )}

        {filteredTags.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon="tag"
              title="Sin tags"
              description={
                filter === 'all'
                  ? 'Todavía no hay tags en el catálogo.'
                  : `No hay tags ${filter === 'active' ? 'activas' : 'inactivas'}.`
              }
              action={
                <Button
                  icon="add"
                  size="sm"
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                >
                  Nueva tag
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTags.map(tag => (
              <Card key={tag._id} className={`flex flex-col ${!tag.activa ? 'opacity-60' : ''}`}>
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      <Icon name={tag.icono || 'tag'} size="md" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold capitalize leading-snug text-ink">
                        {tag.nombre}
                      </h2>
                      {/* El hex como metadato chico: el chip ya muestra el
                          color; la fila "Color: ● #hex" era una línea entera
                          para repetirlo. */}
                      <p className="font-mono text-xs uppercase text-ink-faint">{tag.color}</p>
                    </div>
                  </div>
                  <Badge tone={tag.activa ? 'success' : 'neutral'} dot className="shrink-0">
                    {tag.activa ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>

                {tag.descripcion && (
                  <p className="mb-3 line-clamp-2 text-sm text-ink-muted">{tag.descripcion}</p>
                )}

                {/* Una acción con texto; el resto, iconos con tooltip. */}
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-surface-border pt-3">
                  <Button variant="secondary" size="sm" icon="edit" onClick={() => handleEdit(tag)}>
                    Editar
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={tag.activa ? 'hide' : 'view'}
                      iconOnly
                      label={tag.activa ? 'Desactivar' : 'Activar'}
                      title={tag.activa ? 'Desactivar' : 'Activar'}
                      onClick={() => handleToggleActive(tag)}
                      className={
                        tag.activa
                          ? 'hover:bg-warning-50 hover:text-warning-600'
                          : 'hover:bg-success-50 hover:text-success-600'
                      }
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      icon="delete"
                      iconOnly
                      label="Eliminar"
                      title="Eliminar"
                      onClick={() => handleDelete(tag._id)}
                      className="hover:bg-danger-50 hover:text-danger-600"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
    </PageContainer>
  );
};

export default TagCatalogManagement;
