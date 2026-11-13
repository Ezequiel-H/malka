import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { DateTime } from 'luxon';
import useCargaSuave from '../../../hooks/useCargaSuave';
import { Avatar, Avatares, Button, Icon, IconoColor, Skeleton, cn } from '../../ui';
import SemanaActividades from '../actividades/SemanaActividades';
import UpcomingBirthdays from '../UpcomingBirthdays';
import { mesLargo, numero, pesos, pesosCorto, porciento } from '../metricas/piezas';
import { linkPersona } from '../../../pages/admin/Historial';

export const AR_TZ = 'America/Argentina/Buenos_Aires';
const hoyAr = () => DateTime.now().setZone(AR_TZ);

const haceCuanto = (iso) => {
  const dias = Math.floor(DateTime.now().diff(DateTime.fromISO(iso), 'days').days);
  return dias <= 0 ? 'hoy' : dias === 1 ? 'ayer' : dias < 14 ? `hace ${dias} días` : `hace ${Math.round(dias / 7)} semanas`;
};
const enDias = (iso, hoy) => {
  const dias = DateTime.fromISO(iso).diff(DateTime.fromISO(hoy), 'days').days;
  return dias === 0 ? 'hoy' : dias === 1 ? 'mañana' : `en ${dias} días`;
};

/* El título de un bloque, igual en todos. */
const Titulo = ({ children, accion }) => (
  <div className="mb-3 flex items-center justify-between gap-3">
    <h2 className="font-grotesk text-sm font-semibold uppercase tracking-label text-ink-muted">{children}</h2>
    {accion}
  </div>
);
const Caja = ({ className, children }) => <div className={cn('rounded-[22px] border border-surface-border bg-surface', className)}>{children}</div>;
const Vacio = ({ children }) => <p className="rounded-[18px] border border-dashed border-surface-border px-4 py-5 text-sm text-ink-muted">{children}</p>;

/* Un mini gráfico por número: la última barra es el mes que corre. */
const Barritas = ({ serie, formato = numero, className }) => {
  const max = Math.max(1, ...serie.map((s) => s.valor ?? 0));
  return (
    <span className={cn('flex h-9 items-end gap-[3px] text-primary-600', className)}>
      {serie.map((s, i) => (
        <span
          key={s.mes}
          title={`${mesLargo(s.mes)}: ${formato(s.valor)}`}
          className="w-2 rounded-[3px] bg-current transition-[height] duration-slow"
          style={{ height: `${Math.max(10, ((s.valor ?? 0) / max) * 100)}%`, opacity: s.valor === null ? 0.12 : i === serie.length - 1 ? 1 : 0.35 }}
        />
      ))}
    </span>
  );
};

/* El cupo como anillo: lleno se ve sin leer el número. */
const Anillo = ({ valor, total }) => {
  const pct = total ? Math.min(1, valor / total) : 0;
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 84 84" className={cn('h-24 w-24 -rotate-90', pct >= 0.9 ? 'text-warning-500' : 'text-primary-300')} aria-hidden>
      <circle cx="42" cy="42" r={r} fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="9" />
      <circle cx="42" cy="42" r={r} fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} className="transition-[stroke-dasharray] duration-slow" />
    </svg>
  );
};

const TONOS = {
  warning: 'bg-warning-50 text-warning-700',
  info: 'bg-info-50 text-info-700',
  success: 'bg-success-50 text-success-700',
};

const Pendiente = ({ icono, tono, titulo, detalle, caras, accion }) => (
  <li className="flex min-w-0 animate-fade-in items-center gap-3 rounded-[18px] border border-surface-border bg-surface px-4 py-3.5 transition-shadow duration-base hover:shadow-card sm:gap-4">
    <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]', TONOS[tono])}>
      <Icon name={icono} size="sm" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block font-semibold text-ink">{titulo}</span>
      {detalle && <span className="block truncate text-sm text-ink-muted">{detalle}</span>}
    </span>
    {caras?.length > 0 && (
      <span className="hidden sm:block">{caras.length === 1 ? <Avatar nombre={caras[0]} tamano={32} /> : <Avatares nombres={caras} total={caras.length} max={3} />}</span>
    )}
    {accion}
  </li>
);

