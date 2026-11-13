import { useEffect, useId, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Icon, cn } from '../ui';
import InstallBanner from './InstallBanner';
import PushBanner from './PushBanner';
import logoMalka from '../../assets/logo-malka-positivo.png';
import { SelectorIdioma, useIdioma } from '../../i18n';

/* Cada sección con su icono. `exact` evita que "Panel" (/admin) quede activo
   en todas las subrutas de admin; `also` agrupa rutas hermanas bajo la misma
   entrada (tags públicos y privados son la misma sección). Las primeras
   ADMIN_TAB_COUNT entradas van a la tab bar mobile; el resto vive en "Más". */
const ADMIN_LINKS = [
  { to: '/admin', label: 'Panel', icon: 'dashboard', exact: true },
  { to: '/admin/users', label: 'Personas', icon: 'users' },
  { to: '/admin/activities', label: 'Actividades', icon: 'activity' },
  { to: '/admin/inscriptions', label: 'Inscripciones', icon: 'document' },
  { to: '/admin/historial', label: 'Historial', icon: 'book', also: ['/admin/contactos'] },
  { to: '/admin/metricas', label: 'Métricas', icon: 'chart' },
  { to: '/admin/tags', label: 'Tags', icon: 'tag', also: ['/admin/tags-privados'] },
  { to: '/admin/settings', label: 'Ajustes', icon: 'settings' },
];
const ADMIN_TAB_COUNT = 4;

/* `tab` es la etiqueta corta para la barra inferior mobile. Los textos del
   participante salen del idioma elegido (`clave` en shell.links); el panel
   del equipo queda en castellano. */
const PARTICIPANT_LINKS = [
  { to: '/dashboard', clave: 'inicio', icon: 'dashboard', exact: true },
  { to: '/activities', clave: 'actividades', icon: 'activity' },
  { to: '/my-inscriptions', clave: 'inscripciones', icon: 'document' },
  // Los intereses viven en el perfil.
  { to: '/my-profile', clave: 'perfil', icon: 'user', also: ['/my-interests'] },
];

const SIDEBAR_KEY = 'malka.sidebar';

/**
 * Estructura de la app autenticada: sidebar colapsable en desktop; en mobile,
 * barra superior con el logo y tab bar inferior (admin suma un "Más" que abre
 * un sheet con las secciones restantes y el logout).
 *
 * El estado activo se marca por ruta — antes no había forma de saber en qué
 * sección estabas parado. El colapso persiste en localStorage para que la
 * preferencia sobreviva a la recarga.
 *
 * Los ítems son <button> con navigate, no <Link>: es lo que el resto de la
 * app (y el e2e) ya espera del nav.
 */
