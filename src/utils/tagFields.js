/**
 * Normaliza lectura de tags públicos/privados desde el API (nombres nuevos + legacy).
 */

export const DEFAULT_PUBLIC_TAG_COLOR = '#3B82F6';

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

export function activityPublicTags(activity) {
  if (!activity) return [];
  const v = activity.tags ?? activity.categorias;
  return Array.isArray(v) ? v : [];
}

export function activityPrivateTags(activity) {
  if (!activity) return [];
  const v = activity.tagsPrivados ?? activity.tagsVisibilidad;
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
