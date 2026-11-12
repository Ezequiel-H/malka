import es from './es';
import en from './en';
import he from './he';

const DICCIONARIOS = { es, en, he };

const buscar = (diccionario, clave) =>
  clave.split('.').reduce((nodo, parte) => (nodo && typeof nodo === 'object' ? nodo[parte] : undefined), diccionario);

/**
 * Traduce una clave ("registro.titulo") al idioma pedido. Si falta en ese
 * idioma usa el castellano, y si falta en los dos devuelve la clave (así se
 * nota enseguida). Las variables van entre llaves: t('x', { nombre: 'Ana' }).
 */
export const traducir = (idioma, clave, variables) => {
  const valor = buscar(DICCIONARIOS[idioma], clave) ?? buscar(DICCIONARIOS.es, clave) ?? clave;
  if (typeof valor !== 'string' || !variables) return valor;
  return valor.replace(/\{(\w+)\}/g, (crudo, nombre) =>
    variables[nombre] !== undefined && variables[nombre] !== null ? String(variables[nombre]) : crudo
  );
};
