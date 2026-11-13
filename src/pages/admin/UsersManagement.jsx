import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { DateTime } from 'luxon';
import { useToast } from '../../contexts/ToastContext';
import useCargaSuave from '../../hooks/useCargaSuave';
import useEsAncho from '../../hooks/useEsAncho';
import PageContainer from '../../components/layout/PageContainer';
import { Segmentado } from '../../components/admin/metricas/piezas';
import { ESTADOS } from '../../components/admin/ResumenPersona';
import { DEFAULT_PUBLIC_TAG_COLOR, publicTagColor } from '../../utils/tagFields';
import { buildWaLink } from '../../utils/whatsapp';
import { Alert, Avatar, Badge, Button, EmptyState, Icon, Modal, Select, SkeletonRows, cn, useConfirm } from '../../components/ui';

const AR_TZ = 'America/Argentina/Buenos_Aires';

const FILTROS_ESTADO = [
  { valor: '', etiqueta: 'Todas' },
  { valor: 'frecuente', etiqueta: 'Frecuentes' },
  { valor: 'nueva', etiqueta: 'Nuevas' },
  { valor: 'alejandose', etiqueta: 'Se alejan' },
];
const CUENTAS = [
  { value: '', label: 'Todas las cuentas' },
  { value: 'approved', label: 'Aprobadas' },
  { value: 'pending', label: 'Por aprobar' },
  { value: 'rejected', label: 'Rechazadas' },
];
const ROLES = [
  { value: 'participant', label: 'Participantes' },
  { value: 'admin', label: 'Equipo' },
  { value: 'todos', label: 'Todos los roles' },
];
const CUENTA_TEXTO = { pending: 'Por aprobar', rejected: 'Rechazada' };
const RESIDENCIA = { buenos_aires: 'Buenos Aires', argentina: 'Argentina', exterior: 'Exterior' };

const nombreDe = (u) => [u.nombre, u.apellido].filter(Boolean).join(' ') || u.email;
const normalizar = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
const haceCuanto = (iso) => {
  if (!iso) return 'nunca';
  const dias = Math.floor(DateTime.now().diff(DateTime.fromISO(String(iso)), 'days').days);
  return dias <= 0 ? 'hoy' : dias === 1 ? 'ayer' : dias < 14 ? `hace ${dias} días` : dias < 60 ? `hace ${Math.round(dias / 7)} semanas` : `hace ${Math.round(dias / 30)} meses`;
};
const desdeCuando = (iso) => (iso ? DateTime.fromISO(String(iso)).setLocale('es').toFormat("LLLL 'de' yyyy") : null);

/* Las cuentas más lo que dicen las métricas de cada una (estado, veces, meses). */
const pedirPersonas = async (signal) => {
  const hoy = DateTime.now().setZone(AR_TZ);
  const [usuarios, metricas, tags] = await Promise.allSettled([
    axios.get('/users', { signal }),
    axios.get('/admin/metrics/people', { params: { from: hoy.minus({ months: 12 }).toISODate(), to: hoy.toISODate() }, signal }),
    axios.get('/tags', { signal }),
  ]);
  if (signal.aborted) throw new DOMException('cancelado', 'AbortError');
  if (usuarios.status === 'rejected') throw usuarios.reason;
  const porId = new Map((metricas.status === 'fulfilled' ? metricas.value.data.personas : []).map((p) => [String(p.id), p]));
  return {
    personas: usuarios.value.data.users.map((u) => ({ ...u, m: porId.get(String(u._id)) ?? null })),
    catalogo: tags.status === 'fulfilled' ? tags.value.data.tags ?? [] : [],
    sinMetricas: metricas.status === 'rejected',
  };
};

/* La barrita de los últimos 8 meses: la última es el mes que corre. */
const Barritas = ({ valores = [], alto = 'h-6', ancho = 'w-1.5' }) => {
  const max = Math.max(1, ...valores);
  return (
    <span className={cn('flex items-end gap-[2px] text-primary-600', alto)} aria-hidden>
      {valores.map((v, i) => (
        <span
          key={i}
          className={cn('rounded-[2px] bg-current', ancho)}
          style={{ height: `${Math.max(10, (v / max) * 100)}%`, opacity: v ? (i === valores.length - 1 ? 1 : 0.45) : 0.12 }}
        />
      ))}
    </span>
  );
};

