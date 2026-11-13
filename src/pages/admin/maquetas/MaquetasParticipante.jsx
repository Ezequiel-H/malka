import { useState } from 'react';
import { Avatares, BarraCupo, Button, Icon, IconoColor, cn } from '../../../components/ui';
import { ACTIVIDADES, PERSONAS, PROPUESTAS } from './datos';

const nombres = PERSONAS.map((p) => `${p.nombre} ${p.apellido}`);
const color = (a) => PROPUESTAS[a.propuesta].color;
const icono = (a) => PROPUESTAS[a.propuesta].icono;
const precio = (n) =>
  n
    ? new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0,
      }).format(n)
    : 'Gratis';

/**
 * El marco de celular: el participante entra casi siempre desde el teléfono
 * (la app se instala), así que sus maquetas se piensan a ese tamaño. En un
 * celular de verdad el marco desaparece y queda la pantalla.
 */
export const Celular = ({ activa, children }) => (
  <div className="mx-auto w-full max-w-[400px] overflow-hidden rounded-[28px] border border-surface-border sm:rounded-[40px] sm:border-[10px] sm:border-ink sm:shadow-raised">
    <div className="relative flex min-h-[760px] flex-col overflow-hidden bg-surface-page sm:rounded-[30px]">
      <div className="flex-1 overflow-y-auto px-4 pb-24 pt-5">{children}</div>
      <nav className="absolute inset-x-0 bottom-0 grid grid-cols-4 border-t border-surface-border bg-surface/95 px-2 pb-3 pt-2 backdrop-blur">
        {[
          ['inicio', 'Inicio', 'dashboard'],
          ['cartelera', 'Cartelera', 'activity'],
          ['mias', 'Mis cosas', 'document'],
          ['perfil', 'Perfil', 'user'],
        ].map(([id, t, ic]) => (
          <span key={id} className={cn('flex flex-col items-center gap-0.5 text-[0.68rem] font-medium', activa === id ? 'text-ink' : 'text-ink-faint')}>
            <span className={cn('flex h-7 w-12 items-center justify-center rounded-pill', activa === id && 'bg-ink/[0.07]')}>
              <Icon name={ic} size="sm" />
            </span>
            {t}
          </span>
        ))}
      </nav>
    </div>
  </div>
);

