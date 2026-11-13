import { useEffect, useRef } from 'react';
import { Icon, cn } from '../ui';

/**
 * Los datos que se pueden sumar a un mensaje. Se guardan como {clave} (así
 * los reemplaza el sistema al abrir WhatsApp) pero en pantalla se ven como
 * pastillas con su nombre: nadie tiene que acordarse de las llaves.
 */
export const DATOS_MENSAJE = {
  nombre: { etiqueta: 'Nombre', icono: 'user', ejemplo: 'Tamar' },
  actividad: { etiqueta: 'Actividad', icono: 'activity', ejemplo: 'Viaje a Bariloche' },
  fecha: { etiqueta: 'Fecha', icono: 'addToCalendar', ejemplo: 'vie 6 dic' },
  hora: { etiqueta: 'Hora', icono: 'time', ejemplo: '08:00' },
  lugar: { etiqueta: 'Lugar', icono: 'location', ejemplo: 'Retiro' },
  precio: { etiqueta: 'Precio', icono: 'payment', ejemplo: '$ 850.000' },
  ciudad: { etiqueta: 'Ciudad', icono: 'globe', ejemplo: 'Córdoba' },
  edad: { etiqueta: 'Edad', icono: 'cake', ejemplo: '27' },
};

const PASTILLA = 'mx-0.5 inline-flex select-none items-center rounded-pill bg-primary-600/[0.12] px-2 py-px align-baseline text-[0.85em] font-semibold text-primary-800';

const pastilla = (clave) => {
  const el = document.createElement('span');
  el.contentEditable = 'false';
  el.dataset.var = clave;
  el.className = PASTILLA;
  el.textContent = DATOS_MENSAJE[clave].etiqueta;
  return el;
};

/* Arma el editor a partir del texto guardado; los saltos de línea van como <br>. */
const pintar = (raiz, texto, claves) => {
  raiz.replaceChildren();
  String(texto ?? '')
    .split(/(\{\w+\}|\n)/)
    .forEach((parte) => {
      const clave = parte.match(/^\{(\w+)\}$/)?.[1];
      if (clave && claves.includes(clave)) raiz.append(pastilla(clave));
      else if (parte === '\n') raiz.append(document.createElement('br'));
      else if (parte) raiz.append(document.createTextNode(parte));
    });
};

/* Y lo vuelve a texto: las pastillas como {clave}, los cortes de línea como \n. */
const leer = (raiz) => {
  const partes = [];
  const recorrer = (nodo) => {
    for (const n of nodo.childNodes) {
      if (n.dataset?.var) partes.push(`{${n.dataset.var}}`);
      else if (n.nodeName === 'BR') partes.push('\n');
      else if (n.nodeType === Node.TEXT_NODE) partes.push(n.textContent.replace(/\u00a0/g, ' '));
      else if (n.nodeName === 'DIV' || n.nodeName === 'P') {
        // Enter en algunos navegadores arma un bloque nuevo: es un salto de línea.
        if (partes.length) partes.push('\n');
        recorrer(n);
      } else recorrer(n);
    }
  };
  recorrer(raiz);
  return partes.join('');
};

/**
 * Un mensaje con datos que se suman tocándolos. `claves` dice qué datos tiene
 * este mensaje (cada uno se arma con los suyos).
 */
const EditorConDatos = ({ id, valor, onChange, onBlur, claves, etiqueta = 'Mensaje', placeholder, className }) => {
  const ref = useRef(null);
  const rango = useRef(null);
  useEffect(() => {
    pintar(ref.current, valor, claves);
    // Se pinta al montar: después el editor manda (si no, el cursor salta al escribir).
  }, []);

  const recordar = () => {
    const sel = window.getSelection();
    if (sel?.rangeCount && ref.current.contains(sel.anchorNode)) rango.current = sel.getRangeAt(0).cloneRange();
  };
  const sumar = (clave) => {
    const el = pastilla(clave);
    const espacio = document.createTextNode('\u00a0');
    if (rango.current) {
      rango.current.deleteContents();
      const { startContainer: nodo, startOffset: pos } = rango.current;
      const pegado = nodo.nodeType === Node.TEXT_NODE && pos > 0 && !/\s/.test(nodo.textContent[pos - 1]);
      rango.current.insertNode(espacio);
      rango.current.insertNode(el);
      // Si el cursor estaba pegado a una palabra, la pastilla no se le pega.
      if (pegado) rango.current.insertNode(document.createTextNode(' '));
    } else {
      ref.current.append(el, espacio);
    }
    const r = document.createRange();
    r.setStartAfter(espacio);
    rango.current = r;
    onChange(leer(ref.current));
  };

  return (
    <div className={className}>
      <div
        id={id}
        ref={ref}
        role="textbox"
        aria-multiline="true"
        aria-label={etiqueta}
        data-placeholder={placeholder}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(leer(ref.current))}
        onKeyUp={recordar}
        onMouseUp={recordar}
        onBlur={() => {
          recordar();
          onBlur?.();
        }}
        className={cn(
          'min-h-[6.5rem] w-full whitespace-pre-wrap rounded-control border border-surface-border bg-surface px-3.5 py-2.5 text-sm leading-[1.9] text-ink outline-none transition-colors duration-base focus:border-ink',
          'empty:before:text-ink-faint empty:before:content-[attr(data-placeholder)]',
        )}
      />
      {claves.length > 0 && (
        <>
          <p className="mb-2 mt-3 text-xs font-medium text-ink-muted">Tocá un dato para sumarlo donde está el cursor</p>
          <div className="flex flex-wrap gap-1.5">
            {claves.map((clave) => (
              <button
                key={clave}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => sumar(clave)}
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-pill border border-surface-border bg-surface px-3 text-xs font-semibold text-ink-soft transition-colors duration-base hover:border-primary-600/40 hover:text-primary-800"
              >
                <Icon name={DATOS_MENSAJE[clave].icono} size="xs" />
                {DATOS_MENSAJE[clave].etiqueta}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/** Cómo llega el mensaje, como burbuja de WhatsApp y con datos de ejemplo. */
export const BurbujaWhatsApp = ({ mensaje, titulo = 'Así llega', propio = true }) => {
  const partes = String(mensaje ?? '').split(/(\{\w+\})/);
  return (
    <div className="rounded-[18px] bg-surface-sunken p-4">
      <p className="mb-3 text-center text-[0.7rem] font-medium text-ink-muted">{titulo}</p>
      <div className={cn('max-w-[88%] whitespace-pre-wrap rounded-[14px] px-3.5 py-2.5 text-sm leading-relaxed text-ink', propio ? 'ms-auto rounded-ee-[4px] bg-success-50' : 'rounded-es-[4px] bg-surface')}>
        {mensaje?.trim() ? (
          partes.map((parte, i) => {
            const clave = parte.match(/^\{(\w+)\}$/)?.[1];
            return DATOS_MENSAJE[clave] ? (
              <strong key={i} className="font-semibold">
                {DATOS_MENSAJE[clave].ejemplo}
              </strong>
            ) : (
              parte
            );
          })
        ) : (
          <span className="text-ink-faint">Todavía no hay mensaje</span>
        )}
        <span className="mt-1 block text-end text-[0.65rem] text-ink-muted">20:14</span>
      </div>
    </div>
  );
};

export default EditorConDatos;
