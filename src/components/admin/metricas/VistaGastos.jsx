import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, DatePicker, EmptyState, Field, Input, Modal, Select, Table, Textarea, cn, useConfirm } from '../../ui';
import { useToast } from '../../../contexts/ToastContext';
import useCargaSuave from '../../../hooks/useCargaSuave';
import { numero, pesos } from './piezas';

export const CATEGORIAS = [
  { value: 'comida', label: 'Comida' },
  { value: 'bebida', label: 'Bebida' },
  { value: 'materiales', label: 'Materiales' },
  { value: 'casa', label: 'La casa' },
  { value: 'otros', label: 'Otros' },
];
const etiquetaCategoria = (c) => CATEGORIAS.find((x) => x.value === c)?.label ?? c;
const fechaCorta = (f) => new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
const titulo = (t) => (t ?? '').replace(/^\[[A-Z]\]\s*/, '');

const VACIO = { fecha: '', concepto: '', categoria: 'comida', monto: '', moneda: 'ARS', cantidad: '', unidad: '', actividadId: '', notas: '' };

/**
 * El formulario de un gasto, para cargar uno nuevo o editar uno existente.
 * La cantidad y la unidad son para lo que además se cuenta (botellas de
 * vino, kilos de carne): el Excel de hoy lo lleva aparte.
 */
const FormGasto = ({ abierto, gasto, actividades, onCerrar, onGuardado }) => {
  const { showSuccess, showError } = useToast();
  const [datos, setDatos] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setDatos(
      gasto
        ? {
            fecha: String(gasto.fecha).slice(0, 10),
            concepto: gasto.concepto ?? '',
            categoria: gasto.categoria ?? 'otros',
            monto: String(gasto.monto ?? ''),
            moneda: gasto.moneda ?? 'ARS',
            cantidad: gasto.cantidad != null ? String(gasto.cantidad) : '',
            unidad: gasto.unidad ?? '',
            actividadId: gasto.actividadId?._id ?? '',
            notas: gasto.notas ?? '',
          }
        : { ...VACIO, fecha: new Date().toISOString().slice(0, 10) }
    );
  }, [abierto, gasto]);

  const cambiar = (campo) => (valor) => setDatos((d) => ({ ...d, [campo]: valor?.target ? valor.target.value : valor ?? '' }));

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const cuerpo = { ...datos, actividadId: datos.actividadId || null, cantidad: datos.cantidad || null };
      if (gasto) await axios.put(`/gastos/${gasto._id}`, cuerpo);
      else await axios.post('/gastos', cuerpo);
      showSuccess(gasto ? 'Gasto actualizado' : 'Gasto cargado');
      onGuardado();
    } catch (error) {
      showError(error.response?.data?.message || 'No se pudo guardar el gasto');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      open={abierto}
      onClose={onCerrar}
      title={gasto ? 'Editar gasto' : 'Cargar gasto'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-gasto" loading={guardando}>
            {gasto ? 'Guardar cambios' : 'Cargar gasto'}
          </Button>
        </>
      }
    >
      <form id="form-gasto" onSubmit={guardar} className="grid gap-x-4 sm:grid-cols-2">
        <Field label="Concepto" htmlFor="gasto-concepto" className="sm:col-span-2">
          <Input id="gasto-concepto" value={datos.concepto} onChange={cambiar('concepto')} placeholder="Comida del Shabat, vino, arcilla…" required maxLength={120} />
        </Field>
        <Field label="Fecha" htmlFor="gasto-fecha">
          <DatePicker id="gasto-fecha" value={datos.fecha} onChange={cambiar('fecha')} />
        </Field>
        <Field label="Tipo" htmlFor="gasto-categoria">
          <Select id="gasto-categoria" options={CATEGORIAS} value={datos.categoria} onChange={cambiar('categoria')} />
        </Field>
        <Field label="Monto" htmlFor="gasto-monto">
          <Input id="gasto-monto" type="number" inputMode="decimal" min="0" step="any" value={datos.monto} onChange={cambiar('monto')} required />
        </Field>
        <Field label="Moneda" htmlFor="gasto-moneda">
          <Select
            id="gasto-moneda"
            options={[
              { value: 'ARS', label: 'Pesos' },
              { value: 'USD', label: 'Dólares' },
            ]}
            value={datos.moneda}
            onChange={cambiar('moneda')}
          />
        </Field>
        <Field label="Actividad" htmlFor="gasto-actividad" hint="Si es de un encuentro, así se calcula cuánto costó" className="sm:col-span-2">
          <Select
            id="gasto-actividad"
            options={actividades}
            value={datos.actividadId}
            onChange={cambiar('actividadId')}
            placeholder="Ninguna (gasto de la casa)"
            searchable
            clearable
          />
        </Field>
        <Field label="Cantidad" htmlFor="gasto-cantidad" hint="Opcional">
          <Input id="gasto-cantidad" type="number" inputMode="decimal" min="0" step="any" value={datos.cantidad} onChange={cambiar('cantidad')} />
        </Field>
        <Field label="Unidad" htmlFor="gasto-unidad" hint="Botellas, kilos…">
          <Input id="gasto-unidad" value={datos.unidad} onChange={cambiar('unidad')} maxLength={40} />
        </Field>
        <Field label="Notas" htmlFor="gasto-notas" className="sm:col-span-2">
          <Textarea id="gasto-notas" value={datos.notas} onChange={cambiar('notas')} rows={3} maxLength={1000} />
        </Field>
      </form>
    </Modal>
  );
};

/**
 * Los gastos del período: la lista con sus filtros, y cargar, editar y
 * borrar. Es lo que alimenta la cobertura y el costo de cada encuentro.
 */
