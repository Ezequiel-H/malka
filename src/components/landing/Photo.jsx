import { cn } from '../../components/ui';
import PHOTOS from './photos';
import { useScrollFx } from './scrollFx';

/**
 * Una foto de la landing: tratamiento de color de la casa y parallax.
 *
 * TRATAMIENTO. Las siete fotos son de celular y de años distintos: la de
 * Shabat vira a magenta, la de la terraza a azul, la del cowork a gris y la
 * de La Ieshive a naranja. Puestas una debajo de la otra son un carrete, no
 * un sitio. La receta las empareja sin retocarlas una por una: bajar la
 * saturación desbocada, verde de marca en `multiply` para llevar todas las
 * sombras al mismo tono, y crema en `soft-light` para hacer lo propio con
 * las luces.
 *
 * PARALLAX. La imagen es más alta que su marco y se desplaza dentro de él
 * mientras la página baja. Es lo que hace que una foto quieta se sienta
 * filmada, y cuesta un `transform` — que el navegador resuelve en el
 * compositor, sin recalcular layout.
 */

const WASHES = {
  soft: {
    filter: 'saturate-[.62] contrast-[1.16]',
    tint: 'bg-primary/20',
    light: 'bg-surface-page/22',
  },
  /* La terraza es la única foto nocturna: iluminada con led azul, la receta
     `soft` no la alcanza y queda como una mancha fría en medio de la página. */
  night: {
    filter: 'saturate-[.38] contrast-[1.12] brightness-[1.04]',
    tint: 'bg-primary/30',
    light: 'bg-surface-page/18',
  },
  /* Para las bandas a sangre donde encima va texto claro: acá el verde deja
     de ser un matiz y pasa a ser el fondo. */
  strong: {
    filter: 'saturate-[.6] contrast-[1.05] brightness-[.82]',
    tint: 'bg-primary-900/90',
    light: 'bg-ink/30',
  },
};

/* El sobrante de la imagen es 18% y el recorrido llega a 16%: así el borde
   inferior nunca asoma, ni siquiera al final del scroll. */
const SOBRANTE = 'h-[118%]';
const RECORRIDO = 16;

const Photo = ({
  name,
  className,
  imgClassName,
  wash = 'soft',
  parallax = true,
  priority = false,
  sizes = '100vw',
  ...props
}) => {
  const foto = PHOTOS[name];
  const receta = WASHES[wash];

  const ref = useScrollFx((el, p) => {
    el.style.transform = `translate3d(0, ${(-p * RECORRIDO).toFixed(2)}%, 0)`;
  });

  return (
    <div className={cn('relative overflow-hidden bg-surface-sunken', className)} {...props}>
      <img
        ref={parallax ? ref : undefined}
        src={foto.src}
        srcSet={foto.srcSet}
        sizes={sizes}
        alt={foto.alt}
        /* El hero es el LCP: se pide con prioridad y sin lazy. Todo lo demás
           está debajo del pliegue y puede esperar a que el usuario llegue. */
        loading={priority ? 'eager' : 'lazy'}
        fetchpriority={priority ? 'high' : undefined}
        decoding="async"
        className={cn(
          'w-full object-cover',
          parallax ? `${SOBRANTE} will-change-transform` : 'h-full',
          receta.filter,
          imgClassName
        )}
      />
      <div
        className={cn('pointer-events-none absolute inset-0 mix-blend-multiply', receta.tint)}
        aria-hidden
      />
      <div
        className={cn('pointer-events-none absolute inset-0 mix-blend-soft-light', receta.light)}
        aria-hidden
      />
    </div>
  );
};

export default Photo;
