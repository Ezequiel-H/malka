import { clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Une clases resolviendo conflictos de Tailwind: la última gana.
 *
 * Sin esto, `cn('px-4', 'px-8')` deja las dos y el resultado depende del orden
 * en el CSS compilado. Con esto, gana `px-8` — que es lo que espera quien
 * escribe `<Button className="px-8">`.
 *
 * Se extiende con los tokens propios para que tailwind-merge sepa que
 * `rounded-card` y `rounded-pill` son del mismo grupo y deben pisarse.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-family': [{ font: ['display', 'sans', 'mono'] }],
    },
    theme: {
      radius: ['control', 'card', 'panel', 'pill'],
      shadow: ['subtle', 'card', 'raised', 'overlay', 'focus'],
    },
  },
});

export const cn = (...inputs) => twMerge(clsx(inputs));

export default cn;
