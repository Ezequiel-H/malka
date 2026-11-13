import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, DatePicker, Field, Input, Modal, Select, Textarea } from '../../ui';
import { useToast } from '../../../contexts/ToastContext';
import { Segmentado } from '../metricas/piezas';
import BuscarPersona from './BuscarPersona';

const hoyIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const titulo = (t) => (t ?? '').replace(/^\[[A-Z]\]\s*/, '');

export const CATEGORIAS_EVENTO = ['Espiritual', 'Cultura', 'Instituciones', 'Ieshiva', 'Shiurim'];

/**
 * Sumar (o editar) una visita al historial: quién vino y a qué. «A qué» es
 * una actividad de la app con su fecha, o un evento con nombre propio
 * (lo que antes iba a la planilla). Con `fijo` viene ya armado desde una
 * actividad: sólo falta elegir a la persona (alguien que vino sin anotarse).
 */
const FormVisita = ({ abierto, visita, fijo, onCerrar, onGuardada }) => {
  const { showSuccess, showError } = useToast();
  const [persona, setPersona] = useState(null);
  const [que, setQue] = useState('actividad');
  const [datos, setDatos] = useState({ actividadId: '', evento: '', fecha: hoyIso(), categoria: '', subcategoria: '', notas: '' });
  const [actividades, setActividades] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const hayFijo = Boolean(fijo);
  const fijoActividad = fijo?.actividadId;
  const fijoFecha = fijo?.fecha;

  useEffect(() => {
    if (!abierto) return;
    if (visita) {
      setPersona(visita.persona);
      setQue(visita.encuentro.actividadId ? 'actividad' : 'evento');
      setDatos({
        actividadId: visita.encuentro.actividadId ?? '',
        evento: visita.encuentro.evento ?? '',
        fecha: String(visita.fecha).slice(0, 10),
        categoria: visita.categoria ?? '',
        subcategoria: visita.subcategoria ?? '',
        notas: visita.notas ?? '',
      });
    } else {
      setPersona(null);
      setQue(hayFijo ? 'actividad' : 'evento');
      setDatos({ actividadId: fijoActividad ?? '', evento: '', fecha: fijoFecha ?? hoyIso(), categoria: '', subcategoria: '', notas: '' });
    }
    // Depende de los valores de `fijo` y no del objeto, que se arma en cada render.
  }, [abierto, visita, hayFijo, fijoActividad, fijoFecha]);

  useEffect(() => {
    if (!abierto || hayFijo) return;
    axios
      .get('/activities')
      .then((r) =>
        setActividades(
          (r.data.activities ?? [])
            .filter((a) => a.estado !== 'eliminada')
            .map((a) => ({ value: a._id, label: titulo(a.titulo) }))
            .sort((a, b) => a.label.localeCompare(b.label))
        )
      )
      .catch(() => setActividades([]));
  }, [abierto, hayFijo]);

  const cambiar = (campo) => (v) => setDatos((d) => ({ ...d, [campo]: v?.target ? v.target.value : v ?? '' }));
  const completo = persona && datos.fecha && (que === 'actividad' ? datos.actividadId : datos.evento.trim());

  const guardar = async () => {
    if (!completo) return;
    setGuardando(true);
    const cuerpo = {
      persona: { tipo: persona.tipo, id: persona.id },
      fecha: datos.fecha,
      ...(que === 'actividad' ? { actividadId: datos.actividadId } : { evento: datos.evento.trim(), actividadId: null }),
      categoria: que === 'evento' ? datos.categoria : undefined,
      subcategoria: que === 'evento' ? datos.subcategoria : undefined,
      notas: datos.notas,
      origen: fijo || que === 'actividad' ? 'sin_anotarse' : 'manual',
    };
    try {
      if (visita) await axios.put(`/historial/${visita.id}`, cuerpo);
      else await axios.post('/historial', cuerpo);
      showSuccess(visita ? 'Visita actualizada' : fijo ? `${persona.nombre} quedó registrada` : 'Visita cargada');
      onGuardada();
    } catch (error) {
      showError(error.response?.data?.message || 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      open={abierto}
      onClose={onCerrar}
      size="lg"
      title={visita ? 'Editar visita' : fijo ? 'Vino sin anotarse' : 'Sumar al historial'}
      description={fijo ? `Queda registrado que vino a ${fijo.titulo} sin inscribirse.` : 'Quién vino y a qué. Se suma a las métricas.'}
      footer={
        <>
          <Button variant="secondary" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button icon="check" loading={guardando} disabled={!completo} onClick={guardar}>
            {visita ? 'Guardar cambios' : 'Sumar'}
          </Button>
        </>
      }
    >
      <Field label="Quién vino" required className="mb-5">
        <BuscarPersona elegida={persona} onElegir={setPersona} origenContacto={fijo ? 'sin_anotarse' : 'manual'} autoFocus={!visita} />
      </Field>

      {!fijo && (
        <Segmentado
          opciones={[
            { valor: 'evento', etiqueta: 'Un evento' },
            { valor: 'actividad', etiqueta: 'Una actividad de la app' },
          ]}
          valor={que}
          onChange={setQue}
          etiqueta="A qué vino"
          className="mb-4"
        />
      )}

      <div key={que} className="grid animate-fade-in gap-x-4 sm:grid-cols-2">
        {!fijo && que === 'actividad' && (
          <Field label="Actividad" htmlFor="visita-actividad" required className="sm:col-span-2">
            <Select id="visita-actividad" options={actividades} value={datos.actividadId} onChange={cambiar('actividadId')} searchable placeholder="Elegí la actividad" />
          </Field>
        )}
        {que === 'evento' && (
          <Field label="Evento" htmlFor="visita-evento" required hint="Por ejemplo, Kabbalat Shabbat o Fiesta Purim" className="sm:col-span-2">
            <Input id="visita-evento" value={datos.evento} onChange={cambiar('evento')} maxLength={160} />
          </Field>
        )}
        <Field label="Fecha" htmlFor="visita-fecha" required>
          <DatePicker id="visita-fecha" value={datos.fecha} onChange={cambiar('fecha')} max={hoyIso()} />
        </Field>
        {que === 'evento' && (
          <>
            <Field label="Categoría" htmlFor="visita-categoria">
              <Select
                id="visita-categoria"
                options={CATEGORIAS_EVENTO.map((c) => ({ value: c, label: c }))}
                value={datos.categoria}
                onChange={cambiar('categoria')}
                placeholder="Sin categoría"
                clearable
              />
            </Field>
            <Field label="Subcategoría" htmlFor="visita-subcategoria" hint="Opcional: Shabbat, Iamim Noraim…">
              <Input id="visita-subcategoria" value={datos.subcategoria} onChange={cambiar('subcategoria')} maxLength={60} />
            </Field>
          </>
        )}
        <Field label="Notas" htmlFor="visita-notas" className="sm:col-span-2">
          <Textarea id="visita-notas" value={datos.notas} onChange={cambiar('notas')} rows={2} maxLength={1000} />
        </Field>
      </div>
    </Modal>
  );
};

export default FormVisita;
