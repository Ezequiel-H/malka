import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { IDIOMA_POR_DEFECTO, datosIdioma, esIdioma, setLocaleActual } from './idiomas';
import es from './es';
import en from './en';
import he from './he';

const DICCIONARIOS = { es, en, he };
const CLAVE_GUARDADA = 'malka.idioma';
const FUNDIDO_MS = 200;

/* Lo que se carga en el navegador sólo vale para quien no tiene sesión; con
   sesión manda lo guardado en la cuenta. Siempre con try/catch: en una
   ventana privada el storage puede no existir. */
const leerGuardado = () => {
  try {
    const valor = window.localStorage.getItem(CLAVE_GUARDADA);
    return esIdioma(valor) ? valor : null;
  } catch {
    return null;
  }
};
const guardar = (valor) => {
  try {
    window.localStorage.setItem(CLAVE_GUARDADA, valor);
  } catch {
    /* sin storage, el idioma dura lo que dura la pestaña */
  }
};

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

const contextoDe = (idioma, extra = {}) => {
  const datos = datosIdioma(idioma);
  return {
    idioma,
    locale: datos.locale,
    rtl: Boolean(datos.rtl),
    t: (clave, variables) => traducir(idioma, clave, variables),
    setIdioma: () => {},
    fundido: false,
    ...extra,
  };
};

/* Sin proveedor (tests de componentes sueltos) todo sale en castellano. */
const IdiomaContext = createContext(contextoDe(IDIOMA_POR_DEFECTO));

export const useIdioma = () => useContext(IdiomaContext);

/**
 * El idioma de la plataforma.
 *
 * - Sin sesión: el último elegido en este navegador (en el login, el registro
 *   o la landing en /en o /he).
 * - Con sesión de participante: el de su cuenta; cambiarlo lo guarda ahí.
 * - El equipo (admin) ve siempre castellano: el panel no está traducido y
 *   mezclar idiomas ahí confunde más de lo que ayuda.
 *
 * En hebreo la página entera se espeja (`dir="rtl"` en <html>). Cambiar de
 * idioma no recarga: el contenido se apaga, cambia y vuelve a aparecer.
 */
export const IdiomaProvider = ({ children }) => {
  const { user, updateUser } = useAuth();
  const [elegido, setElegido] = useState(() => leerGuardado() ?? IDIOMA_POR_DEFECTO);
  const [fundido, setFundido] = useState(false);
  const espera = useRef(null);

  /* Al entrar con una cuenta que ya tiene idioma, manda el de la cuenta. */
  const idiomaCuenta = user?.role === 'participant' && esIdioma(user?.idioma) ? user.idioma : null;
  useEffect(() => {
    if (idiomaCuenta) {
      setElegido(idiomaCuenta);
      guardar(idiomaCuenta);
    }
  }, [idiomaCuenta]);

  const esEquipo = user?.role === 'admin';
  const idioma = esEquipo ? IDIOMA_POR_DEFECTO : elegido;

  const setIdioma = useCallback(
    (nuevo, { fundir = true } = {}) => {
      if (!esIdioma(nuevo)) return;
      guardar(nuevo);
      if (user?.role === 'participant' && user.idioma !== nuevo) {
        updateUser?.({ idioma: nuevo });
        axios.patch('/users/me', { idioma: nuevo }).catch(() => {
          /* si no se pudo guardar en la cuenta, queda en el navegador */
        });
      }
      window.clearTimeout(espera.current);
      const reducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (!fundir || reducido) {
        setElegido(nuevo);
        return;
      }
      setFundido(true);
      espera.current = window.setTimeout(() => {
        setElegido(nuevo);
        setFundido(false);
      }, FUNDIDO_MS);
    },
    [user, updateUser]
  );

  useEffect(() => () => window.clearTimeout(espera.current), []);

  const valor = useMemo(() => contextoDe(idioma, { setIdioma, fundido }), [idioma, setIdioma, fundido]);

  /* El idioma y la dirección de toda la página. La landing maneja los suyos
     mientras está montada (va por la dirección, no por lo elegido). */
  setLocaleActual(valor.locale);
  useEffect(() => {
    const html = document.documentElement;
    html.lang = idioma;
    html.dir = valor.rtl ? 'rtl' : 'ltr';
  }, [idioma, valor.rtl]);

  return <IdiomaContext.Provider value={valor}>{children}</IdiomaContext.Provider>;
};
