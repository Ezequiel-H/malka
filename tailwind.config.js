/** @type {import('tailwindcss').Config} */

/**
 * Tokens de diseño de Malka.
 *
 * Regla del DS: los componentes consumen SOLO estos tokens, nunca colores
 * crudos de Tailwind (gray-600, blue-500) ni hex sueltos. Si algo no se puede
 * expresar con un token, falta un token — se agrega acá, no en el componente.
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Marca. `primary` conserva el verde histórico (#689b78) como DEFAULT
           para no romper los 40 usos de text-primary que ya existen. */
        primary: {
          50: '#f2f7f3',
          100: '#e0ece3',
          200: '#c3d9c9',
          300: '#9cbfa6',
          400: '#7fac8c',
          500: '#689b78',
          DEFAULT: '#689b78',
          600: '#537f61',
          700: '#42654d',
          800: '#37523f',
          900: '#2e4435',
        },

        /* Tinta: la tipografía de marca. Reemplaza el uso de gray-800/900. */
        ink: {
          DEFAULT: '#2c3d34',
          soft: '#4a5c52',
          muted: '#6b7a72',
          faint: '#94a29a',
        },

        /* Superficies. El crema de marca y sus derivados. */
        surface: {
          DEFAULT: '#ffffff',
          raised: '#fffcf7',
          sunken: '#fdfaf5',
          page: '#f9f2e8',
          border: '#ebe4d8',
        },

        /* El calor del dibujo: el fuego de la parrilla, las velas de la mesa y
           las luces de la terraza. Es el único color cálido de la paleta —el
           resto es verde y crema— y por eso ordena solo la lectura: donde hay
           ámbar, hay algo pasando. */
        flame: {
          core: '#ffdd9b',
          DEFAULT: '#e8942b',
          deep: '#c25e12',
        },

        /* Maderas y macetas del dibujo. No son colores de interfaz: no se usan
           para botones ni estados, sólo adentro de la ilustración. */
        barro: {
          claro: '#e2c3a4',
          DEFAULT: '#c98d63',
          oscuro: '#9c6440',
        },

        /* Los planos del dibujo de la casa. Son cuatro escalones de un mismo
           crema, ordenados por cuánta luz les llega: el piso recibe de frente,
           la pared del fondo está más lejos, el canto lateral queda a
           contraluz y la sombra es lo que no ve nada. Que sean escalones de un
           solo color —y no cuatro colores distintos— es lo que hace que se lea
           como un volumen iluminado y no como un collage. */
        casa: {
          piso: '#efe2cf',
          fondo: '#f4ede1',
          costado: '#e0d5c3',
          sombra: '#c9bda9',
        },

        /* Semánticos: significado, no color. Un botón de borrar es `danger`,
           no `red-600` — si mañana el rojo cambia, cambia acá y nada más. */
        success: { 50: '#eef7f0', 500: '#3f9159', 600: '#2f7546', 700: '#255c38' },
        warning: { 50: '#fdf6e9', 500: '#c98a1e', 600: '#a66f15', 700: '#835710' },
        danger: { 50: '#fdefee', 500: '#c4453c', 600: '#a3352d', 700: '#822a24' },
        info: { 50: '#eef4f7', 500: '#3d7d99', 600: '#2f647c', 700: '#254e61' },
      },

      /* Texturas de marca. Van acá y no en el componente porque llevan color:
         un radial-gradient escrito en el JSX sería un hex suelto disfrazado.
         `paper-*` es la textura tipo papel del login, generalizada. */
      backgroundImage: {
        'paper-cream':
          'radial-gradient(circle at 18% 12%, rgba(104, 155, 120, 0.10) 0%, transparent 45%), radial-gradient(circle at 84% 74%, rgba(104, 155, 120, 0.07) 0%, transparent 42%), radial-gradient(circle at 50% 100%, rgba(235, 228, 216, 0.85) 0%, transparent 55%)',
        'paper-green':
          'radial-gradient(circle at 12% 8%, rgba(255, 255, 255, 0.09) 0%, transparent 46%), radial-gradient(circle at 88% 82%, rgba(46, 68, 53, 0.32) 0%, transparent 48%)',
        /* Halo cálido de las tres llamas de la K del wordmark. */
        'flame-glow':
          'radial-gradient(closest-side, rgba(201, 138, 30, 0.55) 0%, rgba(201, 138, 30, 0.22) 45%, transparent 72%)',
      },

      fontFamily: {
        /* Grotesca de la landing. NO reemplaza a `display`: la app entera
           sigue en Cormorant y ese lenguaje está terminado. Acá afuera, en
           cambio, la serif delicada leía como invitación de casamiento y no
           como un lugar para gente de veinticinco. */
        grotesk: ['Archivo', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },

      letterSpacing: {
        /* A tamaño de titular la tipografía necesita cerrarse: lo que a 16px
           es respiración, a 96px es un agujero. */
        display: '-0.03em',
        headline: '-0.02em',
        /* Y al revés para las etiquetas chiquitas en mayúscula. */
        label: '0.14em',
      },

      borderRadius: {
        /* Escala acotada a propósito: hoy conviven rounded, -md, -lg, -xl y -2xl
           sin criterio. Estos cuatro cubren todo el sistema. */
        control: '0.625rem', // inputs, selects, botones
        card: '1rem',
        panel: '1.5rem', // modales, contenedores grandes
        pill: '9999px',
      },

      boxShadow: {
        /* Sombras cálidas: negro puro sobre fondo crema se ve sucio. */
        subtle: '0 1px 2px 0 rgba(44, 61, 52, 0.05)',
        card: '0 2px 8px -2px rgba(44, 61, 52, 0.08), 0 1px 3px -1px rgba(44, 61, 52, 0.06)',
        raised: '0 8px 20px -6px rgba(44, 61, 52, 0.12), 0 2px 6px -2px rgba(44, 61, 52, 0.07)',
        overlay: '0 24px 48px -12px rgba(44, 61, 52, 0.24)',
        focus: '0 0 0 3px rgba(104, 155, 120, 0.28)',
      },

      /* Motion. Que las duraciones sean tokens evita el "cada animación dura
         lo que le pareció a quien la escribió".
         Calibrado corto a propósito: una interfaz se siente rápida cuando el
         feedback llega antes de que el ojo lo espere. Arriba de ~200ms una
         transición de UI deja de leerse como fluida y empieza a leerse como
         demora. */
      transitionDuration: {
        instant: '60ms',
        fast: '110ms',
        base: '160ms',
        slow: '240ms',
        deliberate: '400ms',
        /* Sólo para la coreografía de la landing: entradas de bloques
           grandes, donde 400ms se lee como un parpadeo y no como un gesto. */
        cinematic: '900ms',
      },
      transitionTimingFunction: {
        entrance: 'cubic-bezier(0.16, 1, 0.3, 1)', // salida rápida, llegada suave
        exit: 'cubic-bezier(0.4, 0, 1, 1)',
        standard: 'cubic-bezier(0.2, 0, 0.2, 1)',
        spring: 'cubic-bezier(0.34, 1.35, 0.64, 1)', // overshoot leve
      },

      /* Grupos de propiedades para NO usar `transition-all`.
         `all` obliga al navegador a observar y animar todo, incluidas las
         propiedades de layout (height, width). Eso es lo que se siente
         trabado: cada pixel de un resize dispara una animación. Estos grupos
         se quedan en color y compositor, que el navegador anima sin recalcular
         layout. */
      transitionProperty: {
        control: 'color, background-color, border-color, box-shadow, opacity',
        chrome: 'color, background-color, border-color, box-shadow, opacity, transform',
        elevate: 'box-shadow, transform',
      },

      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        /* Desplazamientos cortos: un recorrido largo obliga a una duración
           larga para no verse brusco, y ahí es donde se siente lento. */
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.975)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(100%)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        /* Entradas de modal: más recorrido y más duración que los popovers.
           Un dropdown debe aparecer ya; un modal es un cambio de contexto y
           se banca (necesita) una transición perceptible. */
        'modal-in': {
          from: { opacity: '0', transform: 'scale(0.95) translateY(10px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'sheet-in': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        /* Las tres llamas de la K: respiración lenta, no un parpadeo nervioso.
           Un ciclo largo se lee como "hay alguien adentro"; uno corto, como un
           GIF de 2004. */
        flame: {
          '0%, 100%': { opacity: '0.35', transform: 'scale(0.94)' },
          '50%': { opacity: '0.75', transform: 'scale(1.06)' },
        },
        /* Entrada del titular del hero: cada línea sube desde detrás de su
           propio recorte. El bloque tiene `overflow-hidden`, así que la línea
           no aparece — se asoma. Es el gesto que hace que un titular grande
           se sienta impreso y no pegado. */
        'line-rise': {
          from: { transform: 'translateY(105%)' },
          to: { transform: 'translateY(0)' },
        },
        /* Cinta de categorías. Recorre exactamente la mitad del contenido
           porque la lista va duplicada: al llegar al 50% el segundo juego
           está donde arrancó el primero y el salto es invisible. */
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        /* Regla que se dibuja sola de izquierda a derecha. */
        'rule-draw': {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
        /* El humo de la parrilla y el vapor del café: sube, se abre y se va.
           Tres bocanadas desfasadas se leen como humo; una sola, como una
           burbuja. */
        humo: {
          '0%': { opacity: '0', transform: 'translateY(0) scaleX(1)' },
          '25%': { opacity: '0.55' },
          '100%': { opacity: '0', transform: 'translateY(-26px) scaleX(1.6)' },
        },
        /* Las plantas de la huerta y las macetas. Rotación mínima y ciclo
           largo: una planta que se mueve mucho parece un dibujo animado. */
        mecer: {
          '0%, 100%': { transform: 'rotate(-2.5deg)' },
          '50%': { transform: 'rotate(2.5deg)' },
        },
        /* La guirnalda de la terraza. */
        titilar: {
          '0%, 100%': { opacity: '0.45' },
          '50%': { opacity: '1' },
        },
        /* Las velas de la mesa de Shabat. Acá sí son velas. */
        llama: {
          '0%, 100%': { transform: 'scaleY(1) scaleX(1)', opacity: '0.9' },
          '50%': { transform: 'scaleY(1.18) scaleX(0.92)', opacity: '1' },
        },
        /* Respiración. Un píxel y pico de recorrido en cuatro segundos: no se
           ve moverse a nadie, se ve que nadie está congelado. Es la diferencia
           entre un dibujo con gente y un dibujo con maniquíes. */
        respirar: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-1.4px)' },
        },
        /* El resplandor de la lámpara y de las brasas, que no titila como una
           llama: sube y baja despacio, como sube y baja una luz cálida. */
        latir: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '0.9' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 140ms cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in-up': 'fade-in-up 180ms cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 120ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in': 'slide-in 240ms cubic-bezier(0.16, 1, 0.3, 1)',
        'modal-in': 'modal-in 280ms cubic-bezier(0.16, 1, 0.3, 1)',
        'sheet-in': 'sheet-in 320ms cubic-bezier(0.16, 1, 0.3, 1)',
        'overlay-in': 'fade-in 220ms ease-out',
        flame: 'flame 4.2s ease-in-out infinite',
        'line-rise': 'line-rise 900ms cubic-bezier(0.16, 1, 0.3, 1) both',
        marquee: 'marquee 38s linear infinite',
        'rule-draw': 'rule-draw 900ms cubic-bezier(0.16, 1, 0.3, 1) both',
        humo: 'humo 3.6s ease-out infinite',
        mecer: 'mecer 4.6s ease-in-out infinite',
        titilar: 'titilar 2.6s ease-in-out infinite',
        llama: 'llama 1.8s ease-in-out infinite',
        respirar: 'respirar 4.2s ease-in-out infinite',
        latir: 'latir 5s ease-in-out infinite',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
