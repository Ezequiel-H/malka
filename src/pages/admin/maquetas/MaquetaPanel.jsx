import { Icon, cn } from '../../../components/ui';
import { Avatar, Avatares, Boton, IconoPropuesta } from './piezas';
import { ACTIVIDADES, PERSONAS, PROPUESTAS, SEMANA } from './datos';

const nombres = PERSONAS.map((p) => `${p.nombre} ${p.apellido}`);
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/* Lo que hay para hacer hoy, cada cosa con su acción a un toque. */
const PENDIENTES = [
  { icono: 'users', titulo: '4 personas esperan aprobación', detalle: 'La más antigua, hace 3 días', caras: nombres.slice(8, 12), accion: 'Revisar', tono: 'warning' },
  { icono: 'document', titulo: '5 inscripciones por confirmar', detalle: 'Cocina israelí y el viaje a Bariloche', caras: nombres.slice(2, 7), accion: 'Confirmar', tono: 'warning' },
  { icono: 'payment', titulo: '3 comprobantes de pago', detalle: 'Kabbalat Shabbat del viernes', caras: nombres.slice(0, 3), accion: 'Revisar', tono: 'info' },
  { icono: 'cake', titulo: 'Hoy cumple Maia Stern', detalle: '27 años · vino 18 veces este año', caras: ['Maia Stern'], accion: 'Saludar', tono: 'success', icAccion: 'whatsapp' },
];

/* Un mini gráfico de barras para acompañar cada número. */
const Barritas = ({ valores, color = '#537f61' }) => {
  const max = Math.max(...valores);
  return (
    <span className="flex h-8 items-end gap-[3px]" aria-hidden>
      {valores.map((v, i) => (
        <span
          key={i}
          className="w-2 rounded-[3px] transition-[height] duration-slow"
          style={{ height: `${Math.max(12, (v / max) * 100)}%`, background: color, opacity: i === valores.length - 1 ? 1 : 0.35 }}
        />
      ))}
    </span>
  );
};

/* Un anillo de cupo: lleno, se ve sin leer el número. */
const Anillo = ({ valor, total }) => {
  const pct = Math.min(1, valor / total);
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 84 84" className="h-24 w-24 -rotate-90" aria-hidden>
      <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(44,61,52,0.08)" strokeWidth="9" />
      <circle cx="42" cy="42" r={r} fill="none" stroke={pct >= 0.9 ? '#c98a1e' : '#537f61'} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} className="transition-[stroke-dasharray] duration-slow" />
    </svg>
  );
};

/**
 * Maqueta del nuevo Panel. En vez de cinco tarjetas iguales con números
 * sueltos, arranca por lo que hay para hacer (con la acción a un toque),
 * sigue con los números de la casa en una sola franja, y muestra la semana
 * y el próximo encuentro como se los imagina el equipo.
 */
