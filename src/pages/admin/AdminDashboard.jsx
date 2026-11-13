import { useRef, useState } from 'react';
import axios from 'axios';
import { DateTime } from 'luxon';
import PageContainer from '../../components/layout/PageContainer';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import useCargaSuave from '../../hooks/useCargaSuave';
import { Alert, Button, Icon, Skeleton, cn } from '../../components/ui';
import { AR_TZ, BLOQUES } from '../../components/admin/panel/bloques';
import { BarraBloque, BarraEdicion, Bandeja, OpcionesBloque } from '../../components/admin/panel/Edicion';
import { DEFAULT_PUBLIC_TAG_COLOR, publicTagColor, publicTagIcon } from '../../utils/tagFields';

const saludo = (hora) => (hora < 13 ? 'Buen día' : hora < 20 ? 'Buenas tardes' : 'Buenas noches');

/* Una pieza que falla no tira el panel entero: queda vacía y lo demás sale. */
const pedirTodo = async (signal) => {
  const hoy = DateTime.now().setZone(AR_TZ);
  const pedidos = {
    inicio: axios.get('/admin/inicio', { signal }),
    hoy: axios.get('/admin/hoy', { signal }),
    // Doce meses: la barrita de cada número puede mostrar hasta un año.
    metricas: axios.get('/admin/metrics', { params: { from: hoy.startOf('month').minus({ months: 11 }).toISODate(), to: hoy.toISODate() }, signal }),
    actividades: axios.get('/admin/actividades-resumen', { signal }),
    tags: axios.get('/tags', { signal }),
  };
  const claves = Object.keys(pedidos);
  const respuestas = await Promise.allSettled(Object.values(pedidos));
  if (signal.aborted) throw new DOMException('cancelado', 'AbortError');
  return Object.fromEntries(claves.map((k, i) => [k, respuestas[i].status === 'fulfilled' ? respuestas[i].value.data : null]));
};

/* Si el panel guardado no llega, se dibuja el de siempre (sin poder armarlo). */
const DE_RESPALDO = [
  { id: 'pendientes', visible: true, ancho: 'entera', opciones: { mostrar: ['personas', 'inscripciones', 'comprobantes'] } },
  { id: 'numeros', visible: true, ancho: 'entera', opciones: { cuales: ['vinieron', 'vuelven', 'veces', 'cubrio'], meses: 6 } },
  { id: 'semana', visible: true, ancho: 'entera', opciones: { borradores: false } },
  { id: 'proximo', visible: true, ancho: 'media', opciones: { criterio: 'mas_gente', dias: 7 } },
  { id: 'cumples', visible: true, ancho: 'media', opciones: { semanaQueViene: true } },
];

const deSiempre = (catalogo) =>
  catalogo.map((c) => ({ id: c.id, visible: c.visible, ancho: c.ancho, opciones: Object.fromEntries(Object.entries(c.opciones).map(([k, o]) => [k, o.defecto])) }));
const tieneOpciones = (catalogo, id) => Object.keys(catalogo.find((c) => c.id === id)?.opciones ?? {}).length > 0;

/**
 * El panel del equipo, «Hoy en Malka». Cada persona lo arma a su gusto sobre
 * la misma pantalla: «Armar mi panel» pone los bloques en modo edición
 * (ordenar, ancho, opciones, ocultar y sumar), y el engranaje de cada bloque
 * cambia sólo sus opciones. Lo elegido se guarda en el servidor.
 */
