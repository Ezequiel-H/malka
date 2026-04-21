import { useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logoMalka from '../../assets/logo-malka-positivo.png';

const navLinkClass =
  'text-left text-gray-700 font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-none py-3 px-1 min-h-[44px] flex items-center lg:p-0 lg:min-h-0';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const panelId = useId();

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    closeMenu();
    logout();
    navigate('/login');
  };

  const go = (path) => {
    closeMenu();
    navigate(path);
  };

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

  const adminLinks = (
    <>
      <button type="button" onClick={() => go('/admin/users')} className={navLinkClass}>
        Usuarios
      </button>
      <button type="button" onClick={() => go('/admin/activities')} className={navLinkClass}>
        Actividades
      </button>
      <button type="button" onClick={() => go('/admin/inscriptions')} className={navLinkClass}>
        Inscripciones
      </button>
      <button type="button" onClick={() => go('/admin/tags')} className={navLinkClass}>
        Tags
      </button>
    </>
  );

  const participantLinks = (
    <>
      <button type="button" onClick={() => go('/my-profile')} className={navLinkClass}>
        Mi perfil
      </button>
      <button type="button" onClick={() => go('/activities')} className={navLinkClass}>
        Actividades
      </button>
      <button type="button" onClick={() => go('/my-interests')} className={navLinkClass}>
        Mis intereses
      </button>
      <button type="button" onClick={() => go('/my-inscriptions')} className={navLinkClass}>
        Mis Inscripciones
      </button>
    </>
  );

  return (
    <nav className="bg-white shadow-md mb-8 sticky top-0 z-50" aria-label="Principal">
      <div className="max-w-7xl mx-auto px-4 sm:px-5 py-3 sm:py-4">
        <div className="flex justify-between items-center gap-3">
          <button
            onClick={() => {
              closeMenu();
              navigate('/dashboard');
            }}
            className="flex items-center gap-3 cursor-pointer bg-transparent border-none p-0 shrink-0 min-h-[44px]"
            type="button"
          >
            <img src={logoMalka} alt="Malka" className="h-9 sm:h-10 w-auto" />
            <span className="sr-only">Malka</span>
          </button>

          {/* Desktop */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-6 shrink-0">
            {user?.role === 'admin' ? adminLinks : participantLinks}
            <span className="ml-2 xl:ml-4 text-gray-600 font-medium whitespace-nowrap max-w-[10rem] xl:max-w-none truncate">
              {user?.nombre} {user?.apellido}
            </span>
            <button type="button" onClick={handleLogout} className="btn btn-secondary shrink-0">
              Salir
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="lg:hidden inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2.5 text-gray-700 hover:bg-gray-50 min-h-[44px] min-w-[44px]"
            aria-expanded={menuOpen}
            aria-controls={panelId}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer + backdrop */}
      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-black/40 lg:hidden cursor-default border-none p-0 m-0"
            aria-label="Cerrar menú"
            onClick={closeMenu}
          />
          <div
            id={panelId}
            className="fixed top-0 right-0 z-[70] flex h-full w-[min(20rem,calc(100vw-2rem))] max-w-full flex-col border-l border-gray-100 bg-white shadow-xl lg:hidden pt-16 pb-6 px-4 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
          >
            <div className="flex flex-col border-b border-gray-100 pb-4 mb-4">
              {user?.role === 'admin' ? adminLinks : participantLinks}
            </div>
            <p className="text-sm text-gray-600 font-medium px-1 mb-4 break-words">
              {user?.nombre} {user?.apellido}
            </p>
            <button type="button" onClick={handleLogout} className="btn btn-secondary w-full mt-auto">
              Salir
            </button>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;
