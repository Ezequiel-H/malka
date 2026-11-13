import Icon from './Icon';
import cn from './cn';

/**
 * Un ícono sobre el tinte de su color (el de la propuesta o el tag): se
 * reconoce de qué se trata sin leer.
 */
const IconoColor = ({ icono = 'activity', color = '#6b7a72', tamano = 'md', className }) => (
  <span
    aria-hidden
    className={cn(
      'flex shrink-0 items-center justify-center',
      tamano === 'lg' ? 'h-14 w-14 rounded-[16px]' : tamano === 'sm' ? 'h-8 w-8 rounded-[10px]' : 'h-11 w-11 rounded-[14px]',
      className
    )}
    style={{ background: `${color}1a`, color }}
  >
    <Icon name={icono} size={tamano === 'sm' ? 'sm' : 'md'} />
  </span>
);

export default IconoColor;
