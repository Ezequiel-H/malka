import { Link } from 'react-router-dom';
import { Badge, Button } from '../../ui';
import { linkPersona } from '../../../pages/admin/Historial';

/**
 * Debajo de cada encuentro de una actividad: quiénes vinieron sin anotarse,
 * y el botón para sumar a alguien. Así queda registrado (y cuenta en las
 * métricas) quién viene sin inscribirse, para después hablarle.
 */
const SinAnotarse = ({ filas = [], onSumar, onBorrar }) => (
  <div className="mt-2 flex flex-col gap-2 rounded-card border border-dashed border-surface-border bg-surface-sunken px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0 text-sm">
      {filas.length ? (
        <>
          <p className="mb-1.5 text-ink-muted">Vinieron sin anotarse ({filas.length})</p>
          <ul className="flex flex-wrap gap-1.5">
            {filas.map((f) => (
              <li key={f.id}>
                <Badge tone="warning" className="gap-1.5">
                  <Link to={linkPersona(f.persona)} className="hover:underline">
                    {f.persona.nombre}
                  </Link>
                  <button type="button" onClick={() => onBorrar(f)} aria-label={`Sacar a ${f.persona.nombre}`} className="opacity-70 hover:opacity-100">
                    ×
                  </button>
                </Badge>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-ink-muted">¿Vino alguien que no se anotó?</p>
      )}
    </div>
    <Button variant="secondary" size="sm" icon="add" onClick={onSumar} className="shrink-0 self-start sm:self-center">
      Sumar a alguien que vino
    </Button>
  </div>
);

export default SinAnotarse;
