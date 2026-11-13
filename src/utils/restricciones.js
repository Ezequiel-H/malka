/**
 * Las restricciones alimentarias del registro y del perfil. El valor se
 * guarda en castellano (lo lee el equipo); lo que se ve sale de
 * `registro.restricciones.<clave>` en el idioma de quien completa.
 */
export const RESTRICCIONES = [
  { valor: 'Vegetariano', clave: 'vegetariano' },
  { valor: 'Vegano', clave: 'vegano' },
  { valor: 'Sin TACC', clave: 'sinTacc' },
  { valor: 'Sin lactosa', clave: 'sinLactosa' },
  { valor: 'Sin nueces', clave: 'sinNueces' },
  { valor: 'Diabético', clave: 'diabetico' },
];
