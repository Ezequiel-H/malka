import { useState } from 'react';
import { Icon, cn } from '../../../components/ui';
import { Boton, IconoPropuesta } from './piezas';
import { ENCUENTROS, PERSONAS } from './datos';

/* Todas las columnas que se pueden exportar. */
const COLUMNAS = {
  nombre: { etiqueta: 'Nombre', de: (p) => p.nombre },
  apellido: { etiqueta: 'Apellido', de: (p) => p.apellido },
  telefono: { etiqueta: 'Teléfono', de: (p) => p.telefono },
  email: { etiqueta: 'Mail', de: (p) => p.email },
  restricciones: { etiqueta: 'Restricciones', de: (p) => p.restricciones || '—' },
  edad: { etiqueta: 'Edad', de: (p) => p.edad },
  estado: { etiqueta: 'Estado', de: (p) => ({ aceptada: 'Confirmada', pendiente: 'Pendiente', en_espera: 'En espera' })[p.estado] },
  pago: { etiqueta: 'Pago', de: (p) => (p.pago === 'aprobado' ? 'Pagó' : p.pago === 'pendiente' ? 'Por revisar' : '—') },
  tags: { etiqueta: 'Intereses', de: (p) => p.tags.join(', ') },
};

/* Para qué se exporta: cada uso trae sus columnas. */
const USOS = [
  { id: 'dia', titulo: 'Lista para el día', detalle: 'Para tener en la puerta: quién viene y qué come', icono: 'document', columnas: ['nombre', 'apellido', 'telefono', 'restricciones'], estados: ['aceptada'] },
  { id: 'contactos', titulo: 'Contactos', detalle: 'Para escribirles después por WhatsApp o mail', icono: 'phone', columnas: ['nombre', 'apellido', 'telefono', 'email'], estados: ['aceptada', 'pendiente', 'en_espera'] },
  { id: 'plata', titulo: 'Pagos', detalle: 'Quién pagó y quién falta', icono: 'payment', columnas: ['nombre', 'apellido', 'estado', 'pago'], estados: ['aceptada', 'pendiente'] },
  { id: 'todo', titulo: 'Todo', detalle: 'Todas las columnas, para cruzar en Excel', icono: 'download', columnas: Object.keys(COLUMNAS), estados: ['aceptada', 'pendiente', 'en_espera'] },
];

const ESTADOS = [
  { id: 'aceptada', etiqueta: 'Confirmadas' },
  { id: 'pendiente', etiqueta: 'Pendientes' },
  { id: 'en_espera', etiqueta: 'En espera' },
];

/**
 * Maqueta del nuevo «Exportar». En vez de una grilla de casillas, se elige
 * para qué es y eso arma las columnas; la vista previa muestra en vivo cómo
 * va a quedar la planilla, y las columnas se ordenan arrastrándolas.
 */