const MaquetaPanel = () => {
  const shabbat = ACTIVIDADES[0];
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-ink-muted">Miércoles 13 de noviembre</p>
          <h1 className="mt-1 font-grotesk text-[clamp(1.8rem,3vw,2.4rem)] font-semibold tracking-tight text-ink">Buen día, Wally</h1>
          <p className="mt-1 text-ink-soft">Hoy hay Shiur a las 20 y el viernes ya hay 34 anotados para Shabbat.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Boton variante="borde" icono="users" tamano="sm">
            Sumar visita
          </Boton>
          <Boton variante="borde" icono="download" tamano="sm">
            Exportar
          </Boton>
          <Boton icono="add" tamano="sm">
            Nueva actividad
          </Boton>
        </div>
      </header>

      <section>
        <h2 className="mb-3 font-grotesk text-sm font-semibold uppercase tracking-label text-ink-muted">Para hacer</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {PENDIENTES.map((p) => (
            <li key={p.titulo} className="flex min-w-0 items-center gap-3 rounded-[18px] border border-surface-border bg-surface px-4 py-3.5 transition-shadow duration-base hover:shadow-card sm:gap-4">
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]',
                  p.tono === 'warning' && 'bg-warning-50 text-warning-700',
                  p.tono === 'info' && 'bg-info-50 text-info-700',
                  p.tono === 'success' && 'bg-success-50 text-success-700'
                )}
              >
                <Icon name={p.icono} size="sm" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">{p.titulo}</span>
                <span className="block truncate text-sm text-ink-muted">{p.detalle}</span>
              </span>
              <span className="hidden sm:block">
                {p.caras.length === 1 ? <Avatar nombre={p.caras[0]} tamano={32} /> : <Avatares nombres={p.caras} total={p.caras.length} max={3} />}
              </span>
              <Boton variante={p.icAccion ? 'verde' : 'suave'} tamano="sm" icono={p.icAccion}>
                {p.accion}
              </Boton>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid divide-y divide-surface-border rounded-[22px] border border-surface-border bg-surface sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x rtl:lg:divide-x-reverse">
        {[
          { t: 'Vinieron este mes', v: '94', d: '21 por primera vez', barras: SEMANA.map((s) => s.personas) },
          { t: 'Vuelven', v: '62 %', d: 'de los nuevos, en 60 días', barras: [48, 52, 55, 58, 61, 62] },
          { t: 'Por encuentro', v: '18', d: 'personas en promedio', barras: [14, 16, 15, 19, 17, 18] },
          { t: 'Se cubrió', v: '71 %', d: 'de lo gastado este mes', barras: [55, 60, 66, 70, 68, 71], color: '#c98a1e' },
        ].map((n) => (
          <div key={n.t} className="flex items-end justify-between gap-4 px-6 py-5">
            <div>
              <p className="text-sm text-ink-muted">{n.t}</p>
              <p className="mt-1 font-grotesk text-4xl font-semibold tabular-nums tracking-tight text-ink">{n.v}</p>
              <p className="text-sm text-ink-muted">{n.d}</p>
            </div>
            <Barritas valores={n.barras} color={n.color} />
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] [&>*]:min-w-0">
        <section className="rounded-[22px] border border-surface-border bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-grotesk text-lg font-semibold text-ink">Esta semana en la casa</h2>
            <span className="text-sm text-ink-muted">11 al 17 de nov</span>
          </div>
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <div className="grid min-w-[34rem] grid-cols-7 gap-1.5">
            {DIAS.map((d, i) => {
              const delDia = ACTIVIDADES.filter((a) => a.dia === i);
              return (
                <div key={d} className={cn('min-h-[9rem] rounded-[14px] p-2', i === 2 ? 'bg-ink/[0.04] ring-1 ring-ink/10' : '')}>
                  <p className={cn('text-center text-xs font-semibold', i === 2 ? 'text-ink' : 'text-ink-muted')}>{d}</p>
                  <p className={cn('mb-2 text-center font-grotesk text-lg font-semibold', i === 2 ? 'text-ink' : 'text-ink-soft')}>{11 + i}</p>
                  <div className="space-y-1.5">
                    {delDia.map((a) => (
                      <span
                        key={a.id}
                        className="block rounded-[8px] px-1.5 py-1 text-[0.7rem] leading-tight"
                        style={{ background: `${PROPUESTAS[a.propuesta].color}1f` }}
                        title={`${a.titulo} · ${a.hora}`}
                      >
                        <span className="block font-semibold tabular-nums" style={{ color: PROPUESTAS[a.propuesta].color }}>
                          {a.hora}
                        </span>
                        <span className="line-clamp-2 font-medium text-ink">{a.titulo}</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </section>

        <section className="flex flex-col rounded-[22px] bg-ink p-6 text-surface">
          <p className="text-xs font-semibold uppercase tracking-label text-surface/60">Próximo encuentro grande</p>
          <div className="mt-3 flex items-center gap-3">
            <IconoPropuesta propuesta={shabbat.propuesta} />
            <div>
              <h2 className="font-grotesk text-xl font-semibold">{shabbat.titulo}</h2>
              <p className="text-sm text-surface/70">Viernes 15 · 20:30</p>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-5">
            <span className="relative flex items-center justify-center">
              <Anillo valor={shabbat.inscriptos} total={shabbat.cupo} />
              <span className="absolute text-center">
                <span className="block font-grotesk text-2xl font-semibold tabular-nums">{shabbat.inscriptos}</span>
                <span className="block text-[0.7rem] text-surface/60">de {shabbat.cupo}</span>
              </span>
            </span>
            <div className="space-y-1 text-sm text-surface/80">
              <p>{shabbat.espera} en lista de espera</p>
              <p>6 vienen por primera vez</p>
              <p>3 comen sin TACC</p>
            </div>
          </div>
          <div className="mt-5">
            <Avatares nombres={nombres} total={shabbat.inscriptos} max={8} />
          </div>
          <div className="mt-auto flex gap-2 pt-6">
            <button type="button" className="min-h-[38px] flex-1 rounded-pill bg-surface px-4 text-sm font-semibold text-ink">
              Lista para el día
            </button>
            <button type="button" className="min-h-[38px] rounded-pill px-4 text-sm font-semibold text-surface ring-1 ring-surface/30">
              Ver todo
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MaquetaPanel;
