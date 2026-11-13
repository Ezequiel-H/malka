import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { DateTime } from 'luxon';
import PageContainer from '../../components/layout/PageContainer';
import { useAuth } from '../../contexts/AuthContext';
import useCargaSuave from '../../hooks/useCargaSuave';
import { Alert, Avatar, Avatares, Button, Icon, IconoColor, Skeleton, cn } from '../../components/ui';
import SemanaActividades from '../../components/admin/actividades/SemanaActividades';
import UpcomingBirthdays from '../../components/admin/UpcomingBirthdays';
import { mesLargo, numero, porciento } from '../../components/admin/metricas/piezas';
import { DEFAULT_PUBLIC_TAG_COLOR, publicTagColor, publicTagIcon } from '../../utils/tagFields';

const AR_TZ = 'America/Argentina/Buenos_Aires';
const MESES_DE_SERIE = 6;

const saludo = (hora) => (hora < 13 ? 'Buen día' : hora < 20 ? 'Buenas tardes' : 'Buenas noches');
const haceCuanto = (iso) => {
  const dias = Math.floor(DateTime.now().diff(DateTime.fromISO(iso), 'days').days);
  return dias <= 0 ? 'hoy' : dias === 1 ? 'ayer' : `hace ${dias} días`;
};
const enDias = (iso, hoy) => {
  const dias = DateTime.fromISO(iso).diff(DateTime.fromISO(hoy), 'days').days;
  return dias === 0 ? 'hoy' : dias === 1 ? 'mañana' : `en ${dias} días`;
};

/* Una pieza que falla no tira el panel entero: queda vacía y lo demás sale. */
const pedirTodo = async (signal) => {
  const hoy = DateTime.now().setZone(AR_TZ);
  const desde = hoy.startOf('month').minus({ months: MESES_DE_SERIE - 1 }).toISODate();
  const pedidos = {
    hoy: axios.get('/admin/hoy', { signal }),
    metricas: axios.get('/admin/metrics', { params: { from: desde, to: hoy.toISODate() }, signal }),
    actividades: axios.get('/admin/actividades-resumen', { params: { estado: 'publicada' }, signal }),
    tags: axios.get('/tags', { signal }),
  };
  const claves = Object.keys(pedidos);
  const respuestas = await Promise.allSettled(Object.values(pedidos));
  if (signal.aborted) throw new DOMException('cancelado', 'AbortError');
  return Object.fromEntries(claves.map((k, i) => [k, respuestas[i].status === 'fulfilled' ? respuestas[i].value.data : null]));
};

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

/**
 * El panel del equipo, «Hoy en Malka»: arranca por lo que hay para hacer (con
 * la acción a un toque), sigue con los números del mes en una franja, y
 * muestra la semana y el encuentro grande que viene.
 */
