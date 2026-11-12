import { createContext, useCallback, useContext, useRef, useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import Icon from './Icon';
import Field from './Field';
import Textarea from './Textarea';
import cn from './cn';
import { useIdioma } from '../../i18n/IdiomaContext';

const ConfirmContext = createContext(null);

const TONES = {
  danger: { chip: 'bg-danger-50 text-danger-600', icon: 'warning', variant: 'danger' },
  warning: { chip: 'bg-warning-50 text-warning-600', icon: 'warning', variant: 'warning' },
  primary: { chip: 'bg-primary-50 text-primary', icon: 'info', variant: 'primary' },
};

/**
 * Reemplazo propio de `window.confirm`.
 *
 * El nativo bloquea el hilo, no se puede estilar, se ve distinto en cada
 * sistema operativo y algunos navegadores lo suprimen. Este mantiene la misma
 * forma de uso —esperar un booleano— para que migrar un `window.confirm` sea
 * cambiar una línea:
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: '¿Cancelar inscripción?' }))) return;
 *
 * Con `prompt` el diálogo suma un campo de texto y resuelve con el string
 * escrito (o `false` si se cancela) — reemplaza al window.prompt nativo:
 *
 *   const motivo = await confirm({
 *     title: '¿Rechazar el pago?',
 *     prompt: { label: 'Motivo del rechazo', optional: true },
 *   });
 *   if (motivo === false) return;
 *
 * La promesa se guarda en un ref y se resuelve cuando la persona elige. Es la
 * pieza que convierte un diálogo declarativo en una llamada imperativa.
 */
export const ConfirmProvider = ({ children }) => {
  const { t } = useIdioma();
  const [state, setState] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback((options = {}) => {
    setState({
      title: t('ui.confirmarTitulo'),
      confirmLabel: t('ui.confirmar'),
      cancelLabel: t('ui.cancelar'),
      tone: 'danger',
      ...(typeof options === 'string' ? { title: options } : options),
    });
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, [t]);

  const [promptValue, setPromptValue] = useState('');

  const settle = useCallback(
    (accepted) => {
      // Con prompt, aceptar resuelve con el texto; cancelar siempre con false.
      resolver.current?.(accepted ? (state?.prompt ? promptValue : true) : false);
      resolver.current = null;
      setState(null);
      setPromptValue('');
    },
    [state, promptValue]
  );

  const tone = TONES[state?.tone] ?? TONES.danger;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      <Modal
        open={Boolean(state)}
        onClose={() => settle(false)}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => settle(false)}>
              {state?.cancelLabel}
            </Button>
            <Button variant={tone.variant} onClick={() => settle(true)}>
              {state?.confirmLabel}
            </Button>
          </>
        }
      >
        <div className="flex gap-4">
          <span
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-pill',
              tone.chip
            )}
          >
            <Icon name={tone.icon} size="lg" />
          </span>

          <div className="min-w-0 pt-0.5">
            <p className="font-semibold tracking-tight text-ink">{state?.title}</p>
            {state?.description && (
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{state.description}</p>
            )}

            {state?.prompt && (
              <Field
                label={state.prompt.label}
                hint={state.prompt.optional ? t('ui.opcional') : undefined}
                className="mb-0 mt-3"
              >
                <Textarea
                  rows={3}
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  placeholder={state.prompt.placeholder}
                />
              </Field>
            )}
          </div>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
};

/**
 * Devuelve la función de confirmación. Si no hay provider arriba, cae al
 * `window.confirm` nativo en vez de romper — así una pantalla sin migrar
 * sigue funcionando.
 */
export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  return (
    ctx ??
    ((options) =>
      Promise.resolve(window.confirm(typeof options === 'string' ? options : options?.title)))
  );
};

export default ConfirmProvider;
