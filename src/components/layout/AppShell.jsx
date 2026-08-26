import { useEffect, useId, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Icon, cn } from '../ui';
import logoMalka from '../../assets/logo-malka-positivo.png';

/* Cada sección con su icono. `exact` evita que "Panel" (/admin) quede activo
   en todas las subrutas de admin; `also` agrupa rutas hermanas bajo la misma
   entrada (tags públicos y privados son la misma sección). */
const ADMIN_LINKS = [
  { to: '/admin', label: 'Panel', icon: 'dashboard', exact: true },
  { to: '/admin/users', label: 'Usuarios', icon: 'users' },
  { to: '/admin/activities', label: 'Actividades', icon: 'activity' },
  { to: '/admin/inscriptions', label: 'Inscripciones', icon: 'document' },
  { to: '/admin/tags', label: 'Tags', icon: 'tag', also: ['/admin/tags-privados'] },
  { to: '/admin/settings', label: 'Ajustes', icon: 'settings' },
];

const PARTICIPANT_LINKS = [
  { to: '/activities', label: 'Actividades', icon: 'activity' },
  { to: '/my-inscriptions', label: 'Mis inscripciones', icon: 'document' },
  { to: '/my-interests', label: 'Mis intereses', icon: 'tag' },
  { to: '/my-profile', label: 'Mi perfil', icon: 'user' },
];

const SIDEBAR_KEY = 'malka.sidebar';

/**
 * Estructura de la app autenticada: sidebar colapsable en desktop, barra
 * superior con panel lateral en mobile.
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
  const navigate = useNavigate();
  const location = useLocation();
  const panelId = useId();

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_KEY) === 'collapsed'
  );
  const [menuOpen, setMenuOpen] = useState(false);

  const links = user?.role === 'admin' ? ADMIN_LINKS : PARTICIPANT_LINKS;

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
          'flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left text-sm font-medium',
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
        aria-label="Principal"
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-surface-border bg-surface lg:flex',
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
              onClick={() => go(user?.role === 'admin' ? '/admin' : '/activities')}
              aria-label="Ir al inicio"
              className="flex h-9 w-9 items-center justify-center rounded-control bg-primary-50 font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              M
            </button>
          ) : (
            <button
              type="button"
              onClick={() => go(user?.role === 'admin' ? '/admin' : '/activities')}
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
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          className="absolute -right-3 top-[4.5rem] z-10 flex h-6 w-6 items-center justify-center rounded-pill border border-surface-border bg-surface text-ink-faint shadow-subtle transition-chrome duration-fast hover:border-primary-300 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none"
        >
          <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size="xs" strokeWidth={2.5} />
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
                title="Salir"
                aria-label="Salir"
                className="flex w-full items-center justify-center rounded-control py-2.5 text-ink-faint transition-control duration-fast hover:bg-danger-50 hover:text-danger-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <Icon name="logout" size="md" />
              </button>
            </>
          ) : (
            <>
              <p className="truncate px-3 text-sm font-medium text-ink-muted">
                {user?.nombre} {user?.apellido}
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left text-sm font-medium text-ink-soft transition-control duration-fast hover:bg-danger-50 hover:text-danger-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <Icon name="logout" size="md" className="text-ink-faint" />
                Salir
              </button>
            </>
          )}
        </div>
      </aside>

      {/* ---------- Barra superior (mobile) ---------- */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-surface-border bg-surface px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => go(user?.role === 'admin' ? '/admin' : '/activities')}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <img src={logoMalka} alt="Malka" className="h-8 w-auto" />
        </button>

        <Button
          variant="secondary"
          icon={menuOpen ? 'close' : 'menu'}
          iconOnly
          label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          aria-controls={panelId}
          onClick={() => setMenuOpen((o) => !o)}
        />
      </header>

      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] m-0 cursor-default border-none bg-ink/40 p-0 backdrop-blur-[2px] lg:hidden"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
          />
          <div
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            className="fixed right-0 top-0 z-[70] flex h-full w-[min(20rem,calc(100vw-2rem))] max-w-full flex-col overflow-y-auto border-l border-surface-border bg-surface px-4 pb-6 pt-16 shadow-overlay lg:hidden"
          >
            <nav className="mb-4 space-y-1 border-b border-surface-border pb-4">
              {links.map((link) => navItem(link, { inDrawer: true }))}
            </nav>

            <p className="mb-4 break-words px-1 text-sm font-medium text-ink-muted">
              {user?.nombre} {user?.apellido}
            </p>

            <Button variant="secondary" icon="logout" onClick={handleLogout} fullWidth className="mt-auto">
              Salir
            </Button>
          </div>
        </>
      )}

      {/* ---------- Contenido ---------- */}
      <main
        className={cn(
          'transition-[padding] duration-slow ease-standard motion-reduce:transition-none',
          collapsed ? 'lg:pl-[4.75rem]' : 'lg:pl-64'
        )}
      >
        {children}
      </main>
    </div>
  );
};

export default AppShell;