const MaquetaExportar = () => {
  const [uso, setUso] = useState('dia');
  const [columnas, setColumnas] = useState(USOS[0].columnas);
  const [estados, setEstados] = useState(USOS[0].estados);
  const [encuentro, setEncuentro] = useState(ENCUENTROS[0].fecha);
  const [formato, setFormato] = useState('excel');
  const [arrastrando, setArrastrando] = useState(null);
  const [copiado, setCopiado] = useState(false);

  const elegirUso = (u) => {
    setUso(u.id);
    setColumnas(u.columnas);
    setEstados(u.estados);
  };
  const alternarColumna = (c) => {
    setUso('propio');
    setColumnas((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));
  };
  const alternarEstado = (e) => setEstados((es) => (es.includes(e) ? es.filter((x) => x !== e) : [...es, e]));
  const soltarSobre = (destino) => {
    if (!arrastrando || arrastrando === destino) return;
    setColumnas((cs) => {
      const sin = cs.filter((c) => c !== arrastrando);
      sin.splice(sin.indexOf(destino), 0, arrastrando);
      return sin;
    });
    setUso('propio');
  };

  const filas = PERSONAS.filter((p) => estados.includes(p.estado));
  const cuenta = (e) => PERSONAS.filter((p) => p.estado === e).length;

  return (
    <div className="mx-auto max-w-5xl overflow-hidden rounded-[22px] border border-surface-border bg-surface shadow-raised">
      <header className="flex items-start justify-between gap-4 border-b border-surface-border px-5 py-5 sm:px-6">
        <div className="flex items-center gap-4">
          <IconoPropuesta propuesta="espiritualidad" tamano="lg" />
          <div>
            <p className="text-sm text-ink-muted">Exportar inscriptos de</p>
            <h2 className="font-grotesk text-2xl font-semibold tracking-tight text-ink">Kabbalat Shabbat</h2>
          </div>
        </div>
        <button type="button" aria-label="Cerrar" className="flex h-9 w-9 items-center justify-center rounded-pill text-ink-muted hover:bg-ink/5">
          <Icon name="close" size="sm" />
        </button>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Configuración */}
        <div className="min-w-0 space-y-7 px-5 py-6 sm:px-6">
          <section>
            <h3 className="mb-3 font-grotesk text-sm font-semibold text-ink">¿Para qué lo vas a usar?</h3>
            <div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2">
              {USOS.map((u) => {
                const activo = uso === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => elegirUso(u)}
                    aria-pressed={activo}
                    className={cn(
                      'flex flex-col items-start gap-2 rounded-[16px] border p-3.5 text-start transition-[border-color,background-color,box-shadow] duration-base',
                      activo ? 'border-ink bg-ink/[0.03] shadow-[0_0_0_1px_rgba(44,61,52,1)]' : 'border-surface-border hover:border-ink/25'
                    )}
                  >
                    <span className={cn('flex h-9 w-9 items-center justify-center rounded-[11px]', activo ? 'bg-ink text-surface' : 'bg-ink/[0.06] text-ink-soft')}>
                      <Icon name={u.icono} size="sm" />
                    </span>
                    <span className="font-grotesk text-sm font-semibold text-ink">{u.titulo}</span>
                    <span className="text-xs leading-snug text-ink-muted">{u.detalle}</span>
                  </button>
                );
              })}
            </div>
            {uso === 'propio' && <p className="mt-2 animate-fade-in text-xs text-ink-muted">Armada a mano: tocá un uso para volver a sus columnas.</p>}
          </section>

          <section>
            <h3 className="mb-3 font-grotesk text-sm font-semibold text-ink">¿De qué encuentro?</h3>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[...ENCUENTROS, { fecha: 'Todos', personas: 130 }].map((e) => {
                const activo = encuentro === e.fecha;
                return (
                  <button
                    key={e.fecha}
                    type="button"
                    onClick={() => setEncuentro(e.fecha)}
                    aria-pressed={activo}
                    className={cn(
                      'flex shrink-0 flex-col items-start rounded-[14px] border px-3.5 py-2.5 text-start transition-colors duration-base',
                      activo ? 'border-ink bg-ink text-surface' : 'border-surface-border bg-surface hover:border-ink/25'
                    )}
                  >
                    <span className="text-[0.7rem] font-semibold uppercase tracking-label opacity-70">{e.proximo ? 'Próximo' : e.fecha === 'Todos' ? 'Juntos' : 'Pasado'}</span>
                    <span className="font-grotesk text-sm font-semibold capitalize">{e.fecha}</span>
                    <span className={cn('text-xs tabular-nums', activo ? 'text-surface/70' : 'text-ink-muted')}>{e.personas} personas</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="mb-3 font-grotesk text-sm font-semibold text-ink">¿A quiénes?</h3>
            <div className="flex flex-wrap gap-2">
              {ESTADOS.map((e) => {
                const activo = estados.includes(e.id);
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => alternarEstado(e.id)}
                    aria-pressed={activo}
                    className={cn(
                      'inline-flex min-h-[36px] items-center gap-2 rounded-pill border px-3.5 text-sm font-medium transition-colors duration-base',
                      activo ? 'border-ink bg-ink text-surface' : 'border-surface-border text-ink-soft hover:border-ink/25'
                    )}
                  >
                    {activo && <Icon name="check" size="xs" />}
                    {e.etiqueta}
                    <span className={cn('tabular-nums', activo ? 'text-surface/70' : 'text-ink-faint')}>{cuenta(e.id)}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="mb-1 font-grotesk text-sm font-semibold text-ink">Columnas</h3>
            <p className="mb-3 text-xs text-ink-muted">Arrastrá para cambiar el orden. Tocá para sacar o sumar.</p>
            <ul className="flex flex-wrap gap-2">
              {columnas.map((c) => (
                <li
                  key={c}
                  draggable
                  onDragStart={() => setArrastrando(c)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => soltarSobre(c)}
                  onDragEnd={() => setArrastrando(null)}
                  className={cn('transition-opacity duration-fast', arrastrando === c && 'opacity-40')}
                >
                  <button
                    type="button"
                    onClick={() => alternarColumna(c)}
                    className="inline-flex min-h-[34px] cursor-grab items-center gap-1.5 rounded-pill bg-primary-600 ps-2.5 pe-3 text-sm font-medium text-surface active:cursor-grabbing"
                  >
                    <span aria-hidden className="text-surface/60">⋮⋮</span>
                    {COLUMNAS[c].etiqueta}
                    <Icon name="close" size="xs" className="text-surface/70" />
                  </button>
                </li>
              ))}
              {Object.keys(COLUMNAS)
                .filter((c) => !columnas.includes(c))
                .map((c) => (
                  <li key={c}>
                    <button
                      type="button"
                      onClick={() => alternarColumna(c)}
                      className="inline-flex min-h-[34px] items-center gap-1.5 rounded-pill border border-dashed border-ink/20 px-3 text-sm text-ink-muted transition-colors duration-base hover:border-ink/40 hover:text-ink"
                    >
                      <Icon name="add" size="xs" />
                      {COLUMNAS[c].etiqueta}
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        </div>

        {/* Vista previa en vivo */}
        <div className="min-w-0 border-t border-surface-border bg-surface-sunken px-5 py-6 sm:px-6 lg:border-s lg:border-t-0">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-grotesk text-sm font-semibold text-ink">Así va a quedar</h3>
            <span className="text-xs text-ink-muted">Primeras {Math.min(6, filas.length)} filas</span>
          </div>
          <div className="overflow-x-auto rounded-[14px] border border-surface-border bg-surface">
            <table className="w-full min-w-[26rem] text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-primary-50/60">
                  {columnas.map((c) => (
                    <th key={c} className="animate-fade-in whitespace-nowrap px-3 py-2 text-start text-xs font-semibold text-ink-soft">
                      {COLUMNAS[c].etiqueta}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.slice(0, 6).map((p) => (
                  <tr key={p.id} className="border-b border-surface-border/70 last:border-0">
                    {columnas.map((c) => (
                      <td key={c} className="animate-fade-in whitespace-nowrap px-3 py-2 text-ink-soft">
                        {COLUMNAS[c].de(p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {!filas.length && <p className="px-3 py-6 text-center text-sm text-ink-muted">Elegí a quiénes exportar.</p>}
          </div>
          <div className="mt-5 grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
            {[
              { id: 'excel', etiqueta: 'Excel', detalle: '.xlsx', icono: 'document' },
              { id: 'csv', etiqueta: 'CSV', detalle: 'Sheets', icono: 'download' },
              { id: 'copiar', etiqueta: 'Copiar', detalle: 'Para pegar', icono: 'copy' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormato(f.id)}
                aria-pressed={formato === f.id}
                className={cn(
                  'flex items-center gap-2 rounded-[14px] border px-3 py-2.5 text-start transition-colors duration-base',
                  formato === f.id ? 'border-ink bg-surface' : 'border-transparent bg-surface/60 hover:bg-surface'
                )}
              >
                <Icon name={f.icono} size="sm" className="text-ink-soft" />
                <span>
                  <span className="block text-sm font-semibold text-ink">{f.etiqueta}</span>
                  <span className="block text-xs text-ink-muted">{f.detalle}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <footer className="flex flex-col gap-3 border-t border-surface-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-ink-soft">
          <span className="font-semibold text-ink">{filas.length} personas</span> · {columnas.length} columnas ·{' '}
          <span className="capitalize">{encuentro}</span>
        </p>
        <div className="flex gap-2">
          <Boton variante="suave">Cancelar</Boton>
          <Boton
            icono={formato === 'copiar' ? (copiado ? 'check' : 'copy') : 'download'}
            onClick={() => {
              if (formato === 'copiar') {
                setCopiado(true);
                window.setTimeout(() => setCopiado(false), 1600);
              }
            }}
          >
            {formato === 'copiar' ? (copiado ? 'Copiado' : 'Copiar tabla') : `Descargar ${formato === 'excel' ? 'Excel' : 'CSV'}`}
          </Boton>
        </div>
      </footer>
    </div>
  );
};

export default MaquetaExportar;
