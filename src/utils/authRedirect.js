const STORAGE_KEY = 'authRedirect';

export function setAuthRedirect(path) {
  if (path && path !== '/login' && path !== '/register') {
    sessionStorage.setItem(STORAGE_KEY, path);
  }
}

export function getAuthRedirect() {
  return sessionStorage.getItem(STORAGE_KEY);
}

export function clearAuthRedirect() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function getReturnPathFromLocation(location) {
  const from = location?.state?.from;
  if (from?.pathname) {
    return `${from.pathname}${from.search || ''}`;
  }
  return getAuthRedirect();
}

export function resolvePostAuthPath(user, location) {
  const returnPath = getReturnPathFromLocation(location);
  if (returnPath) {
    clearAuthRedirect();
    return returnPath;
  }
  if (user?.role === 'admin') return '/admin';
  if (user?.estado === 'approved') return '/activities';
  return '/dashboard';
}