const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ahora] = useState(() => DateTime.now().setZone(AR_TZ).setLocale('es'));
  const { datos, cargando, error } = useCargaSuave(pedirTodo, 'panel');

  const catalogo = datos?.tags?.tags ?? [];
  const tagDe = (a) => a.categorias?.[0];
  const colorDe = (a) => (tagDe(a) ? publicTagColor(catalogo, tagDe(a)) : DEFAULT_PUBLIC_TAG_COLOR);
  const iconoDe = (a) => (tagDe(a) && publicTagIcon(catalogo, tagDe(a))) || 'activity';

  const actividades = datos?.actividades?.actividades ?? [];
  const semana = datos?.actividades?.semana;
  const hoyIso = semana?.hoy ?? ahora.toISODate();

  /* El encuentro grande: de lo que viene en la semana, el que más gente tiene. */
  const enUnaSemana = ahora.plus({ days: 7 }).toISODate();
  const grande = actividades
    .filter((a) => a.proximo && a.proximo.fecha <= enUnaSemana)
    .sort((a, b) => b.proximo.aceptadas - a.proximo.aceptadas || a.proximo.fecha.localeCompare(b.proximo.fecha))[0];

  /* La frase de arriba: lo de hoy y el encuentro grande, en palabras. */
  const deHoy = actividades.flatMap((a) => (a.semana ?? []).filter((e) => e.fecha === hoyIso).map((e) => ({ ...e, titulo: a.titulo })));
  const frase = [
    deHoy.length ? `Hoy hay ${deHoy.map((e) => `${e.titulo}${e.hora ? ` a las ${e.hora}` : ''}`).join(' y ')}.` : 'Hoy no hay actividades en la agenda.',
    grande && grande.proximo.fecha !== hoyIso && grande.proximo.aceptadas > 0
      ? `Para ${grande.titulo} (${grande.proximo.texto}) ya hay ${grande.proximo.aceptadas} anotados.`
      : null,
  ]
    .filter(Boolean)
    .join(' ');

  const pend = datos?.hoy;
  const pendientes = [];
  if (pend?.personas?.cantidad) {
    pendientes.push(
      <Pendiente
        key="personas"
        icono="users"
        tono="warning"
        titulo={pend.personas.cantidad === 1 ? '1 persona espera aprobación' : `${pend.personas.cantidad} personas esperan aprobación`}
        detalle={pend.personas.masAntigua ? `La más antigua se registró ${haceCuanto(pend.personas.masAntigua)}` : null}
        caras={pend.personas.nombres}
        accion={
          <Button size="sm" variant="soft" to="/admin/users/pending">
            Revisar
          </Button>
        }
      />,
    );
  }
  if (pend?.inscripciones?.cantidad) {
    pendientes.push(
      <Pendiente
        key="inscripciones"
        icono="document"
        tono="warning"
        titulo={pend.inscripciones.cantidad === 1 ? '1 inscripción por confirmar' : `${pend.inscripciones.cantidad} inscripciones por confirmar`}
        detalle={pend.inscripciones.actividades.join(' y ')}
        caras={pend.inscripciones.nombres}
        accion={
          <Button size="sm" variant="soft" to="/admin/inscriptions?estado=pendiente">
            Confirmar
          </Button>
        }
      />,
    );
  }
  if (pend?.comprobantes?.cantidad) {
    pendientes.push(
      <Pendiente
        key="comprobantes"
        icono="payment"
        tono="info"
        titulo={pend.comprobantes.cantidad === 1 ? '1 comprobante de pago' : `${pend.comprobantes.cantidad} comprobantes de pago`}
        detalle={pend.comprobantes.actividades.join(' y ')}
        caras={pend.comprobantes.nombres}
        accion={
          <Button size="sm" variant="soft" to="/admin/inscriptions?comprobantes=1">
            Revisar
          </Button>
        }
      />,
    );
  }
  /* Los números del mes, con la serie de los últimos seis meses. */
  const personasMes = datos?.metricas?.personas?.porMes ?? [];
  const plataMes = datos?.metricas?.plata?.porMes ?? [];
  const actual = personasMes.at(-1);
  const cubierto = plataMes.map((m) => ({ mes: m.mes, valor: m.gastado ? Math.round((m.recaudado / m.gastado) * 100) : null }));
  const vuelven = datos?.metricas?.personas?.vuelven;
  const numeros = datos?.metricas
    ? [
        {
          t: 'Vinieron este mes',
          v: numero(actual?.personas ?? 0),
          d: actual?.nuevas ? `${actual.nuevas} por primera vez` : 'nadie nuevo todavía',
          serie: personasMes.map((m) => ({ mes: m.mes, valor: m.personas })),
        },
        {
          t: 'Vuelven',
          v: porciento(vuelven?.porcentaje ?? null),
          d: vuelven?.cohorte ? `de ${vuelven.cohorte} nuevos, en 60 días` : 'todavía no hay a quién medir',
          serie: personasMes.map((m) => ({ mes: m.mes, valor: m.nuevas })),
          formatoSerie: (n) => `${numero(n)} nuevos`,
        },
        {
          t: 'Veces por persona',
          v: actual?.frecuencia ? numero(actual.frecuencia) : '—',
          d: 'este mes, en promedio',
          serie: personasMes.map((m) => ({ mes: m.mes, valor: m.frecuencia })),
        },
        {
          t: 'Se cubrió',
          v: porciento(cubierto.at(-1)?.valor ?? null),
          d: cubierto.at(-1)?.valor === null ? 'sin gastos cargados este mes' : 'de lo gastado este mes',
          serie: cubierto,
          formatoSerie: porciento,
          tono: 'text-warning-500',
        },
      ]
    : [];

  return (
    <PageContainer>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-ink-muted first-letter:uppercase">{ahora.toFormat("cccc d 'de' LLLL")}</p>
            <h1 className="mt-1 font-grotesk text-[clamp(1.8rem,3vw,2.4rem)] font-semibold tracking-tight text-ink">
              {saludo(ahora.hour)}
              {user?.nombre ? `, ${user.nombre}` : ''}
            </h1>
            {datos?.actividades ? <p className="mt-1 animate-fade-in text-ink-soft">{frase}</p> : <Skeleton className="mt-2 h-5 w-80 max-w-full" />}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" icon="users" to="/admin/historial">
              Sumar visita
            </Button>
            <Button variant="secondary" size="sm" icon="chart" to="/admin/metricas">
              Métricas
            </Button>
            <Button size="sm" icon="add" to="/admin/activities/new">
              Nueva actividad
            </Button>
          </div>
        </header>

        {error && <Alert tone="danger">No se pudo cargar el panel. Probá recargar la página.</Alert>}

        <section aria-labelledby="para-hacer">
          <h2 id="para-hacer" className="mb-3 font-grotesk text-sm font-semibold uppercase tracking-label text-ink-muted">
            Para hacer
          </h2>
          {cargando || !datos ? (
            <div className="grid min-h-[4.5rem] gap-3 md:grid-cols-2">{cargando && [0, 1].map((i) => <Skeleton key={i} className="h-[4.5rem] rounded-[18px]" />)}</div>
          ) : pendientes.length ? (
            <ul className="grid gap-3 md:grid-cols-2">{pendientes}</ul>
          ) : (
            <p className="flex animate-fade-in items-center gap-3 rounded-[18px] border border-surface-border bg-surface px-4 py-4 text-ink-soft">
              <span className={cn('flex h-10 w-10 items-center justify-center rounded-[12px]', TONOS.success)}>
                <Icon name="check" size="sm" />
              </span>
              Nada pendiente: está todo al día.
            </p>
          )}
        </section>

        <section
          aria-label="Los números del mes"
          className="grid min-h-[7.5rem] divide-y divide-surface-border rounded-[22px] border border-surface-border bg-surface sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x rtl:lg:divide-x-reverse"
        >
          {numeros.map((n) => (
            <Link key={n.t} to="/admin/metricas" className="flex animate-fade-in items-end justify-between gap-4 px-6 py-5 transition-colors duration-base hover:bg-ink/[0.02]">
              <span>
                <span className="block text-sm text-ink-muted">{n.t}</span>
                <span className="mt-1 block font-grotesk text-4xl font-semibold tabular-nums tracking-tight text-ink">{n.v}</span>
                <span className="block text-sm text-ink-muted">{n.d}</span>
              </span>
              <Barritas serie={n.serie} formato={n.formatoSerie} className={n.tono} />
            </Link>
          ))}
        </section>

        <section aria-labelledby="semana">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="semana" className="font-grotesk text-sm font-semibold uppercase tracking-label text-ink-muted">
              Esta semana en la casa
            </h2>
            <Link to="/admin/activities?vista=semana" className="text-sm font-medium text-ink-muted hover:text-ink">
              Ver actividades
            </Link>
          </div>
          {semana ? (
            <SemanaActividades semana={semana} actividades={actividades} colorDe={colorDe} onElegir={(id) => navigate(`/admin/activities?act=${id}`)} />
          ) : (
            <Skeleton className="h-40 rounded-[22px]" />
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
          {grande ? (
            <section className="flex animate-fade-in flex-col rounded-[22px] bg-ink p-6 text-surface">
              <p className="text-xs font-semibold uppercase tracking-label text-surface/60">
                {grande.proximo.aceptadas >= 10 ? 'Próximo encuentro grande' : 'Próximo encuentro'} · {enDias(grande.proximo.fecha, hoyIso)}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <IconoColor icono={iconoDe(grande)} color={colorDe(grande)} className="bg-surface/10" />
                <div className="min-w-0">
                  <h2 className="truncate font-grotesk text-xl font-semibold">{grande.titulo}</h2>
                  <p className="text-sm capitalize text-surface/70">
                    {grande.proximo.texto}
                    {grande.proximo.hora ? ` · ${grande.proximo.hora}` : ''}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-5">
                <span className="relative flex shrink-0 items-center justify-center">
                  <Anillo valor={grande.proximo.aceptadas} total={grande.cupo} />
                  <span className="absolute text-center">
                    <span className="block font-grotesk text-2xl font-semibold tabular-nums">{grande.proximo.aceptadas}</span>
                    <span className="block text-[0.7rem] text-surface/60">{grande.cupo ? `de ${grande.cupo}` : 'anotados'}</span>
                  </span>
                </span>
                <div className="space-y-1 text-sm text-surface/80">
                  {grande.proximo.enEspera > 0 && <p>{grande.proximo.enEspera} en lista de espera</p>}
                  {grande.proximo.pendientes > 0 && <p>{grande.proximo.pendientes} por aprobar</p>}
                  {grande.proximo.comprobantes > 0 && <p>{grande.proximo.comprobantes} comprobantes por revisar</p>}
                  {grande.cupo && grande.proximo.aceptadas < grande.cupo && <p>Quedan {grande.cupo - grande.proximo.aceptadas} lugares</p>}
                </div>
              </div>
              {grande.proximo.nombres?.length > 0 && (
                <div className="mt-5">
                  <Avatares nombres={grande.proximo.nombres} total={grande.proximo.aceptadas} max={8} />
                </div>
              )}
              <div className="mt-auto flex gap-2 pt-6">
                <Link
                  to={`/admin/activities/${grande.id}/inscriptions?fecha=${grande.proximo.fecha}`}
                  className="flex min-h-[38px] flex-1 items-center justify-center rounded-pill bg-surface px-4 text-sm font-semibold text-ink transition-colors duration-base hover:bg-surface/90"
                >
                  Lista para el día
                </Link>
                <Link
                  to={`/admin/activities?act=${grande.id}`}
                  className="flex min-h-[38px] items-center rounded-pill px-4 text-sm font-semibold text-surface ring-1 ring-surface/30 transition-colors duration-base hover:bg-surface/10"
                >
                  Ver todo
                </Link>
              </div>
            </section>
          ) : (
            datos && (
              <section className="flex animate-fade-in flex-col items-start justify-center gap-3 rounded-[22px] border border-dashed border-surface-border p-6 text-ink-soft">
                <p>No hay encuentros publicados en los próximos 7 días.</p>
                <Button size="sm" variant="soft" icon="add" to="/admin/activities/new">
                  Nueva actividad
                </Button>
              </section>
            )
          )}

          {/* Los cumpleaños de las dos semanas, con el saludo de hoy listo para mandar. */}
          <UpcomingBirthdays />
        </div>
      </div>
    </PageContainer>
  );
};

export default AdminDashboard;
