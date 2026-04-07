import TagCatalogManagement from './TagCatalogManagement';

const TagsManagement = () => (
  <TagCatalogManagement
    apiBase="/tags"
    title="Tags públicos"
    description="Intereses de participantes y temas de actividades visibles en búsqueda y cartelera."
    crossLink={{ to: '/admin/tags-privados', label: 'Gestionar tags privados →' }}
  />
);

export default TagsManagement;
