import { cn } from '../../../components/ui';

/*
 * Las paletas candidatas para Métricas. Cada par pasó la validación de color
 * (separación para daltonismo, croma y luminosidad sobre la superficie). Las
 * rampas son de un solo tono, de claro a oscuro, para el calor y una sola serie.
 */
const PALETAS = [
  {
    id: 'actual',
    nombre: 'La de hoy',
    que: 'Verde bosque y ámbar.',
    a: '#2f7546',
    b: '#c98a1e',
    rampa: ['#f2f7f3', '#e0ece3', '#c3d9c9', '#9cbfa6', '#7fac8c', '#689b78', '#537f61', '#42654d', '#37523f', '#2e4435'],
  },
  {
    id: 'azul',
    nombre: 'Azul y ámbar',
    que: 'Más clara para leer: el azul no compite con el verde de la marca.',
    a: '#3d5fb0',
    b: '#d99a1c',
    rampa: ['#f1f4fb', '#dfe6f6', '#c2d0ee', '#9fb4e3', '#7f98d6', '#5f7cc6', '#4663b3', '#384f96', '#2d3f78', '#24325f'],
  },
  {
    id: 'ciruela',
    nombre: 'Ciruela y ámbar',
    que: 'Más cálida, con el tono de Shabat. Se despega del resto de la plataforma.',
    a: '#7b4fa0',
    b: '#d4952a',
    rampa: ['#f6f1f8', '#ebdff0', '#d9c2e3', '#c3a0d2', '#a87fbe', '#8f62a9', '#7b4fa0', '#653f86', '#50326b', '#3f2854'],
  },
  {
    id: 'lavanda',
    nombre: 'Verde y lavanda',
    que: 'Se queda con el verde de la marca y cambia el ámbar por un lavanda.',
    a: '#2f7546',
    b: '#9a5bb5',
    rampa: ['#f2f7f3', '#e0ece3', '#c3d9c9', '#9cbfa6', '#7fac8c', '#689b78', '#537f61', '#42654d', '#37523f', '#2e4435'],
  },
];

/* Totales reales del último año (personas y nuevas por mes), sin nombres. */
const MESES = [
  ['dic', 321, 149],
  ['ene', 145, 27],
  ['feb', 119, 18],
  ['mar', 241, 70],
  ['abr', 186, 31],
  ['may', 219, 61],
  ['jun', 128, 40],
  ['jul', 51, 3],
  ['ago', 65, 16],
  ['sep', 218, 47],
  ['oct', 112, 34],
  ['nov', 4, 0],
];
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
/* Intensidad 0–9 por día y mes, la forma que tienen hoy las temporadas. */
const CALOR = [
  [0, 0, 0, 7, 3, 0, 0, 0, 0, 0, 4, 0],
  [3, 3, 0, 3, 5, 5, 4, 0, 0, 0, 3, 2],
  [0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [8, 5, 0, 0, 3, 7, 0, 0, 3, 3, 3, 0],
  [9, 6, 9, 9, 8, 8, 6, 4, 3, 7, 7, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];
const RANKING = [
  ['Espiritual', 726],
  ['Shabbat', 583],
  ['Cultura', 279],
  ['Iamim Noraim', 166],
  ['Instituciones', 119],
];

const MesAMes = ({ p }) => {
  const max = 340;
  return (
    <div>
      <div className="mb-2 flex gap-4 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: p.a }} /> Ya venían
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: p.b }} /> Nuevas
        </span>
      </div>
      <div className="flex h-36 items-end gap-1.5 border-b border-surface-border">
        {MESES.map(([m, total, nuevas]) => (
          <div key={m} className="flex flex-1 flex-col justify-end gap-[2px]" title={`${m}: ${total} personas, ${nuevas} nuevas`}>
            {nuevas > 0 && <span className="rounded-t-[4px]" style={{ height: `${(nuevas / max) * 144}px`, background: p.b }} />}
            <span className={cn(nuevas > 0 ? '' : 'rounded-t-[4px]')} style={{ height: `${((total - nuevas) / max) * 144}px`, background: p.a }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1.5 text-center text-[0.65rem] text-ink-muted">
        {MESES.map(([m]) => (
          <span key={m} className="flex-1">
            {m}
          </span>
        ))}
      </div>
    </div>
  );
};

const Temporadas = ({ p }) => (
  <div className="grid grid-cols-[2rem_repeat(12,minmax(0,1fr))] gap-[2px] text-[0.65rem] text-ink-muted">
    {CALOR.map((fila, i) => (
      <div key={DIAS[i]} className="contents">
        <span className="self-center">{DIAS[i]}</span>
        {fila.map((v, j) => (
          <span key={j} className="h-4 rounded-[3px]" style={{ background: p.rampa[v] }} />
        ))}
      </div>
    ))}
  </div>
);

const Ranking = ({ p }) => (
  <ul className="space-y-2">
    {RANKING.map(([n, v]) => (
      <li key={n}>
        <span className="flex justify-between text-xs">
          <span className="text-ink">{n}</span>
          <span className="tabular-nums text-ink-muted">{v}</span>
        </span>
        <span className="mt-1 block h-2 rounded-pill bg-ink/[0.05]">
          <span className="block h-2 rounded-pill" style={{ width: `${(v / 726) * 100}%`, background: p.a }} />
        </span>
      </li>
    ))}
  </ul>
);

/**
 * Maqueta para elegir los colores de Métricas: los mismos tres gráficos con
 * cada paleta, uno al lado del otro.
 */
const MaquetaColores = () => (
  <div className="grid gap-6 xl:grid-cols-2 [&>*]:min-w-0">
    {PALETAS.map((p) => (
      <section key={p.id} className="rounded-[22px] border border-surface-border bg-surface p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-grotesk text-lg font-semibold text-ink">{p.nombre}</h2>
            <p className="text-sm text-ink-muted">{p.que}</p>
          </div>
          <span className="flex shrink-0 gap-1">
            {[p.a, p.b, p.rampa[3], p.rampa[8]].map((c) => (
              <span key={c} className="h-6 w-6 rounded-pill" style={{ background: c }} />
            ))}
          </span>
        </div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-label text-ink-faint">Mes a mes</p>
        <MesAMes p={p} />
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-label text-ink-faint">Temporadas</p>
            <Temporadas p={p} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-label text-ink-faint">Por propuesta</p>
            <Ranking p={p} />
          </div>
        </div>
      </section>
    ))}
  </div>
);

export default MaquetaColores;
