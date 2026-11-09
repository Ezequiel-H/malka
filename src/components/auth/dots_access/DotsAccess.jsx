import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { createDotsEngine } from "./engine";
/** Sin matchMedia (tests) tampoco hay animación que esperar. */
const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? true;

const DotsContext = createContext({
  fail: () => void 0,
  succeed: () => Promise.resolve()
});
export const useDotsAccess = () => useContext(DotsContext);
const OK_MS = 620;
const FLY_MS = 560;
const ERROR_MS = 1500;
const shapeOfField = (field) => {
  if (field instanceof HTMLButtonElement) return null;
  if (!(field instanceof HTMLInputElement)) return "mark";
  const autocomplete = field.autocomplete;
  if (field.type === "password" || autocomplete.includes("password"))
    return "password";
  if (field.type === "email" || autocomplete === "email" || autocomplete === "username")
    return "email";
  return "mark";
};
const readColor = (root, token) => {
  const probe = document.createElement("i");
  probe.style.color = `var(${token})`;
  probe.style.display = "none";
  root.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
};
/**
 * Pantalla de acceso sin tarjeta: la grilla de fondo arma el logo, una @ al
 * escribir el email, un candado en la contraseña y un tilde al entrar.
 * Los formularios adentro siguen siendo los del DS.
 */
export const DotsAccess = ({ name, markSrc, children }) => {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const held = useRef(false);
  const failTimer = useRef(undefined);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return void 0;
    const reduced = prefersReducedMotion();
    const engine = createDotsEngine(canvas, name, reduced);
    engineRef.current = engine;
    const paint = () => engine.setColors({
      glow: readColor(root, "--dots-glow"),
      ground: readColor(root, "--dots-ground"),
      idle: readColor(root, "--dots-idle")
    });
    paint();
    engine.start();
    const onPointer = (event) => engine.pointer(event.clientX, event.clientY);
    const resize = window.ResizeObserver ? new ResizeObserver(() => engine.resize()) : null;
    resize?.observe(canvas);
    const theme = new MutationObserver(paint);
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"]
    });
    const scheme = window.matchMedia?.("(prefers-color-scheme: dark)");
    scheme?.addEventListener?.("change", paint);
    window.addEventListener("pointermove", onPointer, { passive: true });
    let alive = true;
    void document.fonts?.ready.then(() => {
      if (alive) engine.resize();
    });
    if (markSrc) {
      const image = new Image();
      image.onload = () => {
        if (alive) engine.setMark(image);
      };
      image.src = markSrc;
    }
    return () => {
      alive = false;
      engine.stop();
      engineRef.current = null;
      resize?.disconnect();
      theme.disconnect();
      scheme?.removeEventListener?.("change", paint);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [name, markSrc]);
  const followFocus = useCallback(() => {
    setTimeout(() => {
      if (held.current) return;
      const next = shapeOfField(document.activeElement);
      if (next) engineRef.current?.setShape(next);
    }, 30);
  }, []);
  const signal = useMemo(
    () => ({
      fail: () => {
        clearTimeout(failTimer.current);
        held.current = true;
        engineRef.current?.setShape("error");
        failTimer.current = setTimeout(() => {
          held.current = false;
          engineRef.current?.setShape(
            shapeOfField(document.activeElement) ?? "mark"
          );
        }, ERROR_MS);
      },
      succeed: () => {
        clearTimeout(failTimer.current);
        if (prefersReducedMotion() || !engineRef.current?.drawable) return Promise.resolve();
        held.current = true;
        engineRef.current?.setShape("ok");
        return new Promise((done) => {
          setTimeout(() => {
            setLeaving(true);
            engineRef.current?.fly();
            setTimeout(done, FLY_MS);
          }, OK_MS);
        });
      }
    }),
    []
  );
  return <DotsContext.Provider value={signal}><div
    ref={rootRef}
    className={leaving ? "dots-access is-leaving" : "dots-access"}
    onFocus={followFocus}
    onBlur={followFocus}
    onInput={() => engineRef.current?.ripple()}
  ><canvas ref={canvasRef} aria-hidden className='dots-access__canvas' /><div className='dots-access__panel'>{children}</div></div></DotsContext.Provider>;
};
