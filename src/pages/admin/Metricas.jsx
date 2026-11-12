import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import PageContainer from '../../components/layout/PageContainer';
import { Alert, Button, DatePicker, Field, Select, Skeleton, cn } from '../../components/ui';
import useCargaSuave from '../../hooks/useCargaSuave';
import { Segmentado } from '../../components/admin/metricas/piezas';
import VistaPersonas from '../../components/admin/metricas/VistaPersonas';
import VistaPlata from '../../components/admin/metricas/VistaPlata';
import VistaGastos from '../../components/admin/metricas/VistaGastos';
import VistaDetalle from '../../components/admin/metricas/VistaDetalle';

const VISTAS = [
  { valor: 'personas', etiqueta: 'Personas' },
  { valor: 'detalle', etiqueta: 'En detalle' },
  { valor: 'plata', etiqueta: 'Plata' },
  { valor: 'gastos', etiqueta: 'Gastos' },
];

const PERIODOS = [
  { valor: '7d', etiqueta: 'Última semana' },
  { valor: '30d', etiqueta: 'Último mes' },
  { valor: '60d', etiqueta: 'Últimos 60 días' },
  { valor: '90d', etiqueta: 'Últimos 90 días' },
  { valor: '6m', etiqueta: 'Medio año' },
  { valor: '12m', etiqueta: 'Último año' },
  { valor: 'anio', etiqueta: 'Este año' },
  { valor: 'rango', etiqueta: 'Personalizado' },
];

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/* El rango de cada período, siempre hasta hoy. Los de días cuentan días
   corridos; medio año y el último año arrancan el primer día del mes, así los
   meses del gráfico vienen enteros. */
const rangoDe = (periodo) => {
  const hoy = new Date();
  if (periodo === 'anio') return { desde: `${hoy.getFullYear()}-01-01`, hasta: iso(hoy) };
  const dias = { '7d': 7, '30d': 30, '60d': 60, '90d': 90 }[periodo];
  if (dias) return { desde: iso(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - (dias - 1))), hasta: iso(hoy) };
  const meses = periodo === '6m' ? 6 : 12;
  return { desde: iso(new Date(hoy.getFullYear(), hoy.getMonth() - (meses - 1), 1)), hasta: iso(hoy) };
};

/**
 * Las métricas del equipo: personas y comunidad, plata, y la carga de gastos
 * que alimenta la cobertura. Sólo para admin (la ruta y el back lo exigen).
 *
 * Todo lo elegido vive en la dirección (vista, período, fechas, filtros), así
 * se puede mandar el link a la comisión con la vista ya armada.
 */
const Metricas = () => {
  const [params, setParams] = useSearchParams();
  const vista = VISTAS.some((v) => v.valor === params.get('vista')) ? params.get('vista') : 'personas';
  const periodo = PERIODOS.some((p) => p.valor === params.get('periodo')) ? params.get('periodo') : '12m';
  const propio = periodo === 'rango' && params.get('desde') && params.get('hasta');
  const { desde, hasta } = propio ? { desde: params.get('desde'), hasta: params.get('hasta') } : rangoDe(periodo);
  const categorias = (params.get('tipo') ?? '').split(',').filter(Boolean);

  const cambiar = useCallback(
    (cambios) =>
      setParams(
        (actual) => {
          const nuevo = new URLSearchParams(actual);
          for (const [k, v] of Object.entries(cambios)) {
            if (v === null || v === '' || (Array.isArray(v) && !v.length)) nuevo.delete(k);
            else nuevo.set(k, Array.isArray(v) ? v.join(',') : v);
          }
          return nuevo;
        },
        { replace: true }
      ),
    [setParams]
  );

  const elegirPeriodo = (p) => {
    if (p === 'rango') cambiar({ periodo: p, desde, hasta });
    else cambiar({ periodo: p, desde: null, hasta: null });
  };

  const { datos, cargando, actualizando, error, recargar } = useCargaSuave(
    (signal) => axios.get('/admin/metrics', { params: { from: desde, to: hasta }, signal }).then((r) => r.data),
    `${desde}|${hasta}`
  );

  return (
    <PageContainer title="Métricas">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <Segmentado opciones={VISTAS} valor={vista} onChange={(v) => cambiar({ vista: v === 'personas' ? null : v })} etiqueta="Qué mirar" />
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end lg:justify-end">
          <Field label="Período" htmlFor="metricas-periodo" className="mb-0 sm:w-52">
            <Select
              id="metricas-periodo"
              options={PERIODOS.map((p) => ({ value: p.valor, label: p.etiqueta }))}
              value={periodo}
              onChange={elegirPeriodo}
            />
          </Field>
          {periodo === 'rango' && (
            <div className="flex animate-fade-in-up gap-3 [&>*]:min-w-0 [&>*]:flex-1 sm:[&>*]:flex-none">
              <Field label="Desde" htmlFor="metricas-desde" className="mb-0 w-40">
                <DatePicker id="metricas-desde" value={desde} max={hasta} onChange={(v) => v && cambiar({ desde: v })} />
              </Field>
              <Field label="Hasta" htmlFor="metricas-hasta" className="mb-0 w-40">
                <DatePicker id="metricas-hasta" value={hasta} min={desde} onChange={(v) => v && cambiar({ hasta: v })} />
              </Field>
            </div>
          )}
        </div>
      </div>

      {error && (vista === 'personas' || vista === 'plata') && (
        <Alert tone="danger" className="mb-6">
          {error.response?.data?.message || 'No se pudieron calcular las métricas.'}{' '}
          <Button variant="link" size="sm" onClick={recargar}>
            Probar de nuevo
          </Button>
        </Alert>
      )}

      {/* Cambiar de pestaña cruza con un fundido; cambiar el período deja los
          números anteriores atenuados hasta que llegan los nuevos. */}
      <div key={vista} className="animate-fade-in">
        {vista === 'detalle' ? (
          <VistaDetalle desde={desde} hasta={hasta} />
        ) : vista === 'gastos' ? (
          <VistaGastos
            desde={desde}
            hasta={hasta}
            categorias={categorias}
            onCategorias={(c) => cambiar({ tipo: c })}
            onCambio={recargar}
          />
        ) : cargando || !datos ? (
          !error && (
            <div className="space-y-6" aria-busy="true" aria-label="Calculando las métricas">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-card" />
                ))}
              </div>
              <Skeleton className="h-96 rounded-card" />
            </div>
          )
        ) : (
          <div className={cn('transition-opacity duration-base', actualizando && 'pointer-events-none opacity-50')}>
            {vista === 'plata' ? (
              <VistaPlata plata={datos.plata} participantes={datos.personas.participantes} />
            ) : (
              <VistaPersonas personas={datos.personas} />
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default Metricas;
