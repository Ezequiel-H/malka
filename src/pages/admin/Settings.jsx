import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import PageContainer from '../../components/layout/PageContainer';
import useCargaSuave from '../../hooks/useCargaSuave';
import EditorConDatos, { BurbujaWhatsApp } from '../../components/admin/EditorConDatos';
import { PLANTILLA_VARIABLES } from '../../utils/whatsapp';
import { Alert, Button, Field, Icon, Input, Skeleton, Textarea, cn } from '../../components/ui';

const ESPERA_MS = 1200;

const SECCIONES = [
  { id: 'pagos', icono: 'payment', titulo: 'Pagos', bajada: 'Lo que ve quien se anota a una actividad paga.' },
  { id: 'whatsapp', icono: 'whatsapp', titulo: 'WhatsApp', bajada: 'El número adonde escriben los participantes.' },
  { id: 'mensajes', icono: 'mail', titulo: 'Mensajes', bajada: 'Lo que sale escrito cuando alguien toca un botón de WhatsApp.' },
  { id: 'plantillas', icono: 'document', titulo: 'Plantillas', bajada: 'Mensajes listos para escribirle a cada inscripto.' },
];

/* Cada mensaje con los datos que tiene a mano. */
const MENSAJES = [
  {
    campo: 'whatsappViajeMensaje',
    titulo: 'Coordinar un viaje',
    cuando: 'Cuando alguien anotado a un viaje toca «Escribinos por WhatsApp».',
    claves: PLANTILLA_VARIABLES,
    llegaA: 'Así le llega al centro',
  },
  {
    campo: 'whatsappRegistroMensaje',
    titulo: 'Terminar el registro',
    cuando: 'Cuando alguien que no vive en Buenos Aires o usa pasaporte se registra y toca «Escribirnos».',
    claves: ['nombre', 'ciudad'],
    llegaA: 'Así le llega al centro',
  },
  {
    campo: 'whatsappCumpleanosMensaje',
    titulo: 'Saludo de cumpleaños',
    cuando: 'Cuando el equipo toca «Saludar» en los cumpleaños del panel.',
    claves: ['nombre', 'edad'],
    llegaA: 'Así le llega a la persona',
  },
];

const CAMPOS = ['instruccionesPagoDefault', 'whatsappNumero', 'whatsappViajeMensaje', 'whatsappRegistroMensaje', 'whatsappCumpleanosMensaje'];

let ultimaClave = 0;
const conClave = (p) => ({ ...p, k: `p${++ultimaClave}` });
const completa = (p) => p.nombre.trim() && p.mensaje.trim();

const pedirAjustes = (signal) => axios.get('/settings', { signal }).then((r) => r.data.settings ?? {});

/**
 * Ajustes del centro: un índice a la izquierda (arriba en el teléfono) y cada
 * cambio se guarda solo, 1,2 s después de la última tecla o al salir del
 * campo. Los mensajes de WhatsApp se arman tocando los datos, que quedan
 * como pastillas, y al lado se ve cómo llegan.
 */