const AppShell = ({ children }) => {
  const { user, logout } = useAuth();
  const { t } = useIdioma();
  const navigate = useNavigate();
  const location = useLocation();
  const panelId = useId();

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_KEY) === 'collapsed'
  );
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const participantLinks = PARTICIPANT_LINKS.map((l) => ({
    ...l,
    label: t(`shell.links.${l.clave}`),
    tab: t(`shell.tabs.${l.clave}`),
  }));
  const links = isAdmin ? ADMIN_LINKS : participantLinks;
  /* Mobile app-like para ambos roles: los dos usan tab bar; admin no entra
     completo, así que sus últimas secciones (y el logout) viven en "Más". */
  const tabLinks = isAdmin ? ADMIN_LINKS.slice(0, ADMIN_TAB_COUNT) : participantLinks;
  const moreLinks = isAdmin ? ADMIN_LINKS.slice(ADMIN_TAB_COUNT) : [];

  const isActive = ({ to, exact, also = [] }) => {
    const { pathname } = location;
    if (exact) return pathname === to;
    return [to, ...also].some((base) => pathname === base || pathname.startsWith(`${base}/`));
  };

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      localStorage.setItem(SIDEBAR_KEY, prev ? 'expanded' : 'collapsed');
      return !prev;
    });
  };

  const go = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  /* El drawer mobile bloquea el scroll de fondo y cierra con Escape. */
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const navItem = (link, { inDrawer = false } = {}) => {
    const active = isActive(link);
    const iconOnly = collapsed && !inDrawer;

    return (
      <button
        key={link.to}
        type="button"
        onClick={() => go(link.to)}
        title={iconOnly ? link.label : undefined}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-start text-sm font-medium',
          'transition-control duration-fast motion-reduce:transition-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          iconOnly && 'justify-center px-0',
          active
            ? 'bg-primary-50 text-primary-700'
            : 'text-ink-soft hover:bg-primary-50/60 hover:text-ink'
        )}
      >
        <Icon name={link.icon} size="md" className={active ? 'text-primary' : 'text-ink-faint'} />
        {!iconOnly && <span className="truncate">{link.label}</span>}
      </button>
    );
  };

  return (
    <div className="min-h-screen">
      {/* ---------- Sidebar (desktop) ---------- */}
      <aside
        aria-label={t('shell.principal')}
        className={cn(
          'fixed inset-y-0 start-0 z-40 hidden flex-col border-e border-surface-border bg-surface lg:flex',
          'transition-[width] duration-slow ease-standard motion-reduce:transition-none',
          collapsed ? 'w-[4.75rem]' : 'w-64'
        )}
      >
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b border-surface-border',
            collapsed ? 'justify-center px-2' : 'px-4'
          )}
        >
          {collapsed ? (
            /* El logo completo no entra colapsado; queda el monograma. */
            <button
              type="button"
              onClick={() => go(user?.role === 'admin' ? '/admin' : '/dashboard')}
              aria-label={t('shell.irAlInicio')}
              className="flex h-9 w-9 items-center justify-center rounded-control bg-primary-50 font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              M
            </button>
          ) : (
            <button
              type="button"
              onClick={() => go(user?.role === 'admin' ? '/admin' : '/dashboard')}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <img src={logoMalka} alt="Malka" className="h-8 w-auto" />
            </button>
          )}

        </div>

        {/* Manija de colapso: flota en el borde de la barra, lejos del bloque
            de usuario/salir — pegado al logout se confundía con él. */}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? t('shell.expandir') : t('shell.colapsar')}
          title={collapsed ? t('shell.expandir') : t('shell.colapsar')}
          className="absolute -end-3 top-[4.5rem] z-10 flex h-6 w-6 items-center justify-center rounded-pill border border-surface-border bg-surface text-ink-faint shadow-subtle transition-chrome duration-fast hover:border-primary-300 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none"
        >
          <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size="xs" strokeWidth={2.5} className="rtl:-scale-x-100" />
        </button>

        <nav className={cn('flex-1 space-y-1 overflow-y-auto py-4', collapsed ? 'px-3' : 'px-3')}>
          {links.map((link) => navItem(link))}
        </nav>

        <div
          className={cn(
            'shrink-0 space-y-2 border-t border-surface-border py-4',
            collapsed ? 'px-3' : 'px-3'
          )}
        >
          {collapsed ? (
            <>
              <button
                type="button"
                onClick={handleLogout}
                title={t('comun.salir')}
                aria-label={t('comun.salir')}
                className="flex w-full items-center justify-center rounded-control py-2.5 text-ink-faint transition-control duration-fast hover:bg-danger-50 hover:text-danger-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <Icon name="logout" size="md" />
              </button>
            </>
          ) : (
            <>
              {/* El participante puede cambiar el idioma desde acá; el
                  equipo no (el panel está en castellano). */}
              {!isAdmin && <SelectorIdioma className="px-2" />}
              <p className="truncate px-3 text-sm font-medium text-ink-muted">
                {user?.nombre} {user?.apellido}
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-start text-sm font-medium text-ink-soft transition-control duration-fast hover:bg-danger-50 hover:text-danger-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <Icon name="logout" size="md" className="text-ink-faint rtl:-scale-x-100" />
                {t('comun.salir')}
              </button>
            </>
          )}
        </div>
      </aside>

      {/* ---------- Barra superior (mobile) ---------- */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-surface-border bg-surface px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => go(user?.role === 'admin' ? '/admin' : '/dashboard')}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <img src={logoMalka} alt="Malka" className="h-8 w-auto" />
        </button>

      </header>

      {/* ---------- Panel "Más" (mobile, admin) ----------
          Sube desde abajo como sheet: las secciones que no entran en la tab
          bar, más el logout. */}
      {isAdmin && menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] m-0 cursor-default border-none bg-ink/40 p-0 backdrop-blur-[2px] animate-overlay-in motion-reduce:animate-none lg:hidden"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
          />
          <div
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label="Más secciones"
            className="fixed inset-x-0 bottom-0 z-[70] flex flex-col rounded-t-panel bg-surface px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4 shadow-overlay animate-sheet-in motion-reduce:animate-none lg:hidden"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="min-w-0 break-words px-1 text-sm font-medium text-ink-muted">
                {user?.nombre} {user?.apellido}
              </p>
              <Button
                variant="ghost"
                size="sm"
                icon="close"
                iconOnly
                label="Cerrar"
                onClick={() => setMenuOpen(false)}
              />
            </div>

            <nav className="mb-3 space-y-1 border-b border-surface-border pb-3">
              {moreLinks.map((link) => navItem(link, { inDrawer: true }))}
            </nav>

            <Button variant="secondary" icon="logout" onClick={handleLogout} fullWidth>
              Salir
            </Button>
          </div>
        </>
      )}

      {/* ---------- Contenido ---------- */}
      <main
        className={cn(
          'transition-[padding] duration-slow ease-standard motion-reduce:transition-none',
          collapsed ? 'lg:ps-[4.75rem]' : 'lg:ps-64',
          /* Aire para que la tab bar no tape el final del contenido. */
          'pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:pb-0'
        )}
      >
        <InstallBanner />
        {!isAdmin && <PushBanner />}
        {children}
      </main>

      {/* ---------- Tab bar (mobile) ---------- */}
      <nav
        aria-label={t('shell.secciones')}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-surface-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <div className={cn('grid', isAdmin ? 'grid-cols-5' : 'grid-cols-4')}>
          {tabLinks.map((link) => {
            const active = isActive(link);
            return (
              <button
                key={link.to}
                type="button"
                onClick={() => go(link.to)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  isAdmin
                    ? 'flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 px-0.5 text-[0.625rem] font-medium'
                    : 'flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 px-1 text-[0.6875rem] font-medium',
                  'transition-control duration-fast motion-reduce:transition-none',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40',
                  active ? 'text-primary' : 'text-ink-faint'
                )}
              >
                <Icon name={link.icon} size="md" strokeWidth={active ? 2.25 : 2} />
                <span className="max-w-full truncate">{link.tab ?? link.label}</span>
              </button>
            );
          })}

          {isAdmin && (
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-controls={panelId}
              aria-current={moreLinks.some(isActive) ? 'page' : undefined}
              className={cn(
                isAdmin
                    ? 'flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 px-0.5 text-[0.625rem] font-medium'
                    : 'flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 px-1 text-[0.6875rem] font-medium',
                'transition-control duration-fast motion-reduce:transition-none',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40',
                moreLinks.some(isActive) ? 'text-primary' : 'text-ink-faint'
              )}
            >
              <Icon name="menu" size="md" strokeWidth={moreLinks.some(isActive) ? 2.25 : 2} />
              <span>Más</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
};

export default AppShell;