const AdminDashboard = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [ahora] = useState(() => DateTime.now().setZone(AR_TZ).setLocale('es'));
  const { datos, error, recargar } = useCargaSuave(pedirTodo, 'panel');

  const [guardado, setGuardado] = useState(null); // lo último que devolvió el back al guardar
  const [editando, setEditando] = useState(null); // null | 'todo' | id de un bloque
  const [borrador, setBorrador] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [arrastrado, setArrastrado] = useState(null);
  // También en un ref: el primer «dragover» llega antes de que React vuelva a dibujar.
  const enLaMano = useRef(null);
  const ultimoCambio = useRef(0);
  const etiquetaArrastre = useRef(null);

  const inicio = guardado ?? datos?.inicio;
  const catalogo = inicio?.catalogo ?? null;
  const bloques = borrador ?? inicio?.bloques ?? (datos ? DE_RESPALDO : []);

  const tags = datos?.tags?.tags ?? [];
  const tagDe = (a) => a.categorias?.[0];
  const colorDe = (a) => (tagDe(a) ? publicTagColor(tags, tagDe(a)) : DEFAULT_PUBLIC_TAG_COLOR);
  const iconoDe = (a) => (tagDe(a) && publicTagIcon(tags, tagDe(a))) || 'activity';

  /* La frase de arriba: lo de hoy, en palabras. */
  const actividades = (datos?.actividades?.actividades ?? []).filter((a) => a.estado === 'publicada');
  const hoyIso = datos?.actividades?.semana?.hoy ?? ahora.toISODate();
  const deHoy = actividades.flatMap((a) => (a.semana ?? []).filter((e) => e.fecha === hoyIso).map((e) => ({ ...e, titulo: a.titulo })));
  const frase = deHoy.length ? `Hoy hay ${deHoy.map((e) => `${e.titulo}${e.hora ? ` a las ${e.hora}` : ''}`).join(' y ')}.` : 'Hoy no hay actividades en la agenda.';

  /* ---- Edición ---- */
  const empezar = (que) => {
    setBorrador(inicio.bloques.map((b) => ({ ...b, opciones: { ...b.opciones } })));
    setEditando(que);
  };
  const cancelar = () => {
    setBorrador(null);
    setEditando(null);
  };
  const guardar = async () => {
    setGuardando(true);
    try {
      const res = await axios.put('/admin/inicio', { bloques: borrador });
      setGuardado(res.data);
      setBorrador(null);
      setEditando(null);
      showSuccess(res.data.personalizado ? 'Tu panel quedó guardado' : 'Volviste al panel de siempre');
    } catch (e) {
      showError(e.response?.data?.message || 'No se pudo guardar el panel');
    } finally {
      setGuardando(false);
    }
  };
  const cambiarBloque = (id, cambio) => setBorrador((bs) => bs.map((b) => (b.id === id ? { ...b, ...cambio } : b)));
  const visibles = bloques.filter((b) => b.visible);
  /* Mueve un bloque al lugar de otro (los ocultos quedan donde estaban). */
  const moverA = (id, destino) =>
    setBorrador((bs) => {
      const desde = bs.findIndex((b) => b.id === id);
      const hasta = bs.findIndex((b) => b.id === destino);
      const sin = bs.filter((b) => b.id !== id);
      const i = sin.findIndex((b) => b.id === destino);
      sin.splice(desde < hasta ? i + 1 : i, 0, bs[desde]);
      return sin;
    });
  const correr = (id, paso) => {
    const i = visibles.findIndex((b) => b.id === id);
    const otro = visibles[i + paso];
    if (otro) moverA(id, otro.id);
  };
  const sumar = (id) =>
    setBorrador((bs) => {
      const b = bs.find((x) => x.id === id);
      return [...bs.filter((x) => x.id !== id), { ...b, visible: true }];
    });

  /* Arrastrar: en la mano va una etiqueta con el nombre, no la foto del bloque. */
  const alAgarrar = (e, id) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    if (etiquetaArrastre.current) {
      etiquetaArrastre.current.textContent = BLOQUES[id].nombre;
      e.dataTransfer.setDragImage(etiquetaArrastre.current, 16, 16);
    }
    enLaMano.current = id;
    setArrastrado(id);
  };
  /* Pasa al lugar del otro apenas el puntero cruza su mitad, con un freno de
     150 ms para que no se intercambien ida y vuelta. */
  const alPasar = (e, id) => {
    e.preventDefault();
    const agarrado = enLaMano.current;
    if (!agarrado || agarrado === id || Date.now() - ultimoCambio.current < 150) return;
    const r = e.currentTarget.getBoundingClientRect();
    const avance = (e.clientY - r.top) / r.height + (e.clientX - r.left) / r.width;
    const haciaAdelante = visibles.findIndex((b) => b.id === id) > visibles.findIndex((b) => b.id === agarrado);
    if (haciaAdelante ? avance > 1 : avance < 1) {
      ultimoCambio.current = Date.now();
      moverA(agarrado, id);
    }
  };

  const armando = editando === 'todo';

  return (
    <PageContainer>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-ink-muted first-letter:uppercase">{ahora.toFormat("cccc d 'de' LLLL")}</p>
            <h1 className="mt-1 font-grotesk text-[clamp(1.8rem,3vw,2.4rem)] font-semibold tracking-tight text-ink">
              {saludo(ahora.hour)}
              {user?.nombre ? `, ${user.nombre}` : ''}
            </h1>
            {datos?.actividades ? <p className="mt-1 animate-fade-in text-ink-soft">{frase}</p> : <Skeleton className="mt-2 h-5 w-80 max-w-full" />}
          </div>
          <div className="flex flex-wrap gap-2">
            {catalogo && !editando && (
              <Button variant="ghost" size="sm" icon="dashboard" onClick={() => empezar('todo')}>
                Armar mi panel
              </Button>
            )}
            <Button variant="secondary" size="sm" icon="users" to="/admin/historial">
              Sumar visita
            </Button>
            <Button size="sm" icon="add" to="/admin/activities/new">
              Nueva actividad
            </Button>
          </div>
        </header>

        {error && <Alert tone="danger">No se pudo cargar el panel. Probá recargar la página.</Alert>}
        {datos && !datos.inicio && (
          <Alert tone="warning">
            No se pudo leer tu panel guardado: estás viendo el de siempre.{' '}
            <button type="button" className="font-semibold underline" onClick={recargar}>
              Reintentar
            </button>
          </Alert>
        )}

        {armando && <BarraEdicion arriba onDeSiempre={() => setBorrador(deSiempre(catalogo))} onCancelar={cancelar} onGuardar={guardar} guardando={guardando} />}

        {/* Fuera de pantalla: lo que se ve en la mano al arrastrar. */}
        <span ref={etiquetaArrastre} aria-hidden className="fixed -left-[9999px] top-0 rounded-pill bg-ink px-3 py-1.5 text-sm font-semibold text-surface" />

        <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
          {visibles.map((b, i) => {
            const { Componente } = BLOQUES[b.id];
            const solo = editando === b.id;
            const conOpciones = catalogo && tieneOpciones(catalogo, b.id);
            return (
              <div
                key={b.id}
                draggable={armando}
                onDragStart={armando ? (e) => alAgarrar(e, b.id) : undefined}
                onDragOver={armando ? (e) => alPasar(e, b.id) : undefined}
                onDragEnd={() => {
                  enLaMano.current = null;
                  setArrastrado(null);
                }}
                className={cn(
                  'group relative flex flex-col transition-[opacity,box-shadow] duration-base',
                  b.ancho === 'entera' && 'lg:col-span-2',
                  armando && 'rounded-[24px] border-2 border-dashed border-primary-600/40 p-3',
                  solo && 'rounded-[24px] ring-2 ring-primary-600/40 ring-offset-4 ring-offset-surface-page',
                  arrastrado === b.id && 'opacity-40',
                )}
              >
                {armando && (
                  <BarraBloque
                    bloque={b}
                    primero={i === 0}
                    ultimo={i === visibles.length - 1}
                    onAncho={(ancho) => cambiarBloque(b.id, { ancho })}
                    onSubir={() => correr(b.id, -1)}
                    onBajar={() => correr(b.id, 1)}
                    onOcultar={() => cambiarBloque(b.id, { visible: false })}
                  />
                )}
                {(armando || solo) && conOpciones && (
                  <div className="mb-3 animate-fade-in">
                    <OpcionesBloque catalogo={catalogo.find((c) => c.id === b.id)} bloque={b} onChange={(opciones) => cambiarBloque(b.id, { opciones })} />
                    {solo && (
                      <div className="mt-2 flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={cancelar}>
                          Cancelar
                        </Button>
                        <Button size="sm" icon="check" onClick={guardar} loading={guardando}>
                          Guardar
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                {/* Mientras se arma, lo de adentro queda quieto: un toque no navega. */}
                <div inert={armando ? '' : undefined} className={cn('flex-1 [&>*]:h-full', armando && 'pointer-events-none select-none')}>
                  <Componente datos={datos} opciones={b.opciones} ancho={b.ancho} colorDe={colorDe} iconoDe={iconoDe} />
                </div>
                {!editando && conOpciones && (
                  <button
                    type="button"
                    onClick={() => empezar(b.id)}
                    aria-label={`Opciones de «${BLOQUES[b.id].nombre}»`}
                    title="Opciones de este bloque"
                    className="absolute -top-2 end-2 z-10 flex h-8 w-8 items-center justify-center rounded-pill border border-surface-border bg-surface text-ink-soft opacity-0 shadow-card transition-opacity duration-base hover:text-ink focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                  >
                    <Icon name="settings" size="sm" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {armando && (
          <>
            <Bandeja ocultos={bloques.filter((b) => !b.visible)} onSumar={sumar} />
            <BarraEdicion onCancelar={cancelar} onGuardar={guardar} guardando={guardando} />
          </>
        )}
      </div>
    </PageContainer>
  );
};

export default AdminDashboard;
