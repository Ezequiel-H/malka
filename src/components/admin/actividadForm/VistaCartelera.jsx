import { DateTime } from 'luxon';
import { BarraCupo, IconoColor } from '../../ui';
import { DEFAULT_PUBLIC_TAG_COLOR, publicTagColor, publicTagIcon } from '../../../utils/tagFields';
import { formatPrice } from '../../../utils/priceUtils';

const PLURAL = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'];

const lista = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs.at(-1)}`);
const dia = (iso) => (iso ? DateTime.fromISO(iso).setLocale('es').toFormat('ccc d LLL') : null);

/** Cuándo es, como lo lee la gente en la cartelera. */
export const cuandoTexto = (f) => {
  const hora = f.tipo === 'recurrente' ? f.recurrence?.hora || f.hora : f.hora;
  const conHora = (t) => (hora ? `${t} · ${hora}` : t);
  if (f.tipo === 'viaje') {
    if (!f.fecha) return 'Elegí las fechas del viaje';
    const desde = DateTime.fromISO(f.fecha).setLocale('es');
    if (!f.fechaFin) return `Desde el ${desde.toFormat("d 'de' LLL")}`;
    const hasta = DateTime.fromISO(f.fechaFin).setLocale('es');
    return `Del ${desde.toFormat(desde.month === hasta.month ? 'd' : "d 'de' LLL")} al ${hasta.toFormat("d 'de' LLL")}`;
  }
  if (f.tipo === 'recurrente') {
    const r = f.recurrence ?? {};
    if (r.frequency === 'monthly') {
      const ds = [...(Array.isArray(r.dayOfMonth) ? r.dayOfMonth : [])].sort((a, b) => a - b);
      return ds.length ? conHora(`Los días ${lista(ds.map(String))} de cada mes`) : 'Elegí los días del mes';
    }
    const ds = [...(r.daysOfWeek ?? [])].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
    return ds.length ? conHora(`Todos los ${lista(ds.map((d) => PLURAL[d]))}`) : 'Elegí los días';
  }
  return f.fecha ? conHora(dia(f.fecha)) : 'Elegí el día';
};

/**
 * La tarjeta de la actividad como la ve la gente, armada con lo que se está
 * escribiendo: cambia en el momento.
 */
const VistaCartelera = ({ form, catalogo }) => {
  const tag = form.tags?.[0];
  const color = tag ? publicTagColor(catalogo, tag) : DEFAULT_PUBLIC_TAG_COLOR;
  const icono = (tag && publicTagIcon(catalogo, tag)) || 'activity';
  const cupo = Number(form.cupo) || null;
  return (
    <article className="overflow-hidden rounded-[22px] border border-surface-border bg-surface">
      <div className="flex h-28 items-end p-4 transition-colors duration-slow" style={{ background: `${color}24` }}>
        <IconoColor icono={icono} color={color} tamano="lg" />
      </div>
      <div className="p-5">
        {form.estado === 'borrador' && <span className="mb-2 inline-block rounded-pill bg-ink/[0.06] px-2 py-0.5 text-[0.7rem] font-medium text-ink-muted">Borrador: todavía no se ve</span>}
        <h3 className="break-words font-grotesk text-xl font-semibold text-ink">{form.titulo?.trim() || 'Sin nombre'}</h3>
        <p className="text-sm first-letter:uppercase text-ink-muted">{cuandoTexto(form)}</p>
        {form.descripcion?.trim() && <p className="mt-2 line-clamp-3 text-sm text-ink-soft">{form.descripcion}</p>}
        {form.tags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {form.tags.map((t) => (
              <span key={t} className="rounded-pill px-2 py-0.5 text-xs font-semibold" style={{ background: `${publicTagColor(catalogo, t)}1f`, color: publicTagColor(catalogo, t) }}>
                {t}
              </span>
            ))}
          </div>
        )}
        <div className="mt-4 flex items-center justify-between gap-3">
          <BarraCupo inscriptos={0} cupo={cupo} textoSinCupo="Sin cupo" />
          <span className="shrink-0 font-grotesk font-semibold text-ink">{form.esGratuita ? 'Gratis' : formatPrice(form.precio, form.moneda)}</span>
        </div>
        <span className="mt-4 flex min-h-[40px] items-center justify-center rounded-pill bg-ink text-sm font-semibold text-surface">Anotarme</span>
      </div>
    </article>
  );
};

export default VistaCartelera;
