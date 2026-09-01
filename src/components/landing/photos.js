/**
 * Las siete fotos de la landing, con sus dos tamaños y su texto alternativo.
 *
 * Son fotos reales de encuentros reales. En un espacio comunitario eso es
 * precisamente lo que convence, así que no hay ninguna imagen generada acá.
 *
 * Cada foto se sirve en 800 y 1600 px (derivados en `opt/`, generados desde
 * los originales). La mayoría llega desde el link de Instagram, en un celular
 * con datos: sin `srcset` un teléfono de 390 px de ancho se bajaría la versión
 * de escritorio de cada una. El original queda en la carpeta como fuente, no
 * se sirve.
 */

import coworkSillon800 from '../../assets/landing/opt/cowork-sillon-800.jpg';
import coworkSillon1600 from '../../assets/landing/opt/cowork-sillon-1600.jpg';
import laIeshive800 from '../../assets/landing/opt/la-ieshive-800.jpg';
import laIeshive1600 from '../../assets/landing/opt/la-ieshive-1600.jpg';
import mesaShabat800 from '../../assets/landing/opt/mesa-shabat-800.jpg';
import mesaShabat1600 from '../../assets/landing/opt/mesa-shabat-1600.jpg';
import noche800 from '../../assets/landing/opt/noche-800.jpg';
import noche1600 from '../../assets/landing/opt/noche-1600.jpg';
import parrilla800 from '../../assets/landing/opt/parrilla-800.jpg';
import parrilla1600 from '../../assets/landing/opt/parrilla-1600.jpg';
import salonColchonetas800 from '../../assets/landing/opt/salon-colchonetas-800.jpg';
import salonColchonetas1600 from '../../assets/landing/opt/salon-colchonetas-1600.jpg';
import tallerTotebags800 from '../../assets/landing/opt/taller-totebags-800.jpg';
import tallerTotebags1600 from '../../assets/landing/opt/taller-totebags-1600.jpg';

const photo = (small, large, alt) => ({
  src: large,
  srcSet: `${small} 800w, ${large} 1600w`,
  alt,
});

const PHOTOS = {
  mesaShabat: photo(
    mesaShabat800,
    mesaShabat1600,
    'La mesa larga de Shabat en el salón de Malka, llena de gente conversando'
  ),
  salonColchonetas: photo(
    salonColchonetas800,
    salonColchonetas1600,
    'Una clase de relajación en el salón de Malka, junto a la escalera de madera'
  ),
  parrilla: photo(
    parrilla800,
    parrilla1600,
    'Alguien del staff prendiendo la parrilla del quincho de Malka'
  ),
  coworkSillon: photo(
    coworkSillon800,
    coworkSillon1600,
    'Un grupo de chicos en el sillón del cowork del primer piso'
  ),
  tallerTotebags: photo(
    tallerTotebags800,
    tallerTotebags1600,
    'Un taller de estampado: doce participantes muestran las totebags que pintaron'
  ),
  laIeshive: photo(
    laIeshive800,
    laIeshive1600,
    'El grupo de La Ieshive al final de una clase, alrededor de la mesa de estudio'
  ),
  noche: photo(
    noche800,
    noche1600,
    'Un unplugged de noche en la terraza de Malka, con la ciudad de fondo'
  ),
};

export default PHOTOS;