/* ---------------- Para hacer ---------------- */

export const BloquePendientes = ({ datos, opciones, ancho }) => {
  const pend = datos?.hoy;
  const mostrar = new Set(opciones.mostrar);
  const filas = [];
  if (mostrar.has('personas') && pend?.personas?.cantidad) {
    const n = pend.personas.cantidad;
    filas.push(
      <Pendiente
        key="personas"
        icono="users"
        tono="warning"
        titulo={n === 1 ? '1 persona espera aprobación' : `${n} personas esperan aprobación`}
        detalle={pend.personas.masAntigua ? `La más antigua se registró ${haceCuanto(pend.personas.masAntigua)}` : null}
        caras={pend.personas.nombres ?? []}
        accion={
          <Button size="sm" variant="soft" to="/admin/users/pending">
            Revisar
          </Button>
        }
      />,
    );
  }
  if (mostrar.has('inscripciones') && pend?.inscripciones?.cantidad) {
    const n = pend.inscripciones.cantidad;
    filas.push(
      <Pendiente
        key="inscripciones"
        icono="document"
        tono="warning"
        titulo={n === 1 ? '1 inscripción por confirmar' : `${n} inscripciones por confirmar`}
        detalle={(pend.inscripciones.actividades ?? []).join(' y ')}
        caras={pend.inscripciones.nombres ?? []}
        accion={
          <Button size="sm" variant="soft" to="/admin/inscriptions?estado=pendiente">
            Confirmar
          </Button>
        }
      />,
    );
  }
  if (mostrar.has('comprobantes') && pend?.comprobantes?.cantidad) {
    const n = pend.comprobantes.cantidad;
    filas.push(
      <Pendiente
        key="comprobantes"
        icono="payment"
        tono="info"
        titulo={n === 1 ? '1 comprobante de pago' : `${n} comprobantes de pago`}
        detalle={(pend.comprobantes.actividades ?? []).join(' y ')}
        caras={pend.comprobantes.nombres ?? []}
        accion={
          <Button size="sm" variant="soft" to="/admin/inscriptions?comprobantes=1">
            Revisar
          </Button>
        }
      />,
    );
  }
  return (
    <section>
      <Titulo>Para hacer</Titulo>
      {!datos ? (
        <Skeleton className="h-[4.5rem] rounded-[18px]" />
      ) : filas.length ? (
        <ul className={cn('grid gap-3', ancho === 'entera' && 'md:grid-cols-2')}>{filas}</ul>
      ) : (
        <p className="flex animate-fade-in items-center gap-3 rounded-[18px] border border-surface-border bg-surface px-4 py-4 text-ink-soft">
          <span className={cn('flex h-10 w-10 items-center justify-center rounded-[12px]', TONOS.success)}>
            <Icon name="check" size="sm" />
          </span>
          Nada pendiente: está todo al día.
        </p>
      )}
    </section>
  );
};

/* ---------------- Los números del mes ---------------- */

export const NUMEROS = {
  vinieron: 'Vinieron este mes',
  vuelven: 'Vuelven',
  veces: 'Veces por persona',
  cubrio: 'Se cubrió',
  nuevos: 'Nuevos este mes',
  recaudado: 'Recaudado este mes',
};

