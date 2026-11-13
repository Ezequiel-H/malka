import { useEffect, useRef, useState } from 'react';

const ESPERA_MS = 1200;

/**
 * Guarda en este navegador lo que se está escribiendo (1,2 s después de la
 * última tecla y al irse) y lo devuelve al volver. No hay borradores en el
 * servidor en este sistema todavía: esto evita perder lo cargado si se cierra
 * la pestaña. Se borra al guardar o con «Empezar de cero».
 */
export default function useBorradorLocal(clave, valor, { activo }) {
  const [guardadoEn, setGuardadoEn] = useState(null);
  const ultimo = useRef(valor);
  ultimo.current = valor;

  const leer = () => {
    try {
      const crudo = localStorage.getItem(clave);
      return crudo ? JSON.parse(crudo) : null;
    } catch {
      return null;
    }
  };
  const escribir = (v) => {
    try {
      localStorage.setItem(clave, JSON.stringify({ valor: v, en: Date.now() }));
      setGuardadoEn(Date.now());
    } catch {
      /* sin almacenamiento: no se guarda, el formulario sigue andando */
    }
  };
  const borrar = () => {
    try {
      localStorage.removeItem(clave);
    } catch {
      /* nada que borrar */
    }
    setGuardadoEn(null);
  };

  useEffect(() => {
    if (!activo) return undefined;
    const t = window.setTimeout(() => escribir(valor), ESPERA_MS);
    return () => window.clearTimeout(t);
  }, [valor, activo, clave]);

  useEffect(() => {
    if (!activo) return undefined;
    const alIrse = () => escribir(ultimo.current);
    window.addEventListener('pagehide', alIrse);
    return () => window.removeEventListener('pagehide', alIrse);
  }, [activo, clave]);

  return { leer, borrar, guardadoEn };
}
