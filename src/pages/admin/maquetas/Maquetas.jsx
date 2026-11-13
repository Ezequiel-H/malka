import { useSearchParams } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import { Segmentado } from '../../../components/admin/metricas/piezas';
import { AvisoMaqueta } from './piezas';
import MaquetaPanel from './MaquetaPanel';
import MaquetaActividades from './MaquetaActividades';
import MaquetaExportar from './MaquetaExportar';

const PANTALLAS = [
  { valor: 'panel', etiqueta: 'Panel', aviso: 'Arranca por lo que hay para hacer, con la acción a un toque. Los números van en una franja y la semana se ve como calendario.' },
  { valor: 'actividades', etiqueta: 'Actividades', aviso: 'Una fila por actividad que se lee sin abrirla: propuesta, cuándo, cupo y quiénes vienen. El detalle se abre al costado. Probá la vista «Semana» y los filtros por propuesta.' },
  { valor: 'exportar', etiqueta: 'Exportar', aviso: 'Se elige para qué es y eso arma las columnas. La vista previa cambia en vivo. Probá arrastrar las columnas, sacar y sumar, y los formatos.' },
];

/**
 * Las maquetas del rediseño de la plataforma, para aprobar antes de pasar
 * cada pantalla al nuevo idioma visual. Datos inventados.
 */
const Maquetas = () => {
  const [params, setParams] = useSearchParams();
  const pantalla = PANTALLAS.find((p) => p.valor === params.get('pantalla')) ?? PANTALLAS[0];
  return (
    <PageContainer title="Maquetas del rediseño">
      <div className="mb-5">
        <Segmentado
          opciones={PANTALLAS}
          valor={pantalla.valor}
          onChange={(v) => setParams({ pantalla: v }, { replace: true })}
          etiqueta="Qué maqueta ver"
        />
      </div>
      <div key={pantalla.valor} className="animate-fade-in">
        <AvisoMaqueta>Maqueta con datos inventados. {pantalla.aviso}</AvisoMaqueta>
        {pantalla.valor === 'panel' && <MaquetaPanel />}
        {pantalla.valor === 'actividades' && <MaquetaActividades />}
        {pantalla.valor === 'exportar' && <MaquetaExportar />}
      </div>
    </PageContainer>
  );
};

export default Maquetas;
