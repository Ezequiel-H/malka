import { useEffect, useRef, useState } from 'react';
import { cn } from '../../components/ui';
import { quiereQuietud } from './scrollFx';

/**
 * Aparición al entrar en pantalla.
 *
 * El recorrido es largo a propósito —28px y casi un segundo— porque la
 * versión anterior se movía tres píxeles y el resultado era el peor de los
 * dos mundos: costaba lo mismo y no se veía. Un reveal o se nota o no está.
 *
 * El estado inicial es "visible": si no hay IntersectionObserver, si el
 * usuario pidió menos movimiento o si el JS no corre, la página se ve igual.
 * Una landing que arranca en `opacity-0` y depende de un observer para
 * mostrarse es una landing en blanco el día que algo falla.
 */
const Reveal = ({ as: Tag = 'div', delay = 0, className, children, ...props }) => {
  const ref = useRef(null);
  const [animar, setAnimar] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (quiereQuietud() || !('IntersectionObserver' in window)) return;

    setAnimar(true);
    setVisible(false);

    const nodo = ref.current;
    if (!nodo) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      /* Dispara con el bloque ya bien entrado: si arranca apenas asoma el
         borde, la animación termina antes de que el ojo llegue. */
      { rootMargin: '0px 0px -18% 0px', threshold: 0.01 }
    );

    observer.observe(nodo);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={cn(
        animar && 'transition-chrome duration-cinematic ease-entrance',
        animar && !visible && 'translate-y-7 opacity-0',
        className
      )}
      style={animar && delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...props}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