const Settings = () => {
  const [params, setParams] = useSearchParams();
  const seccion = SECCIONES.find((s) => s.id === params.get('seccion')) ?? SECCIONES[0];
  const { datos, cargando, error } = useCargaSuave(pedirAjustes, 'ajustes');

  const [valores, setValores] = useState(null);
  const [plantillas, setPlantillas] = useState([]);
  const [estado, setEstado] = useState('quieto'); // quieto | esperando | guardando | guardado | error
  const pendientes = useRef(new Set());
  const valoresRef = useRef(null);
  const plantillasRef = useRef([]);
  const reloj = useRef(null);

  useEffect(() => {
    if (!datos || valores) return;
    const v = Object.fromEntries(CAMPOS.map((c) => [c, datos[c] ?? '']));
    const ps = (datos.plantillasWhatsApp ?? []).map((p) => conClave({ nombre: p.nombre ?? '', mensaje: p.mensaje ?? '' }));
    setValores(v);
    setPlantillas(ps);
    valoresRef.current = v;
    plantillasRef.current = ps;
  }, [datos, valores]);

  /* Manda sólo lo que cambió. Las plantillas van enteras (sin las incompletas). */
  const guardar = useCallback(async () => {
    window.clearTimeout(reloj.current);
    const campos = [...pendientes.current];
    if (!campos.length) return;
    pendientes.current = new Set();
    const cuerpo = {};
    for (const c of campos) {
      cuerpo[c] = c === 'plantillasWhatsApp' ? plantillasRef.current.filter(completa).map(({ nombre, mensaje }) => ({ nombre, mensaje })) : valoresRef.current[c];
    }
    setEstado('guardando');
    try {
      const res = await axios.put('/settings', cuerpo);
      // El número vuelve normalizado (sólo dígitos): se refleja si no se siguió escribiendo.
      const numero = res.data.settings?.whatsappNumero;
      if ('whatsappNumero' in cuerpo && numero !== undefined && !pendientes.current.has('whatsappNumero')) {
        valoresRef.current = { ...valoresRef.current, whatsappNumero: numero };
        setValores(valoresRef.current);
      }
      setEstado(pendientes.current.size ? 'esperando' : 'guardado');
    } catch {
      for (const c of campos) pendientes.current.add(c);
      setEstado('error');
    }
  }, []);

  const programar = (campo) => {
    pendientes.current.add(campo);
    setEstado('esperando');
    window.clearTimeout(reloj.current);
    reloj.current = window.setTimeout(guardar, ESPERA_MS);
  };
  const cambiar = (campo, valor) => {
    valoresRef.current = { ...valoresRef.current, [campo]: valor };
    setValores(valoresRef.current);
    programar(campo);
  };
  const cambiarPlantillas = (fn) => {
    plantillasRef.current = fn(plantillasRef.current);
    setPlantillas(plantillasRef.current);
    programar('plantillasWhatsApp');
  };

  /* Lo que quedó sin mandar se manda al irse de la pantalla. */
  useEffect(() => () => void guardar(), [guardar]);

  const irA = (id) => setParams(id === SECCIONES[0].id ? {} : { seccion: id }, { replace: true });

  const indicador = {
    quieto: { icono: 'check', texto: 'Los cambios se guardan solos', clase: 'text-ink-muted' },
    esperando: { icono: 'edit', texto: 'Sin guardar todavía', clase: 'text-ink-muted' },
    guardando: { icono: 'loading', texto: 'Guardando…', clase: 'text-ink-muted' },
    guardado: { icono: 'check', texto: 'Guardado', clase: 'text-success-700' },
    error: { icono: 'error', texto: 'No se pudo guardar', clase: 'text-danger-700' },
  }[estado];

  return (
    <PageContainer title="Ajustes">
      {error && <Alert tone="danger">No se pudieron cargar los ajustes. Probá recargar la página.</Alert>}
      <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] [&>*]:min-w-0">
        <nav aria-label="Secciones de ajustes" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:flex-col lg:pb-0">
          {SECCIONES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => irA(s.id)}
              aria-current={seccion.id === s.id ? 'page' : undefined}
              className={cn(
                'flex shrink-0 items-center gap-3 rounded-pill px-4 py-2.5 text-sm font-medium transition-colors duration-base',
                seccion.id === s.id ? 'bg-ink text-surface' : 'text-ink-soft hover:bg-ink/[0.05]',
              )}
            >
              <Icon name={s.icono} size="sm" />
              {s.titulo}
            </button>
          ))}
        </nav>

        <section aria-labelledby="seccion-titulo" className="rounded-[22px] border border-surface-border bg-surface p-5 sm:p-6">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 id="seccion-titulo" className="font-grotesk text-xl font-semibold text-ink">
                {seccion.titulo}
              </h2>
              <p className="text-sm text-ink-muted">{seccion.bajada}</p>
            </div>
            <span className={cn('flex shrink-0 items-center gap-1.5 text-xs font-medium', indicador.clase)} role="status" aria-live="polite">
              <Icon name={indicador.icono} size="xs" className={estado === 'guardando' ? 'animate-spin' : undefined} />
              {indicador.texto}
              {estado === 'error' && (
                <button type="button" onClick={guardar} className="ms-1 font-semibold underline">
                  Reintentar
                </button>
              )}
            </span>
          </div>

          {cargando || !valores ? (
            <div className="space-y-3">{cargando && [0, 1].map((i) => <Skeleton key={i} className="h-28 rounded-[16px]" />)}</div>
          ) : (
            <div key={seccion.id} className="animate-fade-in">
              {seccion.id === 'pagos' && (
                <Field
                  label="Instrucciones de pago por defecto"
                  hint="Se muestran al anotarse a una actividad paga que no tenga instrucciones propias. El precio ya se ve en la actividad: acá va dónde transferir (alias, CBU, titular)."
                >
                  <Textarea
                    value={valores.instruccionesPagoDefault}
                    onChange={(e) => cambiar('instruccionesPagoDefault', e.target.value)}
                    onBlur={guardar}
                    rows={6}
                    placeholder="Ej: Transferí a Alias: MALKA.ACTIVIDADES · Titular: …"
                  />
                </Field>
              )}

              {seccion.id === 'whatsapp' && (
                <Field label="Número del centro" hint="Con código de país. Se guarda sólo con los números (wa.me no acepta + ni espacios).">
                  <Input
                    type="tel"
                    icon="whatsapp"
                    value={valores.whatsappNumero}
                    onChange={(e) => cambiar('whatsappNumero', e.target.value)}
                    onBlur={guardar}
                    placeholder="5491134405730"
                  />
                </Field>
              )}

              {seccion.id === 'mensajes' && (
                <div className="space-y-8">
                  {MENSAJES.map((m) => (
                    <div key={m.campo} className="grid items-start gap-5 xl:grid-cols-2">
                      <div>
                        <h3 className="font-semibold text-ink">{m.titulo}</h3>
                        <p className="mb-3 text-sm text-ink-muted">{m.cuando}</p>
                        <EditorConDatos
                          id={m.campo}
                          etiqueta={m.titulo}
                          valor={valores[m.campo]}
                          claves={m.claves}
                          onChange={(v) => cambiar(m.campo, v)}
                          onBlur={guardar}
                        />
                      </div>
                      <BurbujaWhatsApp mensaje={valores[m.campo]} titulo={m.llegaA} />
                    </div>
                  ))}
                </div>
              )}

              {seccion.id === 'plantillas' && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-ink-soft">Aparecen al tocar WhatsApp al lado de una persona en los inscriptos de una actividad.</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon="add"
                      onClick={() => {
                        // Una nueva arranca vacía: no se manda hasta que tenga nombre y mensaje.
                        plantillasRef.current = [...plantillasRef.current, conClave({ nombre: '', mensaje: '' })];
                        setPlantillas(plantillasRef.current);
                      }}
                    >
                      Nueva plantilla
                    </Button>
                  </div>
                  {plantillas.length === 0 ? (
                    <p className="rounded-[16px] border border-dashed border-surface-border p-5 text-center text-sm text-ink-muted">
                      Sin plantillas todavía. Sumá una, por ejemplo un recordatorio del día anterior.
                    </p>
                  ) : (
                    plantillas.map((p) => (
                      <div key={p.k} className="grid animate-fade-in items-start gap-5 rounded-[18px] border border-surface-border p-4 xl:grid-cols-2">
                        <div>
                          <div className="mb-3 flex items-center gap-2">
                            <Input
                              value={p.nombre}
                              aria-label="Nombre de la plantilla"
                              onChange={(e) => cambiarPlantillas((ps) => ps.map((x) => (x.k === p.k ? { ...x, nombre: e.target.value } : x)))}
                              onBlur={guardar}
                              placeholder="Nombre (ej: Recordatorio)"
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              icon="delete"
                              iconOnly
                              label={`Borrar «${p.nombre || 'plantilla sin nombre'}»`}
                              onClick={() => cambiarPlantillas((ps) => ps.filter((x) => x.k !== p.k))}
                            />
                          </div>
                          <EditorConDatos
                            etiqueta={`Mensaje de ${p.nombre || 'la plantilla'}`}
                            valor={p.mensaje}
                            claves={PLANTILLA_VARIABLES}
                            placeholder="Escribí el mensaje y sumá los datos de abajo"
                            onChange={(v) => cambiarPlantillas((ps) => ps.map((x) => (x.k === p.k ? { ...x, mensaje: v } : x)))}
                            onBlur={guardar}
                          />
                          {!completa(p) && <p className="mt-2 text-xs text-warning-700">Le falta {p.nombre.trim() ? 'el mensaje' : 'el nombre'}: se guarda cuando esté completa.</p>}
                        </div>
                        <BurbujaWhatsApp mensaje={p.mensaje} titulo="Así le llega a la persona" />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </PageContainer>
  );
};

export default Settings;