export const BloqueNumeros = ({ datos, opciones, ancho }) => {
  const metricas = datos?.metricas;
  const personasMes = (metricas?.personas?.porMes ?? []).slice(-opciones.meses);
  const plataMes = (metricas?.plata?.porMes ?? []).slice(-opciones.meses);
  const actual = personasMes.at(-1);
  const cubierto = plataMes.map((m) => ({ mes: m.mes, valor: m.gastado ? Math.round((m.recaudado / m.gastado) * 100) : null }));
  const vuelven = metricas?.personas?.vuelven;
  const todos = {
    vinieron: {
      v: numero(actual?.personas ?? 0),
      d: actual?.nuevas ? `${actual.nuevas} por primera vez` : 'nadie nuevo todavía',
      serie: personasMes.map((m) => ({ mes: m.mes, valor: m.personas })),
    },
    vuelven: {
      v: porciento(vuelven?.porcentaje ?? null),
      d: vuelven?.cohorte ? `de ${vuelven.cohorte} nuevos, en 60 días` : 'todavía no hay a quién medir',
      serie: personasMes.map((m) => ({ mes: m.mes, valor: m.nuevas })),
      formato: (n) => `${numero(n)} nuevos`,
    },
    veces: { v: actual?.frecuencia ? numero(actual.frecuencia) : '—', d: 'este mes, en promedio', serie: personasMes.map((m) => ({ mes: m.mes, valor: m.frecuencia })) },
    cubrio: {
      v: porciento(cubierto.at(-1)?.valor ?? null),
      d: cubierto.at(-1)?.valor === null || cubierto.at(-1)?.valor === undefined ? 'sin gastos cargados este mes' : 'de lo gastado este mes',
      serie: cubierto,
      formato: porciento,
      tono: 'text-warning-500',
    },
    nuevos: { v: numero(actual?.nuevas ?? 0), d: 'vinieron por primera vez', serie: personasMes.map((m) => ({ mes: m.mes, valor: m.nuevas })) },
    recaudado: { v: pesosCorto(plataMes.at(-1)?.recaudado ?? 0), d: 'entre cuotas e ingresos', serie: plataMes.map((m) => ({ mes: m.mes, valor: m.recaudado })), formato: pesos, tono: 'text-warning-500' },
  };
  const cuales = opciones.cuales;
  return (
    <section aria-label="Los números del mes">
      {!metricas ? (
        <Skeleton className="h-[7.5rem] rounded-[22px]" />
      ) : (
        <Caja className={cn('grid divide-y divide-surface-border sm:grid-cols-2 sm:divide-y-0', ancho === 'entera' && cuales.length >= 3 && 'lg:grid-cols-4 lg:divide-x rtl:lg:divide-x-reverse', ancho === 'entera' && cuales.length === 3 && 'lg:grid-cols-3')}>
          {cuales.map((k) => {
            const n = todos[k];
            return (
              <Link key={k} to="/admin/metricas" className="flex animate-fade-in items-end justify-between gap-4 px-6 py-5 transition-colors duration-base hover:bg-ink/[0.02]">
                <span className="min-w-0">
                  <span className="block text-sm text-ink-muted">{NUMEROS[k]}</span>
                  <span className="mt-1 block font-grotesk text-4xl font-semibold tabular-nums tracking-tight text-ink">{n.v}</span>
                  <span className="block text-sm text-ink-muted">{n.d}</span>
                </span>
                <Barritas serie={n.serie} formato={n.formato} className={n.tono} />
              </Link>
            );
          })}
        </Caja>
      )}
    </section>
  );
};

/* ---------------- La semana ---------------- */

const visiblesEnSemana = (actividades, borradores) => actividades.filter((a) => a.estado === 'publicada' || (borradores && a.estado === 'borrador'));

export const BloqueSemana = ({ datos, opciones, colorDe }) => {
  const navigate = useNavigate();
  const semana = datos?.actividades?.semana;
  const actividades = visiblesEnSemana(datos?.actividades?.actividades ?? [], opciones.borradores);
  return (
    <section>
      <Titulo
        accion={
          <Link to="/admin/activities?vista=semana" className="text-sm font-medium text-ink-muted hover:text-ink">
            Ver actividades
          </Link>
        }
      >
        Esta semana en la casa
      </Titulo>
      {semana ? (
        <SemanaActividades semana={semana} actividades={actividades} colorDe={colorDe} onElegir={(id) => navigate(`/admin/activities?act=${id}`)} />
      ) : (
        <Skeleton className="h-40 rounded-[22px]" />
      )}
    </section>
  );
};

/* ---------------- El próximo encuentro ---------------- */