/* ---------------- Inicio del participante ---------------- */

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const MaquetaInicio = () => {
  const [dia, setDia] = useState(4);
  const delDia = ACTIVIDADES.filter((a) => a.dia === dia);
  const mia = ACTIVIDADES[0];
  return (
    <Celular activa="inicio">
      <p className="text-sm text-ink-muted">Miércoles 13 de noviembre</p>
      <h1 className="font-grotesk text-[1.7rem] font-semibold tracking-tight text-ink">Hola, Ana</h1>

      {/* Lo próximo que tiene: lo primero que quiere saber al abrir. */}
      <section className="mt-4 overflow-hidden rounded-[22px] bg-ink text-surface">
        <div className="p-5">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-label text-surface/70">
            <span className="h-2 w-2 rounded-pill" style={{ background: color(mia) }} />
            Tu próxima · en 2 días
          </p>
          <h2 className="mt-1 font-grotesk text-xl font-semibold">{mia.titulo}</h2>
          <p className="text-sm text-surface/80">Viernes 15 · 20:30 · 3 de Febrero 1325</p>
          <div className="mt-4 flex items-center justify-between">
            <Avatares nombres={nombres} total={34} max={4} tamano={26} />
            <span className="text-xs text-surface/80">34 van</span>
          </div>
        </div>
        <div className="flex border-t border-surface/15">
          <span className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold">
            <Icon name="addToCalendar" size="sm" />
            Calendario
          </span>
          <span className="flex flex-1 items-center justify-center gap-2 border-s border-surface/15 py-3 text-sm font-semibold">
            <Icon name="location" size="sm" />
            Cómo llegar
          </span>
        </div>
      </section>

      <section className="mt-7">
        <h2 className="mb-3 font-grotesk text-lg font-semibold text-ink">Esta semana en Malka</h2>
        <div className="grid grid-cols-7 gap-1.5">
          {DIAS.map((d, i) => {
            const hay = ACTIVIDADES.filter((a) => a.dia === i);
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDia(i)}
                className={cn('flex flex-col items-center rounded-[14px] py-2 transition-colors duration-base', dia === i ? 'bg-ink text-surface' : 'bg-surface text-ink-soft')}
              >
                <span className="text-[0.7rem] font-medium opacity-70">{d}</span>
                <span className="font-grotesk text-lg font-semibold">{11 + i}</span>
                <span className="mt-1 flex gap-0.5">
                  {hay.slice(0, 3).map((a) => (
                    <span key={a.id} className="h-1.5 w-1.5 rounded-pill" style={{ background: dia === i ? '#fff' : color(a) }} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
        <ul key={dia} className="mt-4 animate-fade-in space-y-3">
          {delDia.length ? (
            delDia.map((a) => (
              <li key={a.id} className="flex items-center gap-3 rounded-[18px] bg-surface p-3.5">
                <IconoColor icono={icono(a)} color={color(a)} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-grotesk font-semibold text-ink">{a.titulo}</span>
                  <span className="block text-sm text-ink-muted">
                    {a.hora} · {precio(a.precio)}
                  </span>
                </span>
                <Button size="sm" variant={a.id === 'a1' ? 'soft' : 'primary'} icon={a.id === 'a1' ? 'check' : undefined}>
                  {a.id === 'a1' ? 'Vas' : 'Anotarme'}
                </Button>
              </li>
            ))
          ) : (
            <li className="rounded-[18px] border border-dashed border-surface-border px-4 py-6 text-center text-sm text-ink-muted">
              Ese día no hay actividades, pero la casa está abierta de 14 a 21.
            </li>
          )}
        </ul>
      </section>

      <section className="mt-7">
        <h2 className="mb-1 font-grotesk text-lg font-semibold text-ink">Para vos</h2>
        <p className="mb-3 text-sm text-ink-muted">Porque te interesan Cocina y Música</p>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
          {ACTIVIDADES.filter((a) => ['cocina', 'música'].includes(a.propuesta)).map((a) => (
            <article key={a.id} className="w-56 shrink-0 overflow-hidden rounded-[20px] bg-surface">
              <div className="flex h-16 items-end p-3" style={{ background: `${color(a)}1f` }}>
                <IconoColor icono={icono(a)} color={color(a)} tamano="sm" />
              </div>
              <div className="p-3.5">
                <h3 className="font-grotesk font-semibold leading-snug text-ink">{a.titulo}</h3>
                <p className="text-sm capitalize text-ink-muted">{a.proxima}</p>
                <div className="mt-3">
                  <BarraCupo inscriptos={a.inscriptos} cupo={a.cupo} ancho="w-full" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </Celular>
  );
};

/* ---------------- Detalle de una actividad ---------------- */

export const MaquetaDetalle = () => {
  const a = ACTIVIDADES[4];
  const fechas = [
    { f: 'Sáb 23 nov', quedan: 4 },
    { f: 'Sáb 30 nov', quedan: 11 },
    { f: 'Sáb 7 dic', quedan: 0 },
  ];
  const [fecha, setFecha] = useState(fechas[0].f);
  const [listo, setListo] = useState(false);
  return (
    <Celular activa="cartelera">
      <div className="-mx-4 -mt-5 flex h-48 items-end justify-between px-5 pb-5" style={{ background: `${color(a)}24` }}>
        <span className="flex h-9 w-9 items-center justify-center rounded-pill bg-surface/80 text-ink">
          <Icon name="back" size="sm" />
        </span>
        <IconoColor icono={icono(a)} color={color(a)} tamano="lg" />
      </div>
      <h1 className="mt-4 font-grotesk text-2xl font-semibold tracking-tight text-ink">{a.titulo}</h1>
      <p className="mt-1 text-ink-soft">Shakshuka, jalá y el secreto de la abuela. Salís sabiendo hacerlo y con algo rico para llevar.</p>

      <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
        {[
          ['time', '11:00', '2 horas'],
          ['location', 'Malka', 'Belgrano'],
          ['payment', precio(a.precio), 'por clase'],
        ].map(([ic, v, d]) => (
          <div key={ic} className="rounded-[16px] bg-surface px-2 py-3">
            <Icon name={ic} size="sm" className="mx-auto text-ink-muted" />
            <dd className="mt-1 font-grotesk text-sm font-semibold text-ink">{v}</dd>
            <dt className="text-[0.7rem] text-ink-muted">{d}</dt>
          </div>
        ))}
      </dl>

      <section className="mt-6">
        <h2 className="mb-3 font-grotesk font-semibold text-ink">Elegí el día</h2>
        <div className="space-y-2">
          {fechas.map((x) => (
            <button
              key={x.f}
              type="button"
              disabled={!x.quedan}
              onClick={() => {
                setFecha(x.f);
                setListo(false);
              }}
              className={cn(
                'flex w-full items-center justify-between rounded-[16px] border px-4 py-3 text-start transition-colors duration-base',
                fecha === x.f ? 'border-ink bg-surface' : 'border-transparent bg-surface/70',
                !x.quedan && 'opacity-60',
              )}
            >
              <span className="font-grotesk font-semibold text-ink">{x.f}</span>
              <span className={cn('text-sm', x.quedan ? (x.quedan <= 4 ? 'font-semibold text-warning-700' : 'text-ink-muted') : 'text-ink-muted')}>
                {x.quedan ? (x.quedan <= 4 ? `Quedan ${x.quedan} lugares` : `${x.quedan} lugares`) : 'Lleno · lista de espera'}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 flex items-center gap-3 rounded-[18px] bg-surface p-4">
        <Avatares nombres={nombres} total={12} max={4} />
        <p className="text-sm text-ink-soft">12 personas ya se anotaron, 3 por primera vez.</p>
      </section>

      {/* Inscribirse en un paso: la barra queda abajo, al alcance del pulgar. */}
      <div className="sticky bottom-0 -mx-4 mt-6 border-t border-surface-border bg-surface-page/95 px-4 py-3 backdrop-blur">
        {listo ? (
          <div className="animate-fade-in-up flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-pill bg-success-50 text-success-700">
              <Icon name="check" size="sm" />
            </span>
            <span className="flex-1 text-sm">
              <span className="block font-semibold text-ink">¡Listo! Te esperamos el {fecha.toLowerCase()}</span>
              <span className="text-ink-muted">Te avisamos un día antes</span>
            </span>
            <Button size="sm" variant="soft" icon="addToCalendar">
              Agendar
            </Button>
          </div>
        ) : (
          <Button fullWidth icon="check" onClick={() => setListo(true)}>
            Anotarme al {fecha.toLowerCase()} · {precio(a.precio)}
          </Button>
        )}
      </div>
    </Celular>
  );
};

/* ---------------- Mis inscripciones ---------------- */

const MESES = [3, 5, 2, 4, 6, 1, 0, 2, 5, 4, 3, 2];
const NOMBRES_MES = ['dic', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov'];

export const MaquetaMisInscripciones = () => (
  <Celular activa="mias">
    <h1 className="font-grotesk text-[1.7rem] font-semibold tracking-tight text-ink">Mis cosas</h1>

    {/* Cuánto viene, para que se vea parte. */}
    <section className="mt-4 rounded-[22px] bg-surface p-5">
      <p className="text-sm text-ink-muted">Este año viniste</p>
      <p className="font-grotesk text-4xl font-semibold tabular-nums text-ink">
        37 <span className="text-lg font-medium text-ink-muted">veces</span>
      </p>
      <div className="mt-4 flex h-14 items-end gap-1.5" aria-hidden>
        {MESES.map((n, i) => (
          <span key={i} className="flex flex-1 flex-col items-center gap-1">
            <span
              className="w-full rounded-[4px] bg-primary-600"
              style={{
                height: `${Math.max(6, n * 7)}px`,
                opacity: i === MESES.length - 1 ? 1 : 0.45,
              }}
            />
            <span className="text-[0.6rem] text-ink-faint">{NOMBRES_MES[i][0]}</span>
          </span>
        ))}
      </div>
      <p className="mt-3 text-sm text-ink-soft">Lo que más hacés: Shabbat y Cocina.</p>
    </section>

    <section className="mt-6">
      <h2 className="mb-3 font-grotesk text-lg font-semibold text-ink">Próximas</h2>
      <ol className="relative space-y-3 ps-5 before:absolute before:bottom-2 before:start-[7px] before:top-2 before:w-px before:bg-surface-border">
        {[
          {
            a: ACTIVIDADES[0],
            cuando: 'Viernes 15 · en 2 días',
            estado: 'Confirmada',
            tono: 'success',
          },
          {
            a: ACTIVIDADES[4],
            cuando: 'Sábado 23',
            estado: 'Falta pagar',
            tono: 'warning',
          },
          {
            a: ACTIVIDADES[3],
            cuando: 'Jueves 28',
            estado: 'En lista de espera · 2°',
            tono: 'info',
          },
        ].map(({ a, cuando, estado, tono }) => (
          <li key={a.id} className="relative">
            <span className="absolute -start-5 top-4 h-3.5 w-3.5 rounded-pill ring-4 ring-surface-page" style={{ background: color(a) }} />
            <div className="rounded-[18px] bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <span>
                  <span className="block font-grotesk font-semibold text-ink">{a.titulo}</span>
                  <span className="text-sm text-ink-muted">{cuando}</span>
                </span>
                <span
                  className={cn(
                    'shrink-0 rounded-pill px-2 py-0.5 text-xs font-semibold',
                    tono === 'success' && 'bg-success-50 text-success-700',
                    tono === 'warning' && 'bg-warning-50 text-warning-700',
                    tono === 'info' && 'bg-info-50 text-info-700',
                  )}
                >
                  {estado}
                </span>
              </div>
              {tono === 'warning' && (
                <Button size="sm" className="mt-3" icon="upload">
                  Subir comprobante
                </Button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>

    <section className="mt-6">
      <h2 className="mb-3 font-grotesk text-lg font-semibold text-ink">Ya fuiste</h2>
      <ul className="divide-y divide-surface-border rounded-[18px] bg-surface">
        {[
          [ACTIVIDADES[0], 'Viernes 8 de nov'],
          [ACTIVIDADES[1], 'Martes 5 de nov'],
          [ACTIVIDADES[0], 'Viernes 1 de nov'],
        ].map(([a, f], i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-3">
            <IconoColor icono={icono(a)} color={color(a)} tamano="sm" />
            <span className="flex-1">
              <span className="block text-sm font-semibold text-ink">{a.titulo}</span>
              <span className="text-xs text-ink-muted">{f}</span>
            </span>
            <Icon name="check" size="sm" className="text-success-700" />
          </li>
        ))}
      </ul>
    </section>
  </Celular>
);

/* ---------------- Mi perfil ---------------- */

export const MaquetaPerfil = () => {
  const [intereses, setIntereses] = useState(['cocina', 'música', 'espiritualidad']);
  const [editando, setEditando] = useState(null);
  const [telefono, setTelefono] = useState('+54 9 11 5555-0101');
  return (
    <Celular activa="perfil">
      <div className="flex flex-col items-center text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-pill bg-primary-600 font-grotesk text-2xl font-semibold text-surface">AG</span>
        <h1 className="mt-3 font-grotesk text-xl font-semibold text-ink">Ana Groisman</h1>
        <p className="text-sm text-ink-muted">Parte de Malka desde marzo de 2024</p>
      </div>

      <section className="mt-6">
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-label text-ink-faint">Mis datos</h2>
        <ul className="divide-y divide-surface-border rounded-[18px] bg-surface">
          {[
            ['mail', 'Mail', 'ana@ejemplo.com', false],
            ['phone', 'Teléfono', telefono, true],
            ['cake', 'Cumpleaños', '18 de octubre', true],
            ['globe', 'Idioma', 'Español', true],
          ].map(([ic, t, v, edita]) => (
            <li key={t} className="px-4 py-3">
              {editando === t ? (
                <div className="flex animate-fade-in items-center gap-2">
                  <input
                    autoFocus
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="min-w-0 flex-1 rounded-control border border-ink/20 bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-ink"
                  />
                  <Button size="sm" onClick={() => setEditando(null)}>
                    Listo
                  </Button>
                </div>
              ) : (
                <button type="button" disabled={!edita} onClick={() => setEditando(t === 'Teléfono' ? t : null)} className="flex w-full items-center gap-3 text-start">
                  <Icon name={ic} size="sm" className="text-ink-muted" />
                  <span className="flex-1">
                    <span className="block text-xs text-ink-muted">{t}</span>
                    <span className="text-sm font-medium text-ink">{v}</span>
                  </span>
                  {edita && <Icon name="chevronRight" size="sm" className="text-ink-faint rtl:-scale-x-100" />}
                </button>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-2 px-1 text-xs text-ink-muted">Tocá un dato para cambiarlo. Se guarda solo.</p>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-label text-ink-faint">Me interesa</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PROPUESTAS).map(([n, p]) => {
            const activo = intereses.includes(n);
            return (
              <button
                key={n}
                type="button"
                onClick={() => setIntereses((xs) => (activo ? xs.filter((x) => x !== n) : [...xs, n]))}
                className={cn(
                  'inline-flex min-h-[38px] items-center gap-2 rounded-pill px-3.5 text-sm font-medium capitalize transition-colors duration-base',
                  activo ? 'text-surface' : 'bg-surface text-ink-soft',
                )}
                style={activo ? { background: p.color } : undefined}
              >
                <Icon name={activo ? 'check' : p.icono} size="xs" />
                {n}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-label text-ink-faint">Comida</h2>
        <div className="flex flex-wrap gap-2">
          {['Vegetariana', 'Vegana', 'Sin TACC', 'Sin lactosa', 'Sin nueces'].map((r, i) => (
            <span key={r} className={cn('inline-flex min-h-[38px] items-center rounded-pill px-3.5 text-sm', i === 0 ? 'bg-ink text-surface' : 'bg-surface text-ink-soft')}>
              {r}
            </span>
          ))}
        </div>
      </section>
    </Celular>
  );
};
