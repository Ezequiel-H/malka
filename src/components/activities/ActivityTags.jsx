import { activityPublicTags, publicTagColor, publicTagIcon } from '../../utils/tagFields';
import { Badge } from '../ui';
import { useIdioma } from '../../i18n/IdiomaContext';

const TagBadges = ({ tags, catalog }) =>
  tags.map((cat) => (
    <Badge
      key={cat}
      solid
      icon={publicTagIcon(catalog, cat) || undefined}
      style={{ backgroundColor: publicTagColor(catalog, cat) }}
    >
      {cat}
    </Badge>
  ));

/**
 * Tags públicos de una actividad.
 * - variant "card": franja inline sin título (siempre se renderiza).
 * - variant "detail": bloque con título "Tags" (solo si hay tags).
 */
const ActivityTags = ({ activity, catalog = [], variant = 'detail' }) => {
  const { t } = useIdioma();
  const tags = activityPublicTags(activity);

  if (variant === 'card') {
    return (
      <div className="mb-4 flex flex-wrap gap-2">
        <TagBadges tags={tags} catalog={catalog} />
      </div>
    );
  }

  if (tags.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="mb-2 text-xl font-semibold text-ink">{t('cartelera.tags')}</h2>
      <div className="flex flex-wrap gap-2">
        <TagBadges tags={tags} catalog={catalog} />
      </div>
    </div>
  );
};

export default ActivityTags;
