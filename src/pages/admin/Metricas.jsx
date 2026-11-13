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
import VistaActividades from '../../components/admin/metricas/VistaActividades';

const VISTAS = [
  { valor: 'personas', etiqueta: 'Personas' },
  { valor: 'detalle', etiqueta: 'En detalle' },
  { valor: 'actividades', etiqueta: 'Actividades' },
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

const desdeIso = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/* El período anterior del mismo largo, pegado antes del elegido. */
const rangoAnterior = (desde, hasta) => {
  const inicio = desdeIso(desde);
  const dias = Math.round((desdeIso(hasta) - inicio) / 86400000) + 1;
  return {
    desde: iso(new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() - dias)),
    hasta: iso(new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() - 1)),
  };
};

/* Un mes entero ("2026-03"), recortado a hoy si es el mes en curso. */
const rangoDelMes = (mes) => {
  const [y, m] = mes.split('-').map(Number);
  const fin = new Date(y, m, 0);
  const hoy = new Date();
  return { desde: `${mes}-01`, hasta: iso(fin > hoy ? hoy : fin) };
};

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

  /* Con el período se pide también el anterior del mismo largo: es contra
     lo que se compara cada número («12 % más que el período anterior»). */
  const anterior = rangoAnterior(desde, hasta);
  const { datos, cargando, actualizando, error, recargar } = useCargaSuave(
    (signal) =>
      Promise.all([
        axios.get('/admin/metrics', { params: { from: desde, to: hasta }, signal }),
        axios.get('/admin/metrics', { params: { from: anterior.desde, to: anterior.hasta }, signal }).catch(() => null),
      ]).then(([actual, previo]) => ({ ...actual.data, anterior: previo?.data ?? null })),
    `${desde}|${hasta}`
  );

  /**
   * Lleva a «En detalle» con una pregunta ya armada: los filtros y, si hace
   * falta, otro período (p. ej. un mes puntual del gráfico).
   */
  const abrirDetalle = (filtros, rango) => {
    setParams(
      (actual) => {
        const n = new URLSearchParams();
        n.set('vista', 'detalle');
        const p = rango ? 'rango' : actual.get('periodo');
        if (p) n.set('periodo', p);
        if (rango) {
          n.set('desde', rango.desde);
          n.set('hasta', rango.hasta);
        } else if (p === 'rango') {
          n.set('desde', actual.get('desde'));
          n.set('hasta', actual.get('hasta'));
        }
        for (const [k, v] of Object.entries(filtros)) if (v?.length) n.set(`f_${k}`, v.join(','));
        // «En detalle» baja sola hasta el resultado cuando llegan los datos.
        n.set('ir', 'resultado');
        return n;
      },
      { replace: false }
    );
  };

  return (
    <PageContainer title="Métricas">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        {/* Cinco pestañas no entran en un teléfono: ahí es un desplegable. */}
        <Segmentado
          opciones={VISTAS}
          valor={vista}
          onChange={(v) => cambiar({ vista: v === 'personas' ? null : v })}
          etiqueta="Qué mirar"
          className="hidden sm:inline-flex"
        />
        <Field label="Qué mirar" htmlFor="metricas-vista" className="mb-0 sm:hidden">
          <Select
            id="metricas-vista"
            options={VISTAS.map((v) => ({ value: v.valor, label: v.etiqueta }))}
            value={vista}
            onChange={(v) => v && cambiar({ vista: v === 'personas' ? null : v })}
          />
        </Field>
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
        ) : vista === 'actividades' ? (
          <VistaActividades desde={desde} hasta={hasta} abrirDetalle={abrirDetalle} />
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
              <VistaPlata
                plata={datos.plata}
                anterior={datos.anterior?.plata}
                participantes={datos.personas.participantes}
                onMes={(mes) => cambiar({ vista: 'gastos', periodo: 'rango', ...rangoDelMes(mes) })}
                onTipo={(tipo) => cambiar({ vista: 'gastos', tipo: [tipo] })}
                onEvento={(actividad) => cambiar({ vista: 'actividades', actividad })}
              />
            ) : (
              <VistaPersonas personas={datos.personas} anterior={datos.anterior?.personas} abrirDetalle={abrirDetalle} />
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default Metricas;
