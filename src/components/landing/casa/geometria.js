/**
 * La geometría de la casa: un solo lugar para las cotas y para la profundidad.
 *
 * El dibujo dejó de ser un alzado plano y pasó a ser un corte axonométrico: se
 * ve el fondo de cada piso, el canto de las paredes y el plano del piso. Toda
 * esa tercera dimensión sale de UN vector —`FONDO`— que dice cuánto se corre
 * hacia adentro y hacia arriba lo que está más lejos. Cambiar esos dos números
 * reencuadra la casa entera.
 *
 * No hay proyección en perspectiva a propósito: en axonométrica las líneas
 * paralelas siguen paralelas, así que el dibujo se sostiene como dibujo. Una
 * perspectiva de un punto acá empezaría a pedir que todo sea realista, que es
 * justo lo que no queremos.
 */

/* Cuánto se va hacia adentro lo que está al fondo. La relación 44:26 es cerca
   de 30°, que es la inclinación clásica de una axonométrica y la que menos
   deforma los muebles. */
export const FONDO = { x: 44, y: -26 };

export const CASA = { x1: 58, x2: 314 };
export const QUINCHO = { x1: 322, x2: 416, techo: 322 };

/* Un solo grosor de trazo para todo el dibujo. Es lo que separa una
   ilustración de un collage: si cada objeto trae su propio filete, el ojo lee
   piezas sueltas en vez de una escena. */
export const TRAZO = 1.6;

/* Los pisos, de arriba hacia abajo. `techo` y `piso` son las dos alturas que
   definen el volumen de cada uno; el resto del dibujo se cuelga de ahí. */
/**
 * Los cuatro niveles reales de la casa, de arriba hacia abajo. La planta baja
 * es la que apoya en la vereda (`SUELO`), y el subsuelo va enterrado debajo.
 */
export const PISOS = {
  terraza: { techo: 40, piso: 130 },
  primero: { techo: 136, piso: 280 },
  planta: { techo: 286, piso: 430 },
  subsuelo: { techo: 436, piso: 574 },
};

/** El nivel de la calle: donde termina la planta baja y empieza la tierra. */
export const SUELO = 430;

/** Un punto llevado a la profundidad `t` (0 = borde del corte, 1 = fondo). */
export const hondo = (x, y, t = 0) => ({ x: x + FONDO.x * t, y: y + FONDO.y * t });

/**
 * Lo que está al fondo se ve más chico. No es perspectiva de verdad —en
 * axonométrica no la hay— pero un 10% de diferencia entre el frente y el fondo
 * alcanza para que el ojo ordene las capas, y sin eso las personas del fondo
 * parecen gigantes paradas atrás.
 */
export const escala = (t = 0) => 1 - 0.12 * t;

/** El plano horizontal de un piso, visto en fuga. */
export const planoPiso = (y, x1 = CASA.x1, x2 = CASA.x2) =>
  `M ${x1} ${y} L ${x2} ${y} L ${x2 + FONDO.x} ${y + FONDO.y} L ${x1 + FONDO.x} ${y + FONDO.y} Z`;

/** La pared del fondo de un piso. */
export const paredFondo = (techo, piso, x1 = CASA.x1, x2 = CASA.x2) =>
  `M ${x1 + FONDO.x} ${piso + FONDO.y} L ${x2 + FONDO.x} ${piso + FONDO.y}
   L ${x2 + FONDO.x} ${techo + FONDO.y} L ${x1 + FONDO.x} ${techo + FONDO.y} Z`;

/** El canto lateral derecho, que es el que queda a contraluz. */
export const costado = (techo, piso, x = CASA.x2) =>
  `M ${x} ${piso} L ${x} ${techo} L ${x + FONDO.x} ${techo + FONDO.y} L ${x + FONDO.x} ${piso + FONDO.y} Z`;
