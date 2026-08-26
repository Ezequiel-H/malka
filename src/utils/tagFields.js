/**
 * Normaliza lectura de tags públicos/privados desde el API (nombres nuevos + legacy).
 */

export const DEFAULT_PUBLIC_TAG_COLOR = '#689b78';

/**
 * Busca una entrada del catálogo GET /tags por nombre (trim + case-insensitive).
 */
export function catalogTagByName(catalog, name) {
  if (!name || !Array.isArray(catalog)) return undefined;
  const n = String(name).trim().toLowerCase();
  return catalog.find(t => String(t?.nombre ?? '').trim().toLowerCase() === n);
}

/** Color público del catálogo para un nombre, o default si no hay match. */
export function publicTagColor(catalog, name) {
  const tag = catalogTagByName(catalog, name);
  const c = tag?.color;
  if (typeof c === 'string' && c.trim()) return c.trim();
  return DEFAULT_PUBLIC_TAG_COLOR;
}

/** Iconos elegibles para una tag (nombres del registro del design system). */
export const TAG_ICON_OPTIONS = [
  'tag',
  // arte y escena
  'color', 'theater', 'film', 'camera', 'mic', 'music', 'guitar', 'piano',
  // comida y encuentro
  'food', 'chef', 'coffee', 'wine', 'cake', 'pizza',
  // cuerpo y afuera
  'sport', 'bike', 'trophy', 'plane', 'tent', 'mountain', 'waves', 'leaf', 'flower', 'sun', 'moon',
  // comunidad y espíritu
  'heart', 'care', 'users', 'baby', 'paw', 'flame', 'star', 'sparkles', 'crown', 'landmark',
  // aprender y jugar
  'book', 'languages', 'gradcap', 'idea', 'puzzle', 'gamepad', 'rocket', 'gift', 'party', 'globe',
];

/** Icono del catálogo para un nombre de tag, o '' si no definió uno. */
export function publicTagIcon(catalog, name) {
  const tag = catalogTagByName(catalog, name);
  const i = tag?.icono;
  return typeof i === 'string' && i.trim() ? i.trim() : '';
}

export function activityPublicTags(activity) {
  if (!activity) return [];
  const v = activity.tags ?? activity.categorias;
  return Array.isArray(v) ? v : [];
}

export function activityPrivateTags(activity) {
  if (!activity) return [];
  const v = activity.tagsPrivados;
  return Array.isArray(v) ? v : [];
}

export function userPublicTags(user) {
  if (!user) return [];
  return Array.isArray(user.tags) ? user.tags : [];
}

export function userPrivateTags(user) {
  if (!user) return [];
  return Array.isArray(user.tagsPrivados) ? user.tagsPrivados : [];
}
