import { Avatares, BarraCupo, Button, Icon, IconoColor, cn } from '../../ui';
import { formatActivityPrice } from '../../../utils/priceUtils';

const TIPOS = { recurrente: 'Recurrente', viaje: 'Viaje', unica: 'Única' };

/**
 * Todo de una actividad sin dejar la lista: cuántos vienen al próximo
 * encuentro, quiénes, y las acciones. En pantallas anchas va al costado; en
 * el teléfono, adentro de la hoja que sube desde abajo (`enHoja`), donde el
 * título ya lo pone la hoja.
 */
const DetalleActividad = ({ actividad: a, color, icono, enHoja = false, onCerrar, acciones, ocupado }) => {
  const p = a.proximo;
  const eliminada = a.estado === 'eliminada';
  return (
    <div className={cn(!enHoja && 'overflow-hidden rounded-[22px] border border-surface-border bg-surface shadow-raised')}>
      {!enHoja && (
        <div
          className="relative h-24"
          style={{
            background: `linear-gradient(135deg, ${color}26, ${color}0d)`,
          }}
        >
          <span className="absolute bottom-0 start-6 translate-y-1/2 rounded-[16px] bg-surface">
            <IconoColor icono={icono} color={color} tamano="lg" />
          </span>
          {onCerrar && (
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar detalle"
              className="absolute end-3 top-3 flex h-9 w-9 items-center justify-center rounded-pill bg-surface/80 text-ink-soft transition-colors duration-base hover:bg-surface"
            >
              <Icon name="close" size="sm" />
            </button>
          )}
        </div>
      )}
      <div className={cn(!enHoja && 'px-6 pb-6 pt-10')}>
        {!enHoja && (
          <>
            <h2 className="font-grotesk text-xl font-semibold tracking-tight text-ink">{a.titulo}</h2>
            <p className="mt-1 text-sm text-ink-muted">{a.cuando}</p>
          </>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
          <span className="font-semibold tabular-nums text-ink">{formatActivityPrice(a)}</span>
          <span aria-hidden className="text-ink-faint">
            ·
          </span>
          <span>{TIPOS[a.tipo] ?? a.tipo}</span>
          {a.lugar && (
            <span className="flex min-w-0 items-center gap-1">
              <Icon name="location" size="xs" className="shrink-0 text-ink-faint" />
              <span className="truncate">{a.lugar}</span>
            </span>
          )}
        </div>

        {p ? (
          <>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {[
                ['Anotados', p.aceptadas],
                ['En espera', p.enEspera],
                ['Por aprobar', p.pendientes],
              ].map(([t, v]) => (
                <div key={t} className="rounded-[14px] bg-surface-sunken px-2 py-3">
                  <p className="font-grotesk text-2xl font-semibold tabular-nums text-ink">{v}</p>
                  <p className="text-xs text-ink-muted">{t}</p>
                </div>
              ))}
            </div>
            <div className="mt-5">
              <p className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-xs font-semibold uppercase tracking-label text-ink-faint">Próximo encuentro</span>
                <span className="text-sm font-medium text-ink">
                  {p.texto.charAt(0).toUpperCase() + p.texto.slice(1)}
                  {p.hora ? ` · ${p.hora}` : ''}
                </span>
              </p>
              <BarraCupo inscriptos={p.aceptadas} cupo={a.cupo} ancho="w-full" />
              {p.nombres.length > 0 && (
                <div className="mt-3">
                  <Avatares nombres={p.nombres} total={p.aceptadas} max={7} />
                </div>
              )}
              {p.comprobantes > 0 && (
                <p className="mt-3 flex items-center gap-1.5 text-sm text-info-700">
                  <Icon name="payment" size="xs" />
                  {p.comprobantes === 1 ? '1 comprobante para revisar' : `${p.comprobantes} comprobantes para revisar`}
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="mt-5 rounded-[14px] bg-surface-sunken px-4 py-3 text-sm text-ink-muted">No tiene encuentros por delante.</p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button icon="users" className="col-span-2" onClick={acciones.verInscriptos}>
            Ver inscriptos
          </Button>
          <Button variant="soft" size="sm" icon="check" onClick={acciones.asistencia}>
            Asistencia
          </Button>
          <Button variant="soft" size="sm" icon="download" onClick={acciones.exportar}>
            Exportar
          </Button>
          <Button variant="soft" size="sm" icon="copy" onClick={acciones.duplicar} loading={ocupado === 'duplicar'}>
            Duplicar
          </Button>
          <Button variant="soft" size="sm" icon="edit" onClick={acciones.editar}>
            Editar
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-surface-border pt-3">
          {a.estado === 'publicada' ? (
            <Button variant="ghost" size="sm" icon="external" onClick={acciones.copiarLink}>
              Copiar link
            </Button>
          ) : (
            <span />
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={eliminada ? 'check' : 'delete'}
            onClick={acciones.eliminar}
            className={eliminada ? 'hover:bg-success-50 hover:text-success-700' : 'hover:bg-danger-50 hover:text-danger-600'}
          >
            {eliminada ? 'Volver a activar' : 'Eliminar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DetalleActividad;
