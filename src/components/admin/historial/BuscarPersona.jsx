import { useEffect, useId, useState } from 'react';
import axios from 'axios';
import { Badge, Button, Field, Icon, Input, Spinner, cn } from '../../ui';
import { useToast } from '../../../contexts/ToastContext';
import useDebounce from '../../../hooks/useDebounce';

/**
 * Elegir a una persona: se escribe el nombre o el mail y aparecen las cuentas
 * y los contactos que coinciden. Si no está, se la crea ahí mismo como
 * contacto con lo mínimo (nombre, y si se tiene, teléfono o mail), sin salir
 * de lo que se estaba haciendo.
 *
 * `onElegir` recibe { tipo: 'usuario' | 'contacto', id, nombre, email }.
 */
const BuscarPersona = ({ onElegir, elegida, origenContacto = 'manual', autoFocus = false }) => {
  const { showError } = useToast();
  const [q, setQ] = useState('');
  const buscado = useDebounce(q.trim(), 250);
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [creando, setCreando] = useState(false);
  const [nuevo, setNuevo] = useState({ nombre: '', apellido: '', telefono: '', email: '' });
  const [guardando, setGuardando] = useState(false);
  const idLista = useId();

  useEffect(() => {
    if (buscado.length < 2) {
      setResultados([]);
      return undefined;
    }
    const control = new AbortController();
    setBuscando(true);
    axios
      .get('/historial/personas', { params: { q: buscado }, signal: control.signal })
      .then((r) => setResultados(r.data.personas))
      .catch(() => {})
      .finally(() => setBuscando(false));
    return () => control.abort();
  }, [buscado]);

  const abrirAlta = () => {
    const [nombre, ...resto] = q.trim().split(/\s+/);
    const esMail = q.includes('@');
    setNuevo({ nombre: esMail ? '' : nombre ?? '', apellido: esMail ? '' : resto.join(' '), telefono: '', email: esMail ? q.trim() : '' });
    setCreando(true);
  };

  const crear = async () => {
    if (!nuevo.nombre.trim()) return;
    setGuardando(true);
    try {
      const r = await axios.post('/historial/contactos', { ...nuevo, origen: origenContacto });
      onElegir(r.data.persona);
      setCreando(false);
      setQ('');
    } catch (error) {
      showError(error.response?.data?.message || 'No se pudo crear el contacto');
    } finally {
      setGuardando(false);
    }
  };

  if (elegida) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-control border border-surface-border bg-surface-sunken px-3 py-2.5">
        <span className="min-w-0">
          <span className="block truncate font-medium text-ink">{elegida.nombre}</span>
          <span className="block truncate text-xs text-ink-muted">
            {elegida.tipo === 'usuario' ? 'Tiene cuenta' : 'Contacto sin cuenta'}
            {elegida.email ? ` · ${elegida.email}` : ''}
          </span>
        </span>
        <Button variant="link" size="sm" onClick={() => onElegir(null)}>
          Cambiar
        </Button>
      </div>
    );
  }

  if (creando) {
    return (
      <div className="animate-fade-in-up rounded-control border border-surface-border bg-surface-sunken p-4">
        <p className="mb-3 text-sm font-medium text-ink">Nuevo contacto</p>
        <div className="grid gap-x-3 sm:grid-cols-2">
          <Field label="Nombre" htmlFor="nuevo-nombre" required className="mb-3">
            <Input id="nuevo-nombre" value={nuevo.nombre} onChange={(e) => setNuevo((n) => ({ ...n, nombre: e.target.value }))} autoFocus />
          </Field>
          <Field label="Apellido" htmlFor="nuevo-apellido" className="mb-3">
            <Input id="nuevo-apellido" value={nuevo.apellido} onChange={(e) => setNuevo((n) => ({ ...n, apellido: e.target.value }))} />
          </Field>
          <Field label="Teléfono" htmlFor="nuevo-telefono" hint="Para escribirle después" className="mb-3">
            <Input id="nuevo-telefono" type="tel" icon="phone" value={nuevo.telefono} onChange={(e) => setNuevo((n) => ({ ...n, telefono: e.target.value }))} />
          </Field>
          <Field label="Mail" htmlFor="nuevo-email" className="mb-3">
            <Input id="nuevo-email" type="email" icon="mail" value={nuevo.email} onChange={(e) => setNuevo((n) => ({ ...n, email: e.target.value }))} />
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setCreando(false)}>
            Volver a buscar
          </Button>
          <Button size="sm" icon="check" loading={guardando} disabled={!nuevo.nombre.trim()} onClick={crear}>
            Crear y elegir
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Input
        icon="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Nombre, apellido o mail"
        autoFocus={autoFocus}
        aria-controls={idLista}
        aria-label="Buscar persona"
      />
      {q.trim().length >= 2 && (
        <div id={idLista} className="mt-2 animate-fade-in overflow-hidden rounded-control border border-surface-border bg-surface">
          {buscando && !resultados.length ? (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-ink-muted">
              <Spinner size="sm" label="Buscando" /> Buscando…
            </div>
          ) : (
            <ul className="max-h-64 divide-y divide-surface-border overflow-y-auto">
              {resultados.map((p) => (
                <li key={`${p.tipo}-${p.id}`}>
                  <button
                    type="button"
                    onClick={() => {
                      onElegir(p);
                      setQ('');
                    }}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-start transition-colors duration-base hover:bg-ink/[0.03]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">{p.nombre}</span>
                      {(p.email || p.telefono) && <span className="block truncate text-xs text-ink-muted">{p.email ?? p.telefono}</span>}
                    </span>
                    <Badge tone={p.tipo === 'usuario' ? 'primary' : 'neutral'} className="shrink-0">
                      {p.tipo === 'usuario' ? 'Cuenta' : 'Contacto'}
                    </Badge>
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={abrirAlta}
                  className={cn('flex w-full items-center gap-2 px-3 py-2.5 text-start text-sm font-medium text-primary-700 transition-colors duration-base hover:bg-primary-50')}
                >
                  <Icon name="add" size="sm" />
                  {resultados.length ? 'No es ninguna: crear contacto nuevo' : `Crear contacto «${q.trim()}»`}
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default BuscarPersona;