/** El encuentro que se destaca, según el criterio elegido. */
export const elegirProximo = (actividades, { criterio, dias }, hoyIso) => {
  const hasta = DateTime.fromISO(hoyIso).plus({ days: dias }).toISODate();
  const candidatos = actividades.filter((a) => a.estado === 'publicada' && a.proximo && a.proximo.fecha <= hasta);
  const porFecha = (a, b) => a.proximo.fecha.localeCompare(b.proximo.fecha) || String(a.proximo.hora ?? '').localeCompare(String(b.proximo.hora ?? ''));
  return candidatos.sort(criterio === 'mas_cercano' ? porFecha : (a, b) => b.proximo.aceptadas - a.proximo.aceptadas || porFecha(a, b))[0] ?? null;
};

export const BloqueProximo = ({ datos, opciones, colorDe, iconoDe }) => {
  const hoyIso = datos?.actividades?.semana?.hoy ?? hoyAr().toISODate();
  if (!datos?.actividades) return <Skeleton className="h-72 rounded-[22px]" />;
  const a = elegirProximo(datos.actividades.actividades ?? [], opciones, hoyIso);
  if (!a) {
    return (
      <section className="flex h-full animate-fade-in flex-col items-start justify-center gap-3 rounded-[22px] border border-dashed border-surface-border p-6 text-ink-soft">
        <p>No hay encuentros publicados en los próximos {opciones.dias} días.</p>
        <Button size="sm" variant="soft" icon="add" to="/admin/activities/new">
          Nueva actividad
        </Button>
      </section>
    );
  }
  const p = a.proximo;
  return (
    <section className="flex h-full animate-fade-in flex-col rounded-[22px] bg-ink p-6 text-surface">
      <p className="text-xs font-semibold uppercase tracking-label text-surface/60">
        {opciones.criterio === 'mas_gente' && p.aceptadas >= 10 ? 'Próximo encuentro grande' : 'Próximo encuentro'} · {enDias(p.fecha, hoyIso)}
      </p>
      <div className="mt-3 flex items-center gap-3">
        <IconoColor icono={iconoDe(a)} color={colorDe(a)} className="bg-surface/10" />
        <div className="min-w-0">
          <h2 className="truncate font-grotesk text-xl font-semibold">{a.titulo}</h2>
          <p className="text-sm capitalize text-surface/70">
            {p.texto}
            {p.hora ? ` · ${p.hora}` : ''}
          </p>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-5">
        <span className="relative flex shrink-0 items-center justify-center">
          <Anillo valor={p.aceptadas} total={a.cupo} />
          <span className="absolute text-center">
            <span className="block font-grotesk text-2xl font-semibold tabular-nums">{p.aceptadas}</span>
            <span className="block text-[0.7rem] text-surface/60">{a.cupo ? `de ${a.cupo}` : 'anotados'}</span>
          </span>
        </span>
        <div className="space-y-1 text-sm text-surface/80">
          {p.enEspera > 0 && <p>{p.enEspera} en lista de espera</p>}
          {p.pendientes > 0 && <p>{p.pendientes} por aprobar</p>}
          {p.comprobantes > 0 && <p>{p.comprobantes} comprobantes por revisar</p>}
          {a.cupo && p.aceptadas < a.cupo && <p>Quedan {a.cupo - p.aceptadas} lugares</p>}
        </div>
      </div>
      {p.nombres?.length > 0 && (
        <div className="mt-5">
          <Avatares nombres={p.nombres} total={p.aceptadas} max={8} />
        </div>
      )}
      <div className="mt-auto flex gap-2 pt-6">
        <Link
          to={`/admin/activities/${a.id}/inscriptions?fecha=${p.fecha}`}
          className="flex min-h-[38px] flex-1 items-center justify-center rounded-pill bg-surface px-4 text-sm font-semibold text-ink transition-colors duration-base hover:bg-surface/90"
        >
          Lista para el día
        </Link>
        <Link to={`/admin/activities?act=${a.id}`} className="flex min-h-[38px] items-center rounded-pill px-4 text-sm font-semibold text-surface ring-1 ring-surface/30 transition-colors duration-base hover:bg-surface/10">
          Ver todo
        </Link>
      </div>
    </section>
  );
};

/* ---------------- Cumpleaños ---------------- */

