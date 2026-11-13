import { useSearchParams } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import { Segmentado } from '../../../components/admin/metricas/piezas';
import { AvisoMaqueta } from './piezas';
import MaquetaPanel from './MaquetaPanel';
import MaquetaActividades from './MaquetaActividades';
import MaquetaExportar from './MaquetaExportar';
import { MaquetaAjustes, MaquetaNuevaActividad, MaquetaPersonas } from './MaquetasAdmin';
import { MaquetaDetalle, MaquetaInicio, MaquetaMisInscripciones, MaquetaPerfil } from './MaquetasParticipante';

const PANTALLAS = [
  {
    valor: 'panel',
    etiqueta: 'Panel',
    aviso: 'Arranca por lo que hay para hacer, con la acción a un toque. Los números van en una franja y la semana se ve como calendario.',
  },
  {
    valor: 'actividades',
    etiqueta: 'Actividades',
    aviso: 'Una fila por actividad que se lee sin abrirla: propuesta, cuándo, cupo y quiénes vienen. El detalle se abre al costado. Probá la vista «Semana» y los filtros por propuesta.',
  },
  {
    valor: 'exportar',
    etiqueta: 'Exportar',
    aviso: 'Se elige para qué es y eso arma las columnas. La vista previa cambia en vivo. Probá arrastrar las columnas, sacar y sumar, y los formatos.',
  },
  {
    valor: 'personas',
    etiqueta: 'Personas',
    aviso:
      'Las altas por aprobar quedan juntas arriba y se aprueban de un toque. Cada fila dice cómo viene la persona (frecuente, nueva, se aleja) y cuánto vino. La ficha se abre al costado con WhatsApp a mano.',
    Pantalla: MaquetaPersonas,
  },
  {
    valor: 'nueva',
    etiqueta: 'Nueva actividad',
    aviso: 'El formulario va por partes (qué, cuándo, lugares y precio) y al costado se ve cómo va a quedar en la cartelera mientras se escribe. Se guarda solo como borrador.',
    Pantalla: MaquetaNuevaActividad,
  },
  {
    valor: 'ajustes',
    etiqueta: 'Ajustes',
    aviso: 'Un índice a la izquierda y cada ajuste se guarda solo. Los mensajes de WhatsApp se arman tocando los datos y se ven como le llegan al centro.',
    Pantalla: MaquetaAjustes,
  },
];

/* Lo que ve una persona que participa: pensado para el celular. */
const PARTICIPANTE = [
  {
    valor: 'p-inicio',
    etiqueta: 'Inicio',
    aviso: 'Lo primero es su próxima actividad con «Cómo llegar» y «Calendario». Abajo, la semana por día y lo que le puede gustar según sus intereses. Tocá los días.',
    Pantalla: MaquetaInicio,
  },
  {
    valor: 'p-detalle',
    etiqueta: 'Una actividad',
    aviso: 'Se anota en un paso: elige el día y toca el botón de abajo, al alcance del pulgar. Ve cuántos lugares quedan y quiénes van. Probá anotarte.',
    Pantalla: MaquetaDetalle,
  },
  {
    valor: 'p-mias',
    etiqueta: 'Mis cosas',
    aviso: 'Cuántas veces vino este año, lo próximo como una línea de tiempo con su estado (y el botón para subir el comprobante si falta) y lo que ya hizo.',
    Pantalla: MaquetaMisInscripciones,
  },
  {
    valor: 'p-perfil',
    etiqueta: 'Perfil',
    aviso: 'En vez de un formulario largo: sus datos como una lista que se toca para cambiar (probá el teléfono), y los intereses y la comida como chips. Se guarda solo.',
    Pantalla: MaquetaPerfil,
  },
];

/**
 * Las maquetas del rediseño de la plataforma, para aprobar antes de pasar
 * cada pantalla al nuevo idioma visual. Datos inventados.
 */
const Maquetas = () => {
  const [params, setParams] = useSearchParams();
  const quien = params.get('quien') === 'participante' ? 'participante' : 'equipo';
  const lista = quien === 'participante' ? PARTICIPANTE : PANTALLAS;
  const pantalla = lista.find((p) => p.valor === params.get('pantalla')) ?? lista[0];
  const Pantalla = pantalla.Pantalla;
  return (
    <PageContainer title="Maquetas del rediseño">
      <div className="mb-5 flex flex-col gap-3">
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <Segmentado
            opciones={[
              { valor: 'equipo', etiqueta: 'Lo que ve el equipo' },
              { valor: 'participante', etiqueta: 'Lo que ve quien participa' },
            ]}
            valor={quien}
            onChange={(v) => setParams({ quien: v }, { replace: true })}
            etiqueta="De quién"
          />
        </div>
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <Segmentado opciones={lista} valor={pantalla.valor} onChange={(v) => setParams({ quien, pantalla: v }, { replace: true })} etiqueta="Qué maqueta ver" />
        </div>
      </div>
      <div key={pantalla.valor} className="animate-fade-in">
        <AvisoMaqueta>Maqueta con datos inventados. {pantalla.aviso}</AvisoMaqueta>
        {pantalla.valor === 'panel' && <MaquetaPanel />}
        {pantalla.valor === 'actividades' && <MaquetaActividades />}
        {pantalla.valor === 'exportar' && <MaquetaExportar />}
        {Pantalla && <Pantalla />}
      </div>
    </PageContainer>
  );
};

export default Maquetas;
