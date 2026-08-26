import { Component } from 'react';
import { Alert, Button } from '../ui';

/**
 * Red de contención para errores de render.
 *
 * Sin esto, cualquier excepción durante el render desmonta el árbol entero y
 * la persona queda mirando una pantalla en blanco, sin mensaje ni salida.
 * Con esto, el error queda contenido: se muestra qué pasó y dos formas de
 * seguir (recargar o volver al inicio).
 *
 * Es un class component porque los error boundaries todavía no tienen
 * equivalente en hooks — es el único caso legítimo de clase en la app.
 *
 * En App se monta con `key={location.pathname}` para que navegar a otra
 * sección lo resetee solo: un error en una pantalla no debe secuestrar a las
 * demás.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Queda en consola con el component stack para poder diagnosticar.
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen items-start justify-center bg-surface-page px-4 py-16 sm:px-6">
        <div className="w-full max-w-lg">
          <Alert
            tone="danger"
            title="Algo salió mal en esta pantalla"
            action={
              <>
                <Button size="sm" onClick={() => window.location.reload()}>
                  Recargar
                </Button>
                <Button size="sm" variant="secondary" href="/">
                  Ir al inicio
                </Button>
              </>
            }
          >
            El resto del sistema sigue funcionando — probá recargar, o navegá a otra sección desde
            el menú.
            {import.meta.env.DEV && (
              <pre className="mt-3 overflow-x-auto rounded-control bg-ink/[0.04] p-3 font-mono text-xs text-danger-700">
                {String(this.state.error?.stack || this.state.error)}
              </pre>
            )}
          </Alert>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