export const BloqueCumples = ({ opciones }) => <UpcomingBirthdays className="h-full" semanaQueViene={opciones.semanaQueViene} />;

/* ---------------- Bloques para sumar ---------------- */

const FilaPersona = ({ to, nombre, detalle, extra }) => (
  <li>
    <Link to={to} className="flex items-center gap-3 rounded-[14px] px-2 py-2 transition-colors duration-base hover:bg-ink/[0.03]">
      <Avatar nombre={nombre} tamano={36} borde={false} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-ink">{nombre}</span>
        <span className="block truncate text-sm text-ink-muted">{detalle}</span>
      </span>
      {extra}
    </Link>
  </li>
);

/* Quiénes vinieron sin anotarse: para hablarles y que se sumen. */
export const BloqueSinAnotarse = ({ opciones }) => {
  const { cuantos, dias } = opciones;
  const { datos, actualizando } = useCargaSuave(
    (signal) =>
      axios
        .get('/historial', { params: { origen: 'sin_anotarse', from: hoyAr().minus({ days: dias }).toISODate(), to: hoyAr().toISODate(), limit: 200 }, signal })
        .then((r) => r.data),
    `sin-anotarse|${dias}`,
  );
  const porPersona = new Map();
  for (const f of datos?.filas ?? []) {
    const k = `${f.persona.tipo}:${f.persona.id}`;
    const actual = porPersona.get(k);
    if (actual) actual.veces += 1;
    else porPersona.set(k, { persona: f.persona, veces: 1, ultima: f });
  }
  const personas = [...porPersona.values()].slice(0, cuantos);
  return (
    <Caja className={cn('h-full p-5 transition-opacity duration-base', actualizando && 'opacity-60')}>
      <h2 className="font-grotesk text-lg font-semibold text-ink">Vinieron sin anotarse</h2>
      <p className="mb-3 text-sm text-ink-muted">En los últimos {dias} días. Buen momento para escribirles.</p>
      {!datos ? (
        <Skeleton className="h-32 rounded-[14px]" />
      ) : personas.length ? (
        <ul className="space-y-1">
          {personas.map(({ persona, veces, ultima }) => (
            <FilaPersona
              key={`${persona.tipo}:${persona.id}`}
              to={linkPersona(persona)}
              nombre={persona.nombre || 'Sin nombre'}
              detalle={`${ultima.encuentro.titulo} · ${haceCuanto(ultima.fecha)}`}
              extra={veces > 1 ? <span className="shrink-0 rounded-pill bg-ink/[0.06] px-2 py-0.5 text-xs font-semibold text-ink-soft">{veces} veces</span> : null}
            />
          ))}
        </ul>
      ) : (
        <Vacio>Nadie vino sin anotarse en estos {dias} días.</Vacio>
      )}
      <Link to="/admin/historial?origen=sin_anotarse" className="mt-3 inline-block text-sm font-medium text-ink-muted hover:text-ink">
        Ver en el historial
      </Link>
    </Caja>
  );
};

/* Quiénes venían y hace un tiempo que no vienen. */
export const BloqueAlejandose = ({ opciones }) => {
  const { cuantos } = opciones;
  const { datos } = useCargaSuave(
    (signal) =>
      axios.get('/admin/metrics/people', { params: { from: hoyAr().minus({ months: 12 }).toISODate(), to: hoyAr().toISODate() }, signal }).then((r) => r.data),
    'alejandose',
  );
  const personas = (datos?.personas ?? [])
    .filter((p) => p.estado === 'alejandose')
    .sort((a, b) => new Date(b.ultimaVez) - new Date(a.ultimaVez))
    .slice(0, cuantos);
  return (
    <Caja className="h-full p-5">
      <h2 className="font-grotesk text-lg font-semibold text-ink">Se están alejando</h2>
      <p className="mb-3 text-sm text-ink-muted">Venían seguido y hace un tiempo que no vienen.</p>
      {!datos ? (
        <Skeleton className="h-32 rounded-[14px]" />
      ) : personas.length ? (
        <ul className="space-y-1">
          {personas.map((p) => (
            <FilaPersona
              key={p.id}
              to={linkPersona({ tipo: String(p.id).startsWith('c:') ? 'contacto' : 'usuario', id: String(p.id).replace(/^c:/, '') })}
              nombre={p.nombre || 'Sin nombre'}
              detalle={`Vino por última vez ${haceCuanto(p.ultimaVez)}${p.ultimoEncuentro ? ` · ${p.ultimoEncuentro}` : ''}`}
            />
          ))}
        </ul>
      ) : (
        <Vacio>Nadie se está alejando. Muy bien.</Vacio>
      )}
    </Caja>
  );
};