const VistaGastos = ({ desde, hasta, categorias, onCategorias, onCambio }) => {
  const confirmar = useConfirm();
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState({ abierto: false, gasto: null });
  const [actividades, setActividades] = useState([]);

  const { datos, cargando, actualizando, error, recargar } = useCargaSuave(
    (signal) =>
      axios
        .get('/gastos', { params: { from: desde, to: hasta, categoria: categorias.join(',') || undefined }, signal })
        .then((r) => r.data.gastos),
    `${desde}|${hasta}|${categorias.join(',')}`
  );

  useEffect(() => {
    axios
      .get('/activities')
      .then((r) => {
        const lista = r.data.activities ?? r.data ?? [];
        setActividades(
          lista
            .filter((a) => a.estado !== 'eliminada')
            .map((a) => ({ value: a._id, label: titulo(a.titulo) }))
            .sort((a, b) => a.label.localeCompare(b.label))
        );
      })
      .catch(() => setActividades([]));
  }, []);

  const guardado = () => {
    setForm({ abierto: false, gasto: null });
    recargar();
    onCambio();
  };

  const borrar = async (gasto) => {
    const ok = await confirmar({
      title: `¿Borrar «${gasto.concepto}»?`,
      description: `${pesos(gasto.monto)} del ${fechaCorta(gasto.fecha)}. Deja de contar en las métricas.`,
      confirmLabel: 'Borrar gasto',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await axios.delete(`/gastos/${gasto._id}`);
      showSuccess('Gasto borrado');
      recargar();
      onCambio();
    } catch (err) {
      showError(err.response?.data?.message || 'No se pudo borrar el gasto');
    }
  };

  const lista = datos ?? [];
  const total = lista.filter((g) => g.moneda === 'ARS').reduce((t, g) => t + g.monto, 0);
  const alternar = (c) => onCategorias(categorias.includes(c) ? categorias.filter((x) => x !== c) : [...categorias, c]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo">
          {CATEGORIAS.map((c) => {
            const activa = categorias.includes(c.value);
            return (
              <button
                key={c.value}
                type="button"
                aria-pressed={activa}
                onClick={() => alternar(c.value)}
                className={cn(
                  'min-h-[36px] rounded-pill border px-3.5 text-sm font-medium transition-colors duration-base',
                  activa ? 'border-ink bg-ink text-surface' : 'border-surface-border bg-surface text-ink-soft hover:border-ink/30 hover:text-ink'
                )}
              >
                {c.label}
              </button>
            );
          })}
          {categorias.length > 0 && (
            <Button variant="link" size="sm" onClick={() => onCategorias([])}>
              Sacar filtros
            </Button>
          )}
        </div>
        <Button icon="add" onClick={() => setForm({ abierto: true, gasto: null })}>
          Cargar gasto
        </Button>
      </div>

      {error && <p className="text-sm text-danger-600">No se pudieron traer los gastos.</p>}

      <div className={cn('transition-opacity duration-base', actualizando && 'opacity-50')}>
        {cargando ? (
          <div className="h-64 animate-pulse rounded-card bg-surface-sunken" />
        ) : (
          <>
            <Table
              stacked
              rows={lista}
              empty={
                <EmptyState
                  icon="payment"
                  title="No hay gastos en este período"
                  description="Cargá lo que se gasta en cada encuentro para ver cuánto cuesta y cuánto se cubre."
                  action={
                    <Button icon="add" onClick={() => setForm({ abierto: true, gasto: null })}>
                      Cargar gasto
                    </Button>
                  }
                />
              }
              columns={[
                { key: 'fecha', header: 'Fecha', render: (g) => <span className="tabular-nums">{fechaCorta(g.fecha)}</span> },
                {
                  key: 'concepto',
                  header: 'Concepto',
                  render: (g) => (
                    <span className="min-w-0">
                      <span className="block font-medium text-ink">{g.concepto}</span>
                      {g.actividadId?.titulo && <span className="block text-xs text-ink-muted">{titulo(g.actividadId.titulo)}</span>}
                    </span>
                  ),
                },
                { key: 'categoria', header: 'Tipo', render: (g) => etiquetaCategoria(g.categoria) },
                {
                  key: 'cantidad',
                  header: 'Cantidad',
                  align: 'right',
                  render: (g) => (g.cantidad != null ? `${numero(g.cantidad)} ${g.unidad ?? ''}`.trim() : '—'),
                },
                {
                  key: 'monto',
                  header: 'Monto',
                  align: 'right',
                  render: (g) => <span className="font-semibold tabular-nums text-ink">{g.moneda === 'USD' ? `US$ ${numero(g.monto)}` : pesos(g.monto)}</span>,
                },
                {
                  key: 'acciones',
                  header: <span className="sr-only">Acciones</span>,
                  align: 'right',
                  render: (g) => (
                    <span className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" icon="edit" iconOnly label={`Editar ${g.concepto}`} onClick={() => setForm({ abierto: true, gasto: g })} />
                      <Button variant="ghost" size="sm" icon="delete" iconOnly label={`Borrar ${g.concepto}`} onClick={() => borrar(g)} />
                    </span>
                  ),
                },
              ]}
            />
            {lista.length > 0 && (
              <p className="mt-3 text-right text-sm text-ink-muted">
                {numero(lista.length)} gastos · total en pesos <span className="font-semibold tabular-nums text-ink">{pesos(total)}</span>
              </p>
            )}
          </>
        )}
      </div>

      <FormGasto
        abierto={form.abierto}
        gasto={form.gasto}
        actividades={actividades}
        onCerrar={() => setForm({ abierto: false, gasto: null })}
        onGuardado={guardado}
      />
    </div>
  );
};

export default VistaGastos;
