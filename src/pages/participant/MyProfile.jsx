import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatAuthError, normalizePhone } from '../../utils/authErrors';
import { birthDateToInputValue, formatLocalDateToString } from '../../utils/dateUtils';
import { publicTagColor, publicTagIcon, userPublicTags } from '../../utils/tagFields';
import { fechaEn } from '../../utils/participante';
import PageContainer from '../../components/layout/PageContainer';
import NotificationSettings from '../../components/profile/NotificationSettings';
import { Alert, Avatar, Button, DatePicker, Icon, Input, cn } from '../../components/ui';
import { SelectorIdioma, useIdioma } from '../../i18n';
import { RESTRICCIONES } from '../../utils/restricciones';

const ESPERA_GUARDADO_MS = 1200;

/* Lo que se puede cambiar de cada dato, y cómo se valida en el lugar. */
const CAMPOS = [
  { clave: 'nombre', icono: 'user', etiqueta: 'registro.nombre', tipo: 'text', autoComplete: 'given-name' },
  { clave: 'apellido', icono: 'user', etiqueta: 'registro.apellido', tipo: 'text', autoComplete: 'family-name' },
  { clave: 'telefono', icono: 'phone', etiqueta: 'registro.telefono', tipo: 'tel', dir: 'ltr', patron: /^[+]?[0-9]{8,20}$/, error: 'registro.telefonoInvalido' },
  { clave: 'fechaNacimiento', icono: 'cake', etiqueta: 'registro.fechaNacimiento', tipo: 'fecha' },
  { clave: 'dni', icono: 'document', etiqueta: 'registro.dni', tipo: 'text', dir: 'ltr', inputMode: 'numeric' },
  { clave: 'comoSeEntero', icono: 'sparkles', etiqueta: 'registro.comoTeEnteraste', tipo: 'text' },
];

const valorDe = (user, clave) => {
  if (clave === 'fechaNacimiento') return birthDateToInputValue(user?.fechaNacimiento);
  if (clave === 'telefono') return normalizePhone(user?.telefono);
  if (clave === 'dni') return String(user?.dni ?? '').replace(/ /g, '').trim();
  return user?.[clave] ?? '';
};

/** Una fila de dato: se toca, se edita ahí mismo y se guarda sola. */
const FilaDato = ({ campo, user, guardar, t, locale }) => {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState('');
  const [error, setError] = useState(null);
  const actual = valorDe(user, campo.clave);

  const abrir = () => {
    setValor(actual);
    setError(null);
    setEditando(true);
  };
  const terminar = async (v = valor) => {
    const limpio = campo.clave === 'telefono' || campo.clave === 'dni' ? String(v).replace(/\s/g, '') : String(v).trim();
    if (limpio === actual) return setEditando(false);
    if (!limpio && campo.clave !== 'comoSeEntero') return setError(t('perfil.obligatorio'));
    if (campo.patron && !campo.patron.test(limpio)) return setError(t(campo.error));
    const ok = await guardar({ [campo.clave]: limpio });
    if (ok) setEditando(false);
  };

  const mostrado = campo.clave === 'fechaNacimiento' && actual ? fechaEn(actual, locale, { day: 'numeric', month: 'long', year: 'numeric' }) : actual;
  const id = `perfil-${campo.clave}`;

  return (
    <li className="px-4 py-3">
      {editando ? (
        <div className="animate-fade-in">
          <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-ink-muted">
            {t(campo.etiqueta)}
          </label>
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              {campo.tipo === 'fecha' ? (
                <DatePicker id={id} name={campo.clave} value={valor} onChange={(v) => setValor(v)} max={formatLocalDateToString(new Date())} />
              ) : (
                <Input
                  id={id}
                  type={campo.tipo}
                  dir={campo.dir}
                  inputMode={campo.inputMode}
                  autoComplete={campo.autoComplete}
                  autoFocus
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') terminar();
                    if (e.key === 'Escape') setEditando(false);
                  }}
                />
              )}
              {error && <p className="mt-1 text-xs text-danger-600">{error}</p>}
            </div>
            <Button size="sm" onClick={() => terminar()}>
              {t('perfil.listo')}
            </Button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={abrir} className="flex w-full items-center gap-3 text-start">
          <Icon name={campo.icono} size="sm" className="shrink-0 text-ink-muted" />
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-ink-muted">{t(campo.etiqueta)}</span>
            <span dir={campo.dir ?? 'auto'} className={cn('block truncate text-sm font-medium', mostrado ? 'text-ink' : 'text-ink-faint')}>
              {mostrado || t('perfil.sinCargar')}
            </span>
          </span>
          <Icon name="chevronRight" size="sm" className="shrink-0 text-ink-faint rtl:-scale-x-100" />
        </button>
      )}
    </li>
  );
};

