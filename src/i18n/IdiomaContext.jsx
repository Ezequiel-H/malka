import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { IDIOMA_POR_DEFECTO, datosIdioma, esIdioma, setIdiomaActual } from './idiomas';
import { traducir } from './traducir';

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

export { traducir };

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
  /* La sesión va por referencia: si setIdioma dependiera de ella cambiaría
     en cada render, y con él `t`, y todo efecto que use `t` se repetiría. */
  const sesion = useRef({ user, updateUser });
  sesion.current = { user, updateUser };

  /* Al entrar con una cuenta que ya tiene idioma, manda el de la cuenta. */
  const idiomaCuenta = user?.role === 'participant' && esIdioma(user?.idioma) ? user.idioma : null;
  useEffect(() => {
    if (idiomaCuenta) {
      setElegido(idiomaCuenta);
      guardar(idiomaCuenta);
    }
  }, [idiomaCuenta]);

  /* Una cuenta sin idioma (de antes de que existiera) se queda con el que
     eligió en el login o el registro. */
  const sinIdioma = user?.role === 'participant' && !esIdioma(user?.idioma);
  useEffect(() => {
    if (!sinIdioma) return;
    sesion.current.updateUser?.({ idioma: elegido });
    axios.patch('/users/me', { idioma: elegido }).catch(() => {
      /* sin guardar en la cuenta, queda en el navegador */
    });
  }, [sinIdioma, elegido]);

  const esEquipo = user?.role === 'admin';
  const idioma = esEquipo ? IDIOMA_POR_DEFECTO : elegido;

  const setIdioma = useCallback(
    (nuevo, { fundir = true } = {}) => {
      if (!esIdioma(nuevo)) return;
      guardar(nuevo);
      const { user: cuenta, updateUser: actualizar } = sesion.current;
      if (cuenta?.role === 'participant' && cuenta.idioma !== nuevo) {
        actualizar?.({ idioma: nuevo });
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
    []
  );

  useEffect(() => () => window.clearTimeout(espera.current), []);

  const valor = useMemo(() => contextoDe(idioma, { setIdioma, fundido }), [idioma, setIdioma, fundido]);

  /* El idioma y la dirección de toda la página. La landing maneja los suyos
     mientras está montada (va por la dirección, no por lo elegido). */
  setIdiomaActual(idioma);
  useEffect(() => {
    const html = document.documentElement;
    html.lang = idioma;
    html.dir = valor.rtl ? 'rtl' : 'ltr';
  }, [idioma, valor.rtl]);

  return <IdiomaContext.Provider value={valor}>{children}</IdiomaContext.Provider>;
};
