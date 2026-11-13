import { Button, Icon, Switch, cn } from '../../ui';
import { BLOQUES } from './bloques';

/* Un botón chico de la barra de cada bloque. */
const Chico = ({ icono, etiqueta, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={etiqueta}
    title={etiqueta}
    className="flex h-8 w-8 items-center justify-center rounded-pill text-ink-soft transition-colors duration-base hover:bg-ink/[0.06] hover:text-ink disabled:pointer-events-none disabled:opacity-30"
  >
    <Icon name={icono} size="sm" />
  </button>
);

/* Una opción de varias o de una sola: pastillas que se prenden. */
const Pastillas = ({ valores, elegidos, onToggle, minimoUno }) => (
  <div className="flex flex-wrap gap-1.5">
    {Object.entries(valores).map(([v, texto]) => {
      const activo = elegidos.includes(v);
      const ultimo = minimoUno && activo && elegidos.length === 1;
      return (
        <button
          key={v}
          type="button"
          aria-pressed={activo}
          disabled={ultimo}
          title={ultimo ? 'Tiene que quedar al menos uno' : undefined}
          onClick={() => onToggle(v)}
          className={cn(
            'inline-flex min-h-[32px] items-center gap-1.5 rounded-pill border px-3 text-sm transition-colors duration-base disabled:cursor-not-allowed',
            activo ? 'border-transparent bg-ink text-surface' : 'border-surface-border bg-surface text-ink-soft hover:border-ink/25',
          )}
        >
          {activo && minimoUno !== undefined && <Icon name="check" size="xs" />}
          {texto}
        </button>
      );
    })}
  </div>
);

/**
 * La franja de opciones de un bloque. `catalogo` dice el tipo y los valores
 * posibles (viene del back); `BLOQUES` dice cómo se llaman.
 */
export const OpcionesBloque = ({ catalogo, bloque, onChange }) => {
  const textos = BLOQUES[bloque.id].opciones;
  const cambiar = (k, v) => onChange({ ...bloque.opciones, [k]: v });
  return (
    <div className="space-y-3 rounded-[16px] bg-ink/[0.03] p-4">
      {Object.entries(catalogo.opciones).map(([k, o]) => {
        const t = textos[k];
        const valor = bloque.opciones[k];
        if (o.tipo === 'si_no') return <Switch key={k} label={t.etiqueta} checked={valor} onChange={(e) => cambiar(k, e.target.checked)} />;
        // Los valores pueden ser números: se comparan como texto y se guardan con su tipo.
        const deTexto = (s) => o.valores.find((x) => String(x) === s);
        const valores = Object.fromEntries(o.valores.map((x) => [String(x), t.valores[x] ?? String(x)]));
        return (
          <div key={k}>
            <p className="mb-1.5 text-xs font-semibold text-ink-muted">{t.etiqueta}</p>
            {o.tipo === 'lista' ? (
              <Pastillas
                valores={valores}
                elegidos={valor.map(String)}
                minimoUno
                // Al sumar, va en el orden del catálogo.
                onToggle={(s) => cambiar(k, valor.map(String).includes(s) ? valor.filter((x) => String(x) !== s) : o.valores.filter((x) => valor.includes(x) || String(x) === s))}
              />
            ) : (
              <Pastillas valores={valores} elegidos={[String(valor)]} onToggle={(s) => cambiar(k, deTexto(s))} />
            )}
          </div>
        );
      })}
    </div>
  );
};

/** La barra de un bloque mientras se arma el panel. */
export const BarraBloque = ({ bloque, primero, ultimo, onAncho, onSubir, onBajar, onOcultar }) => (
  <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
    <span className="flex min-w-[9rem] flex-1 cursor-grab items-center gap-2 font-grotesk font-semibold text-ink active:cursor-grabbing">
      <Icon name="menu" size="sm" className="text-ink-faint" />
      {BLOQUES[bloque.id].nombre}
    </span>
    {/* El ancho a la vista: sólo en la compu, en el celular va todo en una columna. */}
    <span className="hidden rounded-pill bg-ink/[0.05] p-0.5 lg:flex" role="group" aria-label="Ancho">
      {[
        ['media', 'Media fila'],
        ['entera', 'Fila entera'],
      ].map(([v, t]) => (
        <button
          key={v}
          type="button"
          aria-pressed={bloque.ancho === v}
          onClick={() => onAncho(v)}
          className={cn('rounded-pill px-3 py-1 text-xs font-semibold transition-colors duration-base', bloque.ancho === v ? 'bg-surface text-ink shadow-card' : 'text-ink-muted hover:text-ink')}
        >
          {t}
        </button>
      ))}
    </span>
    <span className="flex items-center">
      <Chico icono="chevronUp" etiqueta="Subir" onClick={onSubir} disabled={primero} />
      <Chico icono="chevronDown" etiqueta="Bajar" onClick={onBajar} disabled={ultimo} />
      <Chico icono="hide" etiqueta="Ocultar" onClick={onOcultar} />
    </span>
  </div>
);

/** La barra de arriba (y la del pie) del modo edición. */
export const BarraEdicion = ({ arriba, onDeSiempre, onCancelar, onGuardar, guardando }) => (
  <div className={cn('flex flex-col gap-3 rounded-[18px] border border-dashed border-primary-600/50 bg-primary-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between', !arriba && 'mt-2')}>
    {arriba ? (
      <span className="text-sm text-ink-soft">
        <span className="block font-semibold text-ink">Estás armando tu panel</span>
        Arrastrá los bloques (o usá las flechas), cambiá su ancho y sus opciones, ocultá lo que no uses y sumá otros desde abajo.
      </span>
    ) : (
      <span className="text-sm text-ink-muted">Lo que guardes lo ves vos, en cualquier dispositivo.</span>
    )}
    <span className="flex shrink-0 flex-wrap gap-2">
      {arriba && (
        <Button size="sm" variant="ghost" onClick={onDeSiempre}>
          Volver al de siempre
        </Button>
      )}
      <Button size="sm" variant="secondary" onClick={onCancelar}>
        Cancelar
      </Button>
      <Button size="sm" icon="check" onClick={onGuardar} loading={guardando}>
        Guardar
      </Button>
    </span>
  </div>
);

/** La bandeja con los bloques ocultos: tocar uno lo suma al final. */
export const Bandeja = ({ ocultos, onSumar }) => (
  <section aria-labelledby="para-sumar" className="rounded-[22px] border border-dashed border-surface-border p-5">
    <h2 id="para-sumar" className="font-grotesk text-lg font-semibold text-ink">
      Para sumar
    </h2>
    <p className="mb-4 text-sm text-ink-muted">Tocá uno y aparece al final del panel.</p>
    {ocultos.length ? (
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {ocultos.map((b) => (
          <li key={b.id}>
            <button
              type="button"
              onClick={() => onSumar(b.id)}
              className="flex h-full w-full items-start gap-3 rounded-[16px] border border-surface-border bg-surface p-3 text-start transition-colors duration-base hover:border-ink/25"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-ink/[0.06] text-ink">
                <Icon name="add" size="sm" />
              </span>
              <span>
                <span className="block font-semibold text-ink">{BLOQUES[b.id].nombre}</span>
                <span className="block text-sm text-ink-muted">{BLOQUES[b.id].que}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-ink-muted">Ya están todos en el panel.</p>
    )}
  </section>
);
