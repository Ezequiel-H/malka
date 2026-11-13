import { useEffect, useRef, useState } from 'react';
import { Avatar, BarraCupo, Icon, IconoColor, cn } from '../../../components/ui';
import { Segmentado } from '../../../components/admin/metricas/piezas';
import { Boton } from './piezas';
import { PERSONAS, PROPUESTAS } from './datos';

const nombre = (p) => `${p.nombre} ${p.apellido}`;
const precio = (n) =>
  n
    ? new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0,
      }).format(n)
    : 'Gratis';

/* Cuántas veces vino cada mes, inventado a partir del id para que varíe. */
const vecesPorMes = (id) => Array.from({ length: 8 }, (_, i) => ((id * 5 + i * 3) % 7) - (i < 2 ? 2 : 0)).map((v) => Math.max(0, v));

const ESTADO = {
  frecuente: { t: 'Frecuente', c: 'bg-success-50 text-success-700' },
  nueva: { t: 'Nueva', c: 'bg-info-50 text-info-700' },
  enfriando: { t: 'Se está alejando', c: 'bg-warning-50 text-warning-700' },
};
const estadoDe = (p) => (p.id % 4 === 0 ? 'enfriando' : p.id > 8 ? 'nueva' : 'frecuente');

const Barritas = ({ valores }) => {
  const max = Math.max(1, ...valores);
  return (
    <span className="flex h-6 items-end gap-[2px]" aria-hidden>
      {valores.map((v, i) => (
        <span
          key={i}
          className="w-1.5 rounded-[2px] bg-primary-600"
          style={{
            height: `${Math.max(8, (v / max) * 100)}%`,
            opacity: v ? (i === valores.length - 1 ? 1 : 0.45) : 0.12,
          }}
        />
      ))}
    </span>
  );
};

/* ---------------- Personas: la lista y la ficha ---------------- */

const Ficha = ({ persona }) => {
  const meses = vecesPorMes(persona.id);
  const e = ESTADO[estadoDe(persona)];
  return (
    <aside className="animate-fade-in-up rounded-[22px] border border-surface-border bg-surface lg:sticky lg:top-24">
      <div className="flex flex-col items-center px-6 pb-5 pt-7 text-center">
        <Avatar nombre={nombre(persona)} tamano={72} borde={false} />
        <h3 className="mt-3 font-grotesk text-xl font-semibold text-ink">{nombre(persona)}</h3>
        <p className="text-sm text-ink-muted">{persona.edad} años · desde marzo de 2024</p>
        <span className={cn('mt-2 rounded-pill px-2.5 py-0.5 text-xs font-semibold', e.c)}>{e.t}</span>
        <div className="mt-4 flex gap-2">
          <Boton variante="verde" tamano="sm" icono="whatsapp">
            WhatsApp
          </Boton>
          <Boton variante="suave" tamano="sm" icono="mail">
            Mail
          </Boton>
        </div>
      </div>

      <div className="grid grid-cols-3 border-y border-surface-border text-center">
        {[
          ['Vino', meses.reduce((a, b) => a + b, 0)],
          ['Última vez', 'hace 5 d'],
          ['Faltó', '1'],
        ].map(([t, v], i) => (
          <div key={t} className={cn('px-2 py-3', i && 'border-s border-surface-border')}>
            <p className="font-grotesk text-lg font-semibold tabular-nums text-ink">{v}</p>
            <p className="text-xs text-ink-muted">{t}</p>
          </div>
        ))}
      </div>

      <div className="px-6 py-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-label text-ink-faint">Últimos 8 meses</p>
        <div className="flex h-16 items-end gap-1.5">
          {meses.map((v, i) => (
            <span
              key={i}
              className="flex-1 rounded-[4px] bg-primary-600"
              style={{
                height: `${Math.max(6, v * 14)}%`,
                opacity: v ? 0.5 + i * 0.06 : 0.1,
              }}
              title={`${v} veces`}
            />
          ))}
        </div>

        <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-label text-ink-faint">Lo que hace</p>
        <div className="flex flex-wrap gap-1.5">
          {persona.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-semibold capitalize"
              style={{
                background: `${PROPUESTAS[t].color}1a`,
                color: PROPUESTAS[t].color,
              }}
            >
              <Icon name={PROPUESTAS[t].icono} size="xs" />
              {t}
            </span>
          ))}
          {persona.restricciones && <span className="rounded-pill bg-ink/[0.06] px-2.5 py-1 text-xs font-semibold text-ink-soft">{persona.restricciones}</span>}
        </div>

        <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-label text-ink-faint">Último movimiento</p>
        <ol className="space-y-3 text-sm">
          {[
            ['check', 'Vino a Kabbalat Shabbat', 'vie 8 nov'],
            ['document', 'Se anotó a Cocina israelí', 'lun 4 nov'],
            ['payment', 'Pagó Taller de cerámica', 'jue 31 oct'],
          ].map(([ic, t, f]) => (
            <li key={t} className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-ink/[0.05] text-ink-soft">
                <Icon name={ic} size="xs" />
              </span>
              <span className="flex-1 text-ink">{t}</span>
              <span className="text-xs text-ink-muted">{f}</span>
            </li>
          ))}
        </ol>
        <Boton variante="borde" tamano="sm" className="mt-5 w-full">
          Ver la ficha entera
        </Boton>
      </div>
    </aside>
  );
};

