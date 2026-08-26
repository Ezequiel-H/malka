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

        /* Semánticos: significado, no color. Un botón de borrar es `danger`,
           no `red-600` — si mañana el rojo cambia, cambia acá y nada más. */
        success: { 50: '#eef7f0', 500: '#3f9159', 600: '#2f7546', 700: '#255c38' },
        warning: { 50: '#fdf6e9', 500: '#c98a1e', 600: '#a66f15', 700: '#835710' },
        danger: { 50: '#fdefee', 500: '#c4453c', 600: '#a3352d', 700: '#822a24' },
        info: { 50: '#eef4f7', 500: '#3d7d99', 600: '#2f647c', 700: '#254e61' },
      },

      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
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
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
