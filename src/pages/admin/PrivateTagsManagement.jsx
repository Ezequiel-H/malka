import TagCatalogManagement from './TagCatalogManagement';

const PrivateTagsManagement = () => (
  <TagCatalogManagement
    apiBase="/tags-privados"
    title="Tags privados"
    description="Solo administración. No se envían al frontend del participante. Sirven para segmentar qué actividades privadas puede ver cada usuario."
    crossLink={{ to: '/admin/tags', label: '← Tags públicos' }}
  />
);

export default PrivateTagsManagement;