/* Las actividades con más gente. */
export const BloqueRanking = ({ opciones, colorDe }) => {
  const { cuantas, periodo } = opciones;
  const desde = periodo === 'mes' ? hoyAr().startOf('month') : hoyAr().minus({ days: 90 });
  const { datos, actualizando } = useCargaSuave(
    (signal) => axios.get('/admin/metrics/activities', { params: { from: desde.toISODate(), to: hoyAr().toISODate() }, signal }).then((r) => r.data),
    `ranking|${periodo}`,
  );
  const filas = [...(datos?.actividades ?? [])].filter((a) => a.personas > 0).sort((a, b) => b.personas - a.personas).slice(0, cuantas);
  const max = Math.max(1, ...filas.map((f) => f.personas));
  return (
    <Caja className={cn('h-full p-5 transition-opacity duration-base', actualizando && 'opacity-60')}>
      <h2 className="font-grotesk text-lg font-semibold text-ink">Lo que más gente juntó</h2>
      <p className="mb-4 text-sm text-ink-muted">{periodo === 'mes' ? 'Este mes' : 'Últimos 90 días'}, por personas distintas.</p>
      {!datos ? (
        <Skeleton className="h-32 rounded-[14px]" />
      ) : filas.length ? (
        <ol className="space-y-3">
          {filas.map((f) => (
            <li key={f.id}>
              <Link to={`/admin/metricas?vista=actividades&actividad=${encodeURIComponent(f.id)}`} className="group block">
                <span className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-ink group-hover:underline">{f.titulo}</span>
                  <span className="shrink-0 tabular-nums text-ink-muted">{numero(f.personas)}</span>
                </span>
                <span className="mt-1 block h-2 rounded-pill bg-ink/[0.05]">
                  <span className="block h-2 rounded-pill transition-[width] duration-slow" style={{ width: `${(f.personas / max) * 100}%`, background: colorDe({ categorias: f.categorias }) }} />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <Vacio>Todavía no hay encuentros en este período.</Vacio>
      )}
    </Caja>
  );
};

/* La plata del mes: lo que entró contra lo que salió. */
export const BloquePlata = ({ datos, opciones }) => {
  const porMes = datos?.metricas?.plata?.porMes ?? [];
  const [anterior, actual] = porMes.slice(-2);
  const fila = (titulo, valor, antes) => (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <span className="text-sm text-ink-muted">{titulo}</span>
      <span className="text-end">
        <span className="font-grotesk text-xl font-semibold tabular-nums text-ink">{pesos(valor)}</span>
        {opciones.comparar && antes !== undefined && <span className="block text-xs text-ink-muted">el mes pasado {pesos(antes)}</span>}
      </span>
    </div>
  );
  const cobertura = actual?.gastado ? Math.round((actual.recaudado / actual.gastado) * 100) : null;
  return (
    <Caja className="h-full p-5">
      <h2 className="font-grotesk text-lg font-semibold text-ink">La plata del mes</h2>
      <p className="mb-2 text-sm text-ink-muted">Lo que entró y lo que se gastó.</p>
      {!datos?.metricas ? (
        <Skeleton className="h-32 rounded-[14px]" />
      ) : (
        <>
          <div className="divide-y divide-surface-border">
            {fila('Entró', actual?.recaudado ?? 0, anterior?.recaudado)}
            {fila('Se gastó', actual?.gastado ?? 0, anterior?.gastado)}
          </div>
          <div className="mt-3">
            <span className="mb-1 flex justify-between text-xs text-ink-muted">
              <span>Se cubrió</span>
              <span>{cobertura === null ? 'sin gastos cargados' : porciento(cobertura)}</span>
            </span>
            <span className="block h-2 rounded-pill bg-ink/[0.05]">
              <span className="block h-2 rounded-pill bg-warning-500 transition-[width] duration-slow" style={{ width: `${Math.min(100, cobertura ?? 0)}%` }} />
            </span>
          </div>
          <Link to="/admin/metricas?vista=plata" className="mt-4 inline-block text-sm font-medium text-ink-muted hover:text-ink">
            Ver la plata en Métricas
          </Link>
        </>
      )}
    </Caja>
  );
};

/* ---------------- El catálogo, en palabras ---------------- */

/**
 * Nombre, qué muestra y cómo se dicen las opciones de cada bloque. Los ids,
 * los valores posibles y los de entrada vienen del back (GET /admin/inicio).
 */
export const BLOQUES = {
  pendientes: {
    nombre: 'Para hacer',
    que: 'Altas por aprobar, inscripciones por confirmar y comprobantes',
    Componente: BloquePendientes,
    opciones: { mostrar: { etiqueta: 'Qué mostrar', valores: { personas: 'Altas por aprobar', inscripciones: 'Inscripciones', comprobantes: 'Comprobantes' } } },
  },
  numeros: {
    nombre: 'Los números del mes',
    que: 'Cuántos vinieron, cuántos vuelven y cuánto se cubrió',
    Componente: BloqueNumeros,
    opciones: {
      cuales: { etiqueta: 'Qué números', valores: NUMEROS },
      meses: { etiqueta: 'Barritas de', valores: { 3: '3 meses', 6: '6 meses', 12: '12 meses' } },
    },
  },
  semana: {
    nombre: 'Esta semana en la casa',
    que: 'La semana como calendario',
    Componente: BloqueSemana,
    opciones: { borradores: { etiqueta: 'Mostrar también los borradores' } },
  },
  proximo: {
    nombre: 'Próximo encuentro',
    que: 'El que viene, con su cupo y la lista para el día',
    Componente: BloqueProximo,
    opciones: {
      criterio: { etiqueta: 'Cuál mostrar', valores: { mas_gente: 'El de más gente', mas_cercano: 'El más cercano' } },
      dias: { etiqueta: 'Dentro de', valores: { 3: '3 días', 7: '7 días', 14: '14 días' } },
    },
  },
  cumples: {
    nombre: 'Próximos cumpleaños',
    que: 'Quién cumple, con el saludo por WhatsApp',
    Componente: BloqueCumples,
    opciones: { semanaQueViene: { etiqueta: 'Incluir la semana que viene' } },
  },
  sinAnotarse: {
    nombre: 'Vinieron sin anotarse',
    que: 'Gente que vino sin anotarse, para escribirle',
    Componente: BloqueSinAnotarse,
    opciones: {
      cuantos: { etiqueta: 'Cuántas personas', valores: { 5: '5', 10: '10' } },
      dias: { etiqueta: 'De los últimos', valores: { 30: '30 días', 90: '90 días' } },
    },
  },
  alejandose: {
    nombre: 'Se están alejando',
    que: 'Venían seguido y hace un tiempo que no vienen',
    Componente: BloqueAlejandose,
    opciones: { cuantos: { etiqueta: 'Cuántas personas', valores: { 5: '5', 10: '10' } } },
  },
  ranking: {
    nombre: 'Lo que más gente juntó',
    que: 'Las actividades con más personas',
    Componente: BloqueRanking,
    opciones: {
      cuantas: { etiqueta: 'Cuántas', valores: { 3: '3', 5: '5', 10: '10' } },
      periodo: { etiqueta: 'De', valores: { mes: 'este mes', '90d': 'los últimos 90 días' } },
    },
  },
  plata: {
    nombre: 'La plata del mes',
    que: 'Lo que entró y lo que se gastó',
    Componente: BloquePlata,
    opciones: { comparar: { etiqueta: 'Comparar con el mes pasado' } },
  },
};
