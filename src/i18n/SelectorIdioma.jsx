import { Link } from 'react-router-dom';
import { cn } from '../components/ui';
import { IDIOMAS } from './idiomas';
import { useIdioma } from './IdiomaContext';

/**
 * ES · EN · עב. En la landing cada idioma es una dirección (`comoLinks`), así
 * se puede compartir el link en el idioma justo; en la plataforma es un botón
 * que cambia el idioma en el lugar.
 */
const SelectorIdioma = ({ actual, comoLinks = false, etiqueta, className }) => {
  const { idioma, setIdioma, t } = useIdioma();
  const elegido = actual ?? idioma;
  const clases = (activo) =>
    cn(
      'inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-pill px-2 text-[0.7rem] font-semibold tracking-label transition-colors duration-base',
      activo ? 'bg-ink/10 text-ink' : 'text-ink-faint hover:bg-ink/5 hover:text-ink'
    );

  return (
    <nav aria-label={etiqueta ?? t('comun.idioma')} className={cn('flex items-center gap-1', className)}>
      {IDIOMAS.map((i) =>
        comoLinks ? (
          <Link
            key={i.id}
            to={i.ruta}
            lang={i.id}
            aria-current={i.id === elegido ? 'true' : undefined}
            title={i.nombre}
            className={clases(i.id === elegido)}
          >
            {i.corto}
          </Link>
        ) : (
          <button
            key={i.id}
            type="button"
            lang={i.id}
            aria-pressed={i.id === elegido}
            title={i.nombre}
            onClick={() => setIdioma(i.id)}
            className={clases(i.id === elegido)}
          >
            {i.corto}
          </button>
        )
      )}
    </nav>
  );
};

export default SelectorIdioma;
