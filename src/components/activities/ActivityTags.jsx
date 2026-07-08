import { activityPublicTags, publicTagColor } from '../../utils/tagFields';

const TagBadges = ({ tags, catalog }) =>
  tags.map(cat => (
    <span
      key={cat}
      className="badge text-white"
      style={{ backgroundColor: publicTagColor(catalog, cat) }}
    >
      {cat}
    </span>
  ));

/**
 * Tags públicos de una actividad.
 * - variant "card": franja inline sin título (siempre se renderiza).
 * - variant "detail": bloque con título "Tags" (solo si hay tags).
 */
const ActivityTags = ({ activity, catalog = [], variant = 'detail' }) => {
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
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Tags</h2>
      <div className="flex flex-wrap gap-2">
        <TagBadges tags={tags} catalog={catalog} />
      </div>
    </div>
  );
};

export default ActivityTags;
