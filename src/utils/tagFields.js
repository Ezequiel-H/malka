/**
 * Normaliza lectura de tags públicos/privados desde el API (nombres nuevos + legacy).
 */

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