/**
 * El perfil: los datos como una lista que se toca para cambiar (cada uno se
 * guarda solo), y los intereses y la comida como pastillas que se prenden.
 * También el idioma, las notificaciones y salir.
 */
const MyProfile = () => {
  const { user, updateUser, updateMyTags, logout } = useAuth();
  const { showError } = useToast();
  const { t, locale } = useIdioma();
  const navigate = useNavigate();
  const location = useLocation();
  const [catalogo, setCatalogo] = useState([]);
  const [intereses, setIntereses] = useState(() => userPublicTags(user));
  const [restricciones, setRestricciones] = useState(() => user?.restriccionesAlimentarias ?? []);
  const [estado, setEstado] = useState(null); // null | 'guardando' | 'guardado'
  const espera = useRef({});
  const interesesRef = useRef(null);

  useEffect(() => {
    axios
      .get('/tags?activa=true')
      .then((res) => setCatalogo(res.data.tags || []))
      .catch(() => showError(t('misIntereses.errorTags')));
  }, [showError, t]);

  /* Desde «Elegir intereses» se llega directo a esa parte. */
  useEffect(() => {
    if (location.hash === '#intereses') interesesRef.current?.scrollIntoView({ block: 'start' });
  }, [location.hash]);

  useEffect(() => () => Object.values(espera.current).forEach(clearTimeout), []);

  const guardar = async (cambio) => {
    setEstado('guardando');
    try {
      const res = await axios.patch('/users/me', cambio);
      if (res.data?.user) updateUser(res.data.user);
      setEstado('guardado');
      return true;
    } catch (error) {
      setEstado(null);
      showError(formatAuthError(error, t('perfil.error')));
      return false;
    }
  };

  /* Las pastillas se guardan solas 1,2 s después del último toque. */
  const guardarDespues = (clave, accion) => {
    clearTimeout(espera.current[clave]);
    setEstado('guardando');
    espera.current[clave] = setTimeout(accion, ESPERA_GUARDADO_MS);
  };
  const cambiarIntereses = (next) => {
    setIntereses(next);
    guardarDespues('tags', async () => {
      const r = await updateMyTags(next);
      if (r.success) setEstado('guardado');
      else {
        setEstado(null);
        showError(r.message || t('misIntereses.errorGuardar'));
      }
    });
  };
  const cambiarRestriccion = (valor) => {
    const next = restricciones.includes(valor) ? restricciones.filter((r) => r !== valor) : [...restricciones, valor];
    setRestricciones(next);
    guardarDespues('restricciones', () => guardar({ restriccionesAlimentarias: next }));
  };

  if (!user) return null;
  const nombre = [user.nombre, user.apellido].filter(Boolean).join(' ');
  const desde = user.createdAt ? fechaEn(String(user.createdAt).slice(0, 10), locale, { month: 'long', year: 'numeric' }) : null;

  return (
    <PageContainer title={t('shell.links.perfil')} maxWidth="2xl">
      <div className="space-y-7">
        <div className="flex items-center gap-4">
          <Avatar nombre={nombre} tamano={64} borde={false} />
          <div className="min-w-0 flex-1">
            <p dir="auto" className="truncate font-grotesk text-xl font-semibold text-ink">
              {nombre}
            </p>
            {desde && <p className="text-sm text-ink-muted">{t('perfil.desde', { desde })}</p>}
          </div>
          <span className="text-xs text-ink-muted" aria-live="polite">
            {estado === 'guardando' ? t('comun.guardando') : estado === 'guardado' ? (
              <span className="inline-flex items-center gap-1">
                <Icon name="check" size="xs" className="text-success-700" />
                {t('perfil.guardadoSolo')}
              </span>
            ) : null}
          </span>
        </div>

        {user.estado === 'pending' && (
          <Alert tone="info" title={t('perfil.validandoTitulo')}>
            {t('perfil.validandoTexto')}
          </Alert>
        )}

        <section aria-labelledby="mis-datos">
          <h2 id="mis-datos" className="mb-2 px-1 text-xs font-semibold uppercase tracking-label text-ink-faint">
            {t('perfil.misDatos')}
          </h2>
          <ul className="divide-y divide-surface-border rounded-[18px] border border-surface-border bg-surface">
            <li className="flex items-center gap-3 px-4 py-3">
              <Icon name="mail" size="sm" className="shrink-0 text-ink-muted" />
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-ink-muted">{t('registro.email')}</span>
                <span dir="ltr" className="block truncate text-sm font-medium text-ink">
                  {user.email}
                </span>
              </span>
              <span className="shrink-0 text-xs text-ink-faint">{t('perfil.emailFijo')}</span>
            </li>
            {CAMPOS.map((campo) => (
              <FilaDato key={campo.clave} campo={campo} user={user} guardar={guardar} t={t} locale={locale} />
            ))}
          </ul>
          <p className="mt-2 px-1 text-xs text-ink-muted">{t('perfil.tocaParaCambiar')}</p>
        </section>

        <section id="intereses" ref={interesesRef} aria-labelledby="me-interesa" className="scroll-mt-24">
          <h2 id="me-interesa" className="mb-1 px-1 text-xs font-semibold uppercase tracking-label text-ink-faint">
            {t('perfil.meInteresa')}
          </h2>
          <p className="mb-3 px-1 text-sm text-ink-muted">{t('perfil.meInteresaTexto')}</p>
          {catalogo.length === 0 ? (
            <p className="px-1 text-sm text-ink-muted">{t('misIntereses.sinCatalogo')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {catalogo.map((tag) => {
                const activo = intereses.some((x) => String(x).toLowerCase() === tag.nombre.toLowerCase());
                const color = publicTagColor(catalogo, tag.nombre);
                return (
                  <button
                    key={tag._id ?? tag.nombre}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => cambiarIntereses(activo ? intereses.filter((x) => String(x).toLowerCase() !== tag.nombre.toLowerCase()) : [...intereses, tag.nombre])}
                    className={cn(
                      'inline-flex min-h-[38px] items-center gap-2 rounded-pill border px-3.5 text-sm font-medium capitalize transition-colors duration-base',
                      activo ? 'border-transparent text-surface' : 'border-surface-border bg-surface text-ink-soft hover:border-ink/25',
                    )}
                    style={activo ? { background: color } : undefined}
                  >
                    <Icon name={activo ? 'check' : publicTagIcon(catalogo, tag.nombre) || 'tag'} size="xs" style={activo ? undefined : { color }} />
                    {tag.nombre}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section aria-labelledby="comida">
          <h2 id="comida" className="mb-3 px-1 text-xs font-semibold uppercase tracking-label text-ink-faint">
            {t('perfil.comida')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {RESTRICCIONES.map(({ valor, clave }) => {
              const activa = restricciones.includes(valor);
              return (
                <button
                  key={valor}
                  type="button"
                  aria-pressed={activa}
                  onClick={() => cambiarRestriccion(valor)}
                  className={cn(
                    'inline-flex min-h-[38px] items-center gap-1.5 rounded-pill border px-3.5 text-sm transition-colors duration-base',
                    activa ? 'border-transparent bg-ink text-surface' : 'border-surface-border bg-surface text-ink-soft hover:border-ink/25',
                  )}
                >
                  {activa && <Icon name="check" size="xs" />}
                  {t(`registro.restricciones.${clave}`)}
                </button>
              );
            })}
          </div>
        </section>

        {/* El idioma se guarda en la cuenta: vale en cualquier dispositivo. */}
        <section aria-labelledby="perfil-idioma">
          <h2 id="perfil-idioma" className="mb-1 px-1 text-xs font-semibold uppercase tracking-label text-ink-faint">
            {t('comun.idioma')}
          </h2>
          <p className="mb-2 px-1 text-sm text-ink-muted">{t('perfil.idiomaTexto')}</p>
          <SelectorIdioma className="-ms-2" />
        </section>

        <NotificationSettings className="rounded-[18px] border border-surface-border bg-surface p-4" />

        {/* En mobile no hay sidebar ni drawer: el logout vive acá. */}
        <div className="lg:hidden">
          <Button
            variant="ghost"
            icon="logout"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            fullWidth
            className="text-danger-600 hover:bg-danger-50 hover:text-danger-700"
          >
            {t('perfil.cerrarSesion')}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
};

export default MyProfile;
