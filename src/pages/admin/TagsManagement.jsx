import { useSearchParams } from 'react-router-dom';
import TagCatalogManagement from './TagCatalogManagement';

const CONFIG = {
  public: {
    apiBase: '/tags',
    title: 'Tags',
    description:
      'Tags normales (públicos): intereses de participantes y temas de actividades visibles en búsqueda y cartelera.'
  },
  private: {
    apiBase: '/tags-privados',
    title: 'Tags',
    description:
      'Tags privados: solo administración. No se envían al frontend del participante. Sirven para segmentar qué actividades privadas puede ver cada usuario.'
  }
};

const TagsManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const scope = searchParams.get('catalog') === 'private' ? 'private' : 'public';
  const cfg = CONFIG[scope];

  const handleCatalogChange = (next) => {
    if (next === 'private') {
      setSearchParams({ catalog: 'private' }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  return (
    <TagCatalogManagement
      key={scope}
      apiBase={cfg.apiBase}
      title={cfg.title}
      description={cfg.description}
      catalogScope={scope}
      onCatalogScopeChange={handleCatalogChange}
    />
  );
};

export default TagsManagement;