export const MaquetaPersonas = () => {
  const pendientes = PERSONAS.filter((p) => p.estado !== 'aceptada').slice(0, 3);
  const [aprobadas, setAprobadas] = useState([]);
  const [filtro, setFiltro] = useState('todas');
  const [elegida, setElegida] = useState(PERSONAS[0].id);
  const lista = PERSONAS.filter((p) => filtro === 'todas' || estadoDe(p) === filtro);
  const persona = PERSONAS.find((p) => p.id === elegida);
  return (
    <div className="space-y-6">
      {/* Las altas por aprobar quedan arriba, juntas, y se aprueban de una. */}
      <section className="rounded-[22px] border border-surface-border bg-surface p-5">
        <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-grotesk text-lg font-semibold text-ink">Esperan aprobación</h2>
            <p className="text-sm text-ink-muted">Se registraron y todavía no pueden anotarse</p>
          </div>
          <Boton variante="suave" tamano="sm" icono="check" onClick={() => setAprobadas(pendientes.map((p) => p.id))}>
            Aprobar todas
          </Boton>
        </div>
        <ul className="grid gap-3 md:grid-cols-3">
          {pendientes.map((p) => {
            const ok = aprobadas.includes(p.id);
            return (
              <li key={p.id} className={cn('flex min-w-0 items-center gap-3 rounded-[16px] p-3 transition-colors duration-base', ok ? 'bg-success-50' : 'bg-surface-sunken')}>
                <Avatar nombre={nombre(p)} tamano={40} borde={false} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink">{nombre(p)}</span>
                  <span className="block truncate text-xs text-ink-muted">{ok ? 'Aprobada · ya le avisamos' : 'Buenos Aires · DNI · hace 2 días'}</span>
                </span>
                {!ok && (
                  <span className="flex gap-1">
                    <button type="button" aria-label="Rechazar" className="flex h-9 w-9 items-center justify-center rounded-pill text-ink-muted hover:bg-ink/[0.06]">
                      <Icon name="close" size="sm" />
                    </button>
                    <button
                      type="button"
                      aria-label="Aprobar"
                      onClick={() => setAprobadas((xs) => [...xs, p.id])}
                      className="flex h-9 w-9 items-center justify-center rounded-pill bg-ink text-surface"
                    >
                      <Icon name="check" size="sm" />
                    </button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmentado
          opciones={[
            { valor: 'todas', etiqueta: 'Todas' },
            { valor: 'frecuente', etiqueta: 'Frecuentes' },
            { valor: 'nueva', etiqueta: 'Nuevas' },
            { valor: 'enfriando', etiqueta: 'Se alejan' },
          ]}
          valor={filtro}
          onChange={setFiltro}
          etiqueta="Qué personas ver"
        />
        <label className="flex min-h-[44px] items-center gap-2 rounded-pill border border-surface-border bg-surface px-4 text-ink-muted lg:w-80">
          <Icon name="search" size="sm" />
          <input placeholder="Nombre, mail o teléfono" className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint" />
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] [&>*]:min-w-0">
        <ul key={filtro} className="animate-fade-in divide-y divide-surface-border overflow-hidden rounded-[22px] border border-surface-border bg-surface">
          {lista.map((p) => {
            const e = ESTADO[estadoDe(p)];
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setElegida(p.id)}
                  className={cn(
                    'grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-5 py-3.5 text-start transition-colors duration-base md:grid-cols-[auto_minmax(0,1fr)_9rem_5rem]',
                    elegida === p.id ? 'bg-primary-50/70' : 'hover:bg-ink/[0.02]',
                  )}
                >
                  <Avatar nombre={nombre(p)} tamano={40} borde={false} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink">{nombre(p)}</span>
                    <span className="flex items-center gap-1.5 text-sm text-ink-muted">
                      {p.tags.map((t) => (
                        <span key={t} className="h-2 w-2 rounded-pill" style={{ background: PROPUESTAS[t].color }} title={t} />
                      ))}
                      <span className="truncate">{p.email}</span>
                    </span>
                  </span>
                  <span className="hidden md:block">
                    <span className={cn('rounded-pill px-2.5 py-0.5 text-xs font-semibold', e.c)}>{e.t}</span>
                  </span>
                  <span className="flex justify-end">
                    <Barritas valores={vecesPorMes(p.id)} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {persona && <Ficha key={persona.id} persona={persona} />}
      </div>
    </div>
  );
};

/* ---------------- Nueva actividad, con la vista previa al lado ---------------- */

const Campo = ({ etiqueta, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-ink">{etiqueta}</span>
    {children}
  </label>
);
const entrada = 'w-full rounded-control border border-surface-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-base focus:border-ink';

export const MaquetaNuevaActividad = () => {
  const [titulo, setTitulo] = useState('Cocina israelí');
  const [propuesta, setPropuesta] = useState('cocina');
  const [tipo, setTipo] = useState('unica');
  const [dias, setDias] = useState([5]);
  const [cupo, setCupo] = useState(16);
  const [monto, setMonto] = useState(8000);
  const p = PROPUESTAS[propuesta];
  const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] [&>*]:min-w-0">
      <div className="space-y-5">
        <section className="rounded-[22px] border border-surface-border bg-surface p-5 sm:p-6">
          <h2 className="mb-4 font-grotesk text-lg font-semibold text-ink">Qué es</h2>
          <div className="space-y-4">
            <Campo etiqueta="Nombre">
              <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className={entrada} />
            </Campo>
            <div>
              <span className="mb-1.5 block text-sm font-medium text-ink">Propuesta</span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PROPUESTAS).map(([n, x]) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPropuesta(n)}
                    className={cn(
                      'inline-flex min-h-[38px] items-center gap-2 rounded-pill border px-3.5 text-sm font-medium capitalize transition-colors duration-base',
                      propuesta === n ? 'border-transparent text-surface' : 'border-surface-border bg-surface text-ink-soft',
                    )}
                    style={propuesta === n ? { background: x.color } : undefined}
                  >
                    <Icon name={x.icono} size="xs" />
                    {n}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-ink-muted">El color y el ícono salen de acá: así se reconoce en la cartelera.</p>
            </div>
          </div>
        </section>

        <section className="rounded-[22px] border border-surface-border bg-surface p-5 sm:p-6">
          <h2 className="mb-4 font-grotesk text-lg font-semibold text-ink">Cuándo</h2>
          <Segmentado
            opciones={[
              { valor: 'unica', etiqueta: 'Una vez' },
              { valor: 'semanal', etiqueta: 'Todas las semanas' },
              { valor: 'viaje', etiqueta: 'Viaje' },
            ]}
            valor={tipo}
            onChange={setTipo}
            etiqueta="Tipo"
          />
          <div key={tipo} className="mt-4 grid animate-fade-in gap-4 sm:grid-cols-2">
            {tipo === 'semanal' ? (
              <div className="sm:col-span-2">
                <span className="mb-1.5 block text-sm font-medium text-ink">Qué días</span>
                <div className="flex gap-1.5">
                  {DIAS.map((d, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setDias((xs) => (xs.includes(i) ? xs.filter((x) => x !== i) : [...xs, i]))}
                      className={cn('h-10 w-10 rounded-pill text-sm font-semibold transition-colors duration-base', dias.includes(i) ? 'bg-ink text-surface' : 'bg-ink/[0.05] text-ink-soft')}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <Campo etiqueta={tipo === 'viaje' ? 'Desde' : 'Día'}>
                <input defaultValue="23/11/2026" className={entrada} />
              </Campo>
            )}
            <Campo etiqueta={tipo === 'viaje' ? 'Hasta' : 'Hora'}>
              <input defaultValue={tipo === 'viaje' ? '25/11/2026' : '11:00'} className={entrada} />
            </Campo>
          </div>
        </section>

        <section className="rounded-[22px] border border-surface-border bg-surface p-5 sm:p-6">
          <h2 className="mb-4 font-grotesk text-lg font-semibold text-ink">Lugares y precio</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Cupo">
              <input type="number" value={cupo} onChange={(e) => setCupo(Number(e.target.value))} className={entrada} />
            </Campo>
            <Campo etiqueta="Precio (0 = gratis)">
              <input type="number" value={monto} onChange={(e) => setMonto(Number(e.target.value))} className={entrada} />
            </Campo>
          </div>
        </section>
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <Icon name="check" size="sm" className="text-success-700" />
          Guardado como borrador hace un momento
        </p>
      </div>

      {/* Así la ve la gente: cambia mientras se escribe. */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-2 text-xs font-semibold uppercase tracking-label text-ink-faint">Así se ve en la cartelera</p>
        <article className="overflow-hidden rounded-[22px] border border-surface-border bg-surface">
          <div className="flex h-28 items-end p-4 transition-colors duration-slow" style={{ background: `${p.color}24` }}>
            <IconoColor icono={p.icono} color={p.color} tamano="lg" />
          </div>
          <div className="p-5">
            <h3 className="font-grotesk text-xl font-semibold text-ink">{titulo || 'Sin nombre'}</h3>
            <p className="text-sm text-ink-muted">
              {tipo === 'semanal'
                ? `Todas las semanas · ${dias.map((d) => ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'][d]).join(', ') || 'elegí días'}`
                : tipo === 'viaje'
                  ? 'Del 23 al 25 de nov'
                  : 'Sáb 23 nov · 11:00'}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <BarraCupo inscriptos={0} cupo={cupo || null} />
              <span className="font-grotesk font-semibold text-ink">{precio(monto)}</span>
            </div>
            <span className="mt-4 flex min-h-[40px] items-center justify-center rounded-pill bg-ink text-sm font-semibold text-surface">Anotarme</span>
          </div>
        </article>
        <div className="mt-4 flex gap-2">
          <Boton variante="borde" className="flex-1">
            Vista previa
          </Boton>
          <Boton className="flex-1">Publicar</Boton>
        </div>
      </aside>
    </div>
  );
};

/* ---------------- Ajustes: índice + guardado solo ---------------- */

/* Los datos que se pueden sumar al mensaje. Se guardan como {clave} (así los
   reemplaza el back), pero en pantalla se ven como pastillas con su nombre. */
const VARIABLES = [
  { clave: 'nombre', etiqueta: 'Nombre', icono: 'user', ejemplo: 'Tamar' },
  { clave: 'actividad', etiqueta: 'Actividad', icono: 'activity', ejemplo: 'Viaje a Bariloche' },
  { clave: 'fecha', etiqueta: 'Fecha', icono: 'addToCalendar', ejemplo: 'vie 6 dic' },
  { clave: 'hora', etiqueta: 'Hora', icono: 'time', ejemplo: '08:00' },
  { clave: 'lugar', etiqueta: 'Lugar', icono: 'location', ejemplo: 'Retiro' },
  { clave: 'precio', etiqueta: 'Precio', icono: 'payment', ejemplo: '$ 850.000' },
];
const PASTILLA = 'mx-0.5 inline-flex select-none items-center rounded-pill bg-primary-600/[0.12] px-2 py-px align-baseline text-[0.85em] font-semibold text-primary-800';

const pastilla = (v) => {
  const el = document.createElement('span');
  el.contentEditable = 'false';
  el.dataset.var = v.clave;
  el.className = PASTILLA;
  el.textContent = v.etiqueta;
  return el;
};

/* Arma el editor a partir del texto guardado y lo vuelve a texto al escribir. */
const pintar = (raiz, texto) => {
  raiz.replaceChildren();
  texto.split(/(\{\w+\})/).forEach((parte) => {
    const v = VARIABLES.find((x) => `{${x.clave}}` === parte);
    raiz.append(v ? pastilla(v) : document.createTextNode(parte));
  });
};
const leer = (raiz) => [...raiz.childNodes].map((n) => (n.dataset?.var ? `{${n.dataset.var}}` : n.textContent)).join('');

const EditorConDatos = ({ valor, onChange }) => {
  const ref = useRef(null);
  const rango = useRef(null);
  useEffect(() => {
    pintar(ref.current, valor);
    // Sólo al montar: después el editor es la fuente de verdad.
  }, []);
  const recordar = () => {
    const sel = window.getSelection();
    if (sel?.rangeCount && ref.current.contains(sel.anchorNode)) rango.current = sel.getRangeAt(0).cloneRange();
  };
  const sumar = (v) => {
    const el = pastilla(v);
    const espacio = document.createTextNode('\u00a0');
    if (rango.current) {
      rango.current.deleteContents();
      const { startContainer: nodo, startOffset: pos } = rango.current;
      const pegado = nodo.nodeType === Node.TEXT_NODE && pos > 0 && !/\s/.test(nodo.textContent[pos - 1]);
      rango.current.insertNode(espacio);
      rango.current.insertNode(el);
      // Si el cursor estaba pegado a una palabra, la pastilla no se le pega.
      if (pegado) rango.current.insertNode(document.createTextNode(' '));
    } else {
      ref.current.append(el, espacio);
    }
    const r = document.createRange();
    r.setStartAfter(espacio);
    rango.current = r;
    onChange(leer(ref.current));
  };
  return (
    <div>
      <div
        ref={ref}
        role="textbox"
        aria-multiline="true"
        aria-label="Mensaje"
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(leer(ref.current))}
        onKeyUp={recordar}
        onMouseUp={recordar}
        onBlur={recordar}
        className={cn(entrada, 'min-h-[8.5rem] whitespace-pre-wrap leading-[1.9]')}
      />
      <p className="mb-2 mt-3 text-xs font-medium text-ink-muted">Tocá un dato para sumarlo donde está el cursor</p>
      <div className="flex flex-wrap gap-1.5">
        {VARIABLES.map((v) => (
          <button
            key={v.clave}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => sumar(v)}
            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-pill border border-surface-border bg-surface px-3 text-xs font-semibold text-ink-soft transition-colors duration-base hover:border-primary-600/40 hover:text-primary-800"
          >
            <Icon name={v.icono} size="xs" />
            {v.etiqueta}
          </button>
        ))}
      </div>
    </div>
  );
};

export const MaquetaAjustes = () => {
  const [seccion, setSeccion] = useState('whatsapp');
  const [mensaje, setMensaje] = useState('¡Hola! Soy {nombre}. Me anoté al {actividad} ({fecha}) y quiero coordinar el pago.');
  const armado = mensaje.split(/(\{\w+\})/).map((parte, i) => {
    const v = VARIABLES.find((x) => `{${x.clave}}` === parte);
    return v ? (
      <strong key={i} className="font-semibold">
        {v.ejemplo}
      </strong>
    ) : (
      parte
    );
  });
  return (
    <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] [&>*]:min-w-0">
      <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 lg:flex-col">
        {[
          ['pagos', 'payment', 'Pagos'],
          ['whatsapp', 'whatsapp', 'WhatsApp'],
          ['registro', 'users', 'Registro'],
          ['casa', 'location', 'La casa'],
          ['avisos', 'bell', 'Avisos'],
        ].map(([id, ic, t]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSeccion(id)}
            className={cn(
              'flex shrink-0 items-center gap-3 rounded-pill px-4 py-2.5 text-sm font-medium transition-colors duration-base',
              seccion === id ? 'bg-ink text-surface' : 'text-ink-soft hover:bg-ink/[0.05]',
            )}
          >
            <Icon name={ic} size="sm" />
            {t}
          </button>
        ))}
      </nav>

      <section className="rounded-[22px] border border-surface-border bg-surface p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-grotesk text-xl font-semibold text-ink">Mensaje para coordinar viajes</h2>
            <p className="text-sm text-ink-muted">Lo que llega escrito cuando alguien anotado a un viaje toca «Escribinos».</p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-ink-muted">
            <Icon name="check" size="xs" className="text-success-700" />
            Guardado
          </span>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div>
            <EditorConDatos valor={mensaje} onChange={setMensaje} />
          </div>
          {/* Cómo le llega: con datos de ejemplo, como en el teléfono. */}
          <div className="rounded-[18px] bg-surface-sunken p-4">
            <p className="mb-3 text-center text-[0.7rem] font-medium text-ink-muted">Así le llega al centro</p>
            <div className="ms-auto max-w-[85%] rounded-[14px] rounded-ee-[4px] bg-success-50 px-3.5 py-2.5 text-sm leading-relaxed text-ink">
              {armado}
              <span className="mt-1 block text-end text-[0.65rem] text-ink-muted">20:14</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