const PillEstado = ({ persona }) => {
  if (persona.role === 'admin') return <Badge tone="neutral">Equipo</Badge>;
  if (CUENTA_TEXTO[persona.estado]) return <Badge tone={persona.estado === 'pending' ? 'warning' : 'danger'}>{CUENTA_TEXTO[persona.estado]}</Badge>;
  const e = ESTADOS[persona.m?.estado];
  return e ? <Badge tone={e.tono}>{e.etiqueta}</Badge> : null;
};

/* El resumen de una persona: al costado en la compu, en una hoja en el teléfono. */
const Ficha = ({ persona, colorDe, onAprobar, onRechazar, ocupado, enHoja }) => {
  const m = persona.m;
  const wa = buildWaLink(persona.telefono, '');
  const meses = m?.ultimosMeses ?? [];
  const estado = ESTADOS[m?.estado];
  return (
    <div className={cn(!enHoja && 'rounded-[22px] border border-surface-border bg-surface')}>
      <div className={cn('flex flex-col items-center text-center', enHoja ? 'pb-4' : 'px-6 pb-5 pt-7')}>
        {!enHoja && <Avatar nombre={nombreDe(persona)} tamano={72} borde={false} />}
        {!enHoja && <h2 className="mt-3 font-grotesk text-xl font-semibold text-ink">{nombreDe(persona)}</h2>}
        <p className="text-sm text-ink-muted">
          {[m?.edad ? `${m.edad} años` : null, desdeCuando(persona.createdAt) ? `cuenta desde ${desdeCuando(persona.createdAt)}` : null].filter(Boolean).join(' · ')}
        </p>
        <span className="mt-2">
          <PillEstado persona={persona} />
        </span>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {persona.estado === 'pending' ? (
            <>
              <Button size="sm" icon="check" onClick={() => onAprobar(persona)} loading={ocupado === persona._id}>
                Aprobar
              </Button>
              <Button size="sm" variant="secondary" icon="close" onClick={() => onRechazar(persona)} disabled={ocupado === persona._id}>
                Rechazar
              </Button>
            </>
          ) : (
            <>
              {wa && (
                <Button size="sm" icon="whatsapp" href={wa} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </Button>
              )}
              <Button size="sm" variant="soft" icon="mail" href={`mailto:${persona.email}`}>
                Mail
              </Button>
            </>
          )}
        </div>
      </div>

      {persona.role !== 'admin' && (
        <div className="grid grid-cols-3 border-y border-surface-border text-center">
          {[
            ['En el año', m ? m.vecesTotal : '—'],
            ['Última vez', m?.ultimaVez ? haceCuanto(m.ultimaVez) : 'nunca'],
            ['Sin anotarse', m ? m.sinAnotarse : '—'],
          ].map(([t, v], i) => (
            <div key={t} className={cn('px-2 py-3', i > 0 && 'border-s border-surface-border')}>
              <p className="font-grotesk text-lg font-semibold tabular-nums text-ink">{v}</p>
              <p className="text-xs text-ink-muted">{t}</p>
            </div>
          ))}
        </div>
      )}

      <div className={cn('space-y-5', enHoja ? 'pt-5' : 'px-6 py-5')}>
        {estado && m && <p className="text-sm text-ink-soft">{m.ultimoEncuentro ? `Lo último: ${m.ultimoEncuentro}.` : estado.etiqueta}</p>}
        {meses.some(Boolean) && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-label text-ink-faint">Últimos 8 meses</p>
            <Barritas valores={meses} alto="h-16" ancho="flex-1" />
          </div>
        )}
        {(m?.categorias?.length > 0 || persona.restriccionesAlimentarias?.length > 0) && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-label text-ink-faint">Lo que hace</p>
            <div className="flex flex-wrap gap-1.5">
              {(m?.categorias ?? []).map((c) => (
                <span key={c} className="inline-flex items-center gap-1.5 rounded-pill bg-ink/[0.05] px-2.5 py-1 text-xs font-semibold capitalize text-ink-soft">
                  <span className="h-2 w-2 rounded-pill" style={{ background: colorDe(c) }} />
                  {c}
                </span>
              ))}
              {(persona.restriccionesAlimentarias ?? []).map((r) => (
                <span key={r} className="rounded-pill bg-ink/[0.05] px-2.5 py-1 text-xs font-semibold text-ink-soft">
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-ink-muted">Mail</dt>
          <dd className="min-w-0 truncate text-ink">{persona.email}</dd>
          {persona.telefono && (
            <>
              <dt className="text-ink-muted">Teléfono</dt>
              <dd className="text-ink">{persona.telefono}</dd>
            </>
          )}
          {persona.residencia && (
            <>
              <dt className="text-ink-muted">Vive en</dt>
              <dd className="text-ink">{[persona.ciudad, RESIDENCIA[persona.residencia]].filter(Boolean).join(', ')}</dd>
            </>
          )}
        </dl>
        <Button variant="secondary" size="sm" fullWidth to={`/admin/users/${persona._id}`}>
          Ver la ficha entera
        </Button>
      </div>
    </div>
  );
};

/**
 * Personas: las cuentas que esperan aprobación juntas arriba (se aprueban de
 * un toque) y la lista de todas, cada una con cómo viene (frecuente, nueva,
 * se aleja) y cuánto vino en los últimos meses. Tocar una abre su resumen al
 * costado. Búsqueda y filtros se suman y quedan en la dirección.
 *
 * `enfoque="pendientes"` es /admin/users/pending: la misma pantalla, con la
 * lista mostrando sólo las cuentas por aprobar.
 */
const UsersManagement = ({ enfoque }) => {
  const { showSuccess, showError } = useToast();
  const confirm = useConfirm();
  const esAncho = useEsAncho();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const filtroEstado = params.get('estado') ?? '';
  const cuenta = params.get('cuenta') ?? (enfoque === 'pendientes' ? 'pending' : '');
  const rol = params.get('rol') ?? 'participant';
  const sel = params.get('p');
  const [texto, setTexto] = useState(q);
  const [ocupado, setOcupado] = useState(null);

  const { datos, cargando, actualizando, error, recargar } = useCargaSuave(pedirPersonas, 'personas');

  const cambiar = useCallback(
    (cambios) =>
      setParams(
        (prev) => {
          const sig = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(cambios)) {
            if (v === null || v === '') sig.delete(k);
            else sig.set(k, v);
          }
          return sig;
        },
        { replace: true },
      ),
    [setParams],
  );

  /* La búsqueda va a la dirección 250 ms después de la última tecla. */
  useEffect(() => {
    if (texto.trim() === q) return undefined;
    const t = window.setTimeout(() => cambiar({ q: texto.trim() }), 250);
    return () => window.clearTimeout(t);
  }, [texto, q, cambiar]);

  const catalogo = datos?.catalogo ?? [];
  const colorDe = (tag) => publicTagColor(catalogo, tag) ?? DEFAULT_PUBLIC_TAG_COLOR;
  const todas = datos?.personas ?? [];
  const pendientes = todas.filter((p) => p.estado === 'pending');

  const partes = normalizar(q).split(/\s+/).filter(Boolean);
  const lista = todas
    .filter((p) => rol === 'todos' || p.role === rol)
    .filter((p) => !cuenta || p.estado === cuenta)
    .filter((p) => !filtroEstado || p.m?.estado === filtroEstado)
    .filter((p) => {
      if (!partes.length) return true;
      const haystack = normalizar(`${nombreDe(p)} ${p.email} ${p.telefono ?? ''} ${String(p.telefono ?? '').replace(/\D/g, '')}`);
      return partes.every((x) => haystack.includes(x));
    })
    .sort((a, b) => (b.m?.vecesTotal ?? 0) - (a.m?.vecesTotal ?? 0) || nombreDe(a).localeCompare(nombreDe(b), 'es'));

  const elegida = lista.find((p) => p._id === sel) ?? (esAncho ? lista[0] : null) ?? null;
  const hayFiltros = Boolean(q || filtroEstado || (cuenta && enfoque !== 'pendientes') || rol !== 'participant');

  /* Aprobar y rechazar son de un toque: se pueden revertir desde la ficha. */
  const cambiarCuenta = async (persona, accion) => {
    setOcupado(persona._id);
    try {
      await axios.put(`/users/${persona._id}/${accion}`);
      showSuccess(accion === 'approve' ? `${nombreDe(persona)} ya puede anotarse` : `${nombreDe(persona)} quedó rechazada`);
      recargar();
    } catch (e) {
      showError(e.response?.data?.message || 'No se pudo cambiar la cuenta');
    } finally {
      setOcupado(null);
    }
  };
  const aprobarTodas = async () => {
    const ok = await confirm({
      title: `¿Aprobar las ${pendientes.length} cuentas?`,
      description: 'Van a poder entrar y anotarse en actividades.',
      confirmLabel: 'Aprobar todas',
      tone: 'primary',
    });
    if (!ok) return;
    setOcupado('todas');
    const resultados = await Promise.allSettled(pendientes.map((p) => axios.put(`/users/${p._id}/approve`)));
    const fallaron = resultados.filter((r) => r.status === 'rejected').length;
    if (fallaron) showError(`${fallaron} no se pudieron aprobar`);
    else showSuccess('Cuentas aprobadas');
    setOcupado(null);
    recargar();
  };

  const filas = (
    <ul className="divide-y divide-surface-border overflow-hidden rounded-[22px] border border-surface-border bg-surface">
      {lista.map((p) => (
        <li key={p._id}>
          <button
            type="button"
            onClick={() => cambiar({ p: p._id })}
            aria-current={elegida?._id === p._id ? 'true' : undefined}
            className={cn(
              'grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3.5 text-start transition-colors duration-base sm:px-5 md:grid-cols-[auto_minmax(0,1fr)_9.5rem_4.5rem]',
              elegida?._id === p._id && esAncho ? 'bg-primary-50/70' : 'hover:bg-ink/[0.02]',
            )}
          >
            <Avatar nombre={nombreDe(p)} tamano={40} borde={false} />
            <span className="min-w-0">
              <span className="block truncate font-semibold text-ink">{nombreDe(p)}</span>
              <span className="flex items-center gap-1.5 text-sm text-ink-muted">
                {(p.m?.categorias ?? []).slice(0, 4).map((c) => (
                  <span key={c} className="h-2 w-2 shrink-0 rounded-pill" style={{ background: colorDe(c) }} title={c} />
                ))}
                <span className="truncate">{p.email}</span>
              </span>
            </span>
            <span className="hidden md:block">
              <PillEstado persona={p} />
            </span>
            <span className="flex justify-end">{p.m?.ultimosMeses?.some(Boolean) ? <Barritas valores={p.m.ultimosMeses} /> : <span className="md:hidden"><PillEstado persona={p} /></span>}</span>
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <PageContainer title="Personas">
      <div className="space-y-6">
        {error && <Alert tone="danger">No se pudieron cargar las personas. Probá recargar la página.</Alert>}
        {datos?.sinMetricas && <Alert tone="warning">No se pudo calcular cómo viene cada persona: la lista sale sin estados ni barritas.</Alert>}

        {/* Las altas por aprobar quedan juntas arriba y se aprueban de una. */}
        {pendientes.length > 0 && (
          <section aria-labelledby="por-aprobar" className={cn('animate-fade-in rounded-[22px] border bg-surface p-5', enfoque === 'pendientes' ? 'border-warning-500/50' : 'border-surface-border')}>
            <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 id="por-aprobar" className="font-grotesk text-lg font-semibold text-ink">
                  Esperan aprobación
                </h2>
                <p className="text-sm text-ink-muted">Se registraron y todavía no pueden anotarse.</p>
              </div>
              {pendientes.length > 1 && (
                <Button variant="soft" size="sm" icon="check" onClick={aprobarTodas} loading={ocupado === 'todas'}>
                  Aprobar todas
                </Button>
              )}
            </div>
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {pendientes.map((p) => (
                <li key={p._id} className="flex min-w-0 items-center gap-3 rounded-[16px] bg-surface-sunken p-3">
                  <Avatar nombre={nombreDe(p)} tamano={40} borde={false} />
                  <button type="button" onClick={() => cambiar({ p: p._id })} className="min-w-0 flex-1 text-start">
                    <span className="block truncate font-semibold text-ink">{nombreDe(p)}</span>
                    <span className="block truncate text-xs text-ink-muted">
                      {[RESIDENCIA[p.residencia] ?? null, p.tipoDocumento === 'pasaporte' ? 'Pasaporte' : 'DNI', haceCuanto(p.createdAt)].filter(Boolean).join(' · ')}
                    </span>
                  </button>
                  <span className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      aria-label={`Rechazar a ${nombreDe(p)}`}
                      title="Rechazar"
                      disabled={Boolean(ocupado)}
                      onClick={() => cambiarCuenta(p, 'reject')}
                      className="flex h-9 w-9 items-center justify-center rounded-pill text-ink-muted transition-colors duration-base hover:bg-ink/[0.06] hover:text-ink disabled:opacity-40"
                    >
                      <Icon name="close" size="sm" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Aprobar a ${nombreDe(p)}`}
                      title="Aprobar"
                      disabled={Boolean(ocupado)}
                      onClick={() => cambiarCuenta(p, 'approve')}
                      className="flex h-9 w-9 items-center justify-center rounded-pill bg-ink text-surface transition-colors duration-base hover:bg-primary-800 disabled:opacity-40"
                    >
                      <Icon name="check" size="sm" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <Segmentado opciones={FILTROS_ESTADO} valor={filtroEstado} onChange={(v) => cambiar({ estado: v, p: null })} etiqueta="Cómo viene" />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="flex min-h-[44px] items-center gap-2 rounded-pill border border-surface-border bg-surface px-4 text-ink-muted sm:w-72">
              <Icon name="search" size="sm" />
              <input
                type="search"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Nombre, mail o teléfono"
                aria-label="Buscar personas"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
              />
            </label>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Select options={CUENTAS} value={cuenta} onChange={(v) => cambiar({ cuenta: v ?? '', p: null })} className="sm:w-52" />
              <Select options={ROLES} value={rol} onChange={(v) => cambiar({ rol: v === 'participant' ? null : v, p: null })} className="sm:w-44" />
            </div>
          </div>
        </div>

        {cargando || !datos ? (
          <div className="min-h-[24rem]">{cargando && <SkeletonRows count={8} />}</div>
        ) : (
          <div className={cn('grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] [&>*]:min-w-0', actualizando && 'opacity-60 transition-opacity duration-base')}>
            <div key={`${filtroEstado}|${cuenta}|${rol}`} className="animate-fade-in space-y-3">
              <p className="text-sm text-ink-muted" aria-live="polite">
                {lista.length === 1 ? '1 persona' : `${lista.length} personas`}
                {hayFiltros && (
                  <>
                    {' · '}
                    <button
                      type="button"
                      className="font-medium text-ink underline"
                      onClick={() => {
                        setTexto('');
                        cambiar({ q: null, estado: null, cuenta: null, rol: null, p: null });
                      }}
                    >
                      Sacar filtros
                    </button>
                  </>
                )}
              </p>
              {lista.length ? (
                filas
              ) : (
                <div className="rounded-[22px] border border-surface-border bg-surface">
                  <EmptyState icon="search" title="Nadie con estos filtros" description="Probá sacar alguno o buscar de otra forma." />
                </div>
              )}
            </div>
            {esAncho && elegida && (
              <aside className="lg:sticky lg:top-24 lg:self-start">
                <div key={elegida._id} className="animate-fade-in-up">
                  <Ficha
                    persona={elegida}
                    colorDe={colorDe}
                    ocupado={ocupado}
                    onAprobar={(p) => cambiarCuenta(p, 'approve')}
                    onRechazar={(p) => cambiarCuenta(p, 'reject')}
                  />
                </div>
              </aside>
            )}
          </div>
        )}

        {!esAncho && (
          <Modal open={Boolean(elegida)} onClose={() => cambiar({ p: null })} title={elegida ? nombreDe(elegida) : ''}>
            {elegida && (
              <Ficha
                persona={elegida}
                colorDe={colorDe}
                enHoja
                ocupado={ocupado}
                onAprobar={(p) => cambiarCuenta(p, 'approve')}
                onRechazar={(p) => cambiarCuenta(p, 'reject')}
              />
            )}
          </Modal>
        )}

        <p className="text-sm text-ink-muted">
          Acá están las cuentas. La gente que vino sin cuenta (contactos y la planilla) está en el{' '}
          <Link to="/admin/historial" className="font-medium text-ink underline">
            Historial
          </Link>
          .
        </p>
      </div>
    </PageContainer>
  );
};

export default UsersManagement;
