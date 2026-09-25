import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Alert, Badge, Card, Icon } from '../ui';
import { formatUtcCalendarDateEsAR } from '../../utils/dateUtils';

/**
 * Los cumpleaños de esta semana y la que viene, en el panel.
 *
 * La ventana y las agrupaciones las decide el backend (GET /api/admin/birthdays),
 * que es quien sabe qué hora es en Argentina. Acá sólo se dibuja: si el corte de
 * semana se calculara también en el navegador, un admin viajando lo vería
 * distinto.
 *
 * Quien cumple hoy va aparte y arriba. Es el único caso donde el dato caduca
 * en el día: mañana ya no sirve.
 */

// El día y el mes salen del string, sin Intl: 'YYYY-MM-DD' es un día
// calendario, no un instante, y es-AR con day:'2-digit' igual devuelve "1/10"
// sin el cero, que rompe la columna alineada.
const diaYMes = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

// Para el día de la semana sí conviene Intl, y va en UTC a propósito: leído en
// hora local, el 01/10 se anunciaría como el miércoles 30/09.
const diaDeLaSemana = (iso) => formatUtcCalendarDateEsAR(iso, { weekday: 'long' });

const cuandoEs = (diasFaltan) => {
  if (diasFaltan === 0) return 'hoy';
  if (diasFaltan === 1) return 'mañana';
  return `en ${diasFaltan} días`;
};

/**
 * Una fila. La de hoy usa la misma grilla que las demás —fecha, nombre, edad—
 * y se distingue por el fondo, el ícono y el peso, no por una caja aparte: si
 * se saliera de la grilla, la columna de fechas dejaría de leerse de un saque.
 */
const Fila = ({ persona, destacado = false }) => (
  <li
    className={
      destacado
        ? 'flex items-center gap-3 rounded-card border border-primary-200 bg-primary-50/70 px-3 py-3'
        : 'flex items-center gap-3 px-3 py-2.5'
    }
  >
    <div className="w-24 shrink-0">
      <p
        className={`text-sm tabular-nums ${destacado ? 'font-bold text-primary-700' : 'font-semibold text-ink'}`}
      >
        {diaYMes(persona.fecha)}
      </p>
      <p className={`text-xs capitalize ${destacado ? 'text-primary-600' : 'text-ink-faint'}`}>
        {destacado ? 'hoy' : diaDeLaSemana(persona.fecha)}
      </p>
    </div>

    {destacado && <Icon name="gift" size="sm" className="shrink-0 text-primary" />}

    {destacado ? (
      /* En el teléfono la chapa baja de línea en vez de comerse el nombre:
         "Ana ..." con la edad al lado no sirve para saludar a nadie. */
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
        <Link
          to={`/admin/users/${persona._id}`}
          className="min-w-0 text-base font-semibold text-ink hover:text-primary hover:underline"
        >
          {persona.nombre} {persona.apellido}
        </Link>
        <Badge tone="success" size="sm">
          Cumple {persona.edad} hoy
        </Badge>
        {persona.veintinueveDeFebrero && (
          <span className="text-xs text-ink-faint">nació un 29/02</span>
        )}
      </div>
    ) : (
      <>
        <Link
          to={`/admin/users/${persona._id}`}
          className="min-w-0 flex-1 truncate text-sm font-medium text-ink hover:text-primary hover:underline"
        >
          {persona.nombre} {persona.apellido}
        </Link>

        {persona.veintinueveDeFebrero && (
          <span className="hidden shrink-0 text-xs text-ink-faint sm:inline">nació un 29/02</span>
        )}

        <span className="shrink-0 text-xs tabular-nums text-ink-muted">
          cumple {persona.edad}
        </span>

        {/* En el teléfono no entra, y es lo más prescindible: la fecha y el
            día de la semana ya están en la primera columna. */}
        <span className="hidden w-20 shrink-0 text-right text-xs text-ink-faint sm:block">
          {cuandoEs(persona.diasFaltan)}
        </span>
      </>
    )}
  </li>
);

const Grupo = ({ titulo, personas }) => {
  if (!personas.length) return null;
  return (
    <div className="mt-4 first:mt-0">
      <h3 className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {titulo}
      </h3>
      <ul className="divide-y divide-surface-border">
        {personas.map((persona) => (
          <Fila key={persona._id} persona={persona} />
        ))}
      </ul>
    </div>
  );
};

const UpcomingBirthdays = ({ className = '' }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/admin/birthdays');
      // Se normaliza acá: si la respuesta viniera incompleta, un `.length`
      // sobre undefined tiraría abajo todo el panel, no sólo este bloque.
      const d = res.data ?? {};
      setData({
        hoy: Array.isArray(d.hoy) ? d.hoy : [],
        estaSemana: Array.isArray(d.estaSemana) ? d.estaSemana : [],
        proximaSemana: Array.isArray(d.proximaSemana) ? d.proximaSemana : [],
        sinFecha: Number(d.sinFecha) || 0
      });
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudieron cargar los próximos cumpleaños.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const hoy = data?.hoy ?? [];
  const vacio =
    data && !hoy.length && !data.estaSemana.length && !data.proximaSemana.length;

  return (
    <Card as="section" className={className}>
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary-50 text-primary">
          <Icon name="cake" size="md" />
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-ink">Próximos cumpleaños</h2>
          <p className="text-sm text-ink-muted">Esta semana y la que viene</p>
        </div>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      {loading && !error && <p className="py-2 text-sm text-ink-muted">Cargando cumpleaños…</p>}

      {!loading && !error && (
        <>
          {hoy.length > 0 && (
            <ul className="mb-4 space-y-2">
              {hoy.map((persona) => (
                <Fila key={persona._id} persona={persona} destacado />
              ))}
            </ul>
          )}

          {vacio ? (
            <p className="py-2 text-sm text-ink-muted">
              Nadie cumple años en estas dos semanas.
            </p>
          ) : (
            <>
              <Grupo titulo="Esta semana" personas={data.estaSemana} />
              <Grupo titulo="La semana que viene" personas={data.proximaSemana} />
            </>
          )}

          {data?.sinFecha > 0 && (
            <p className="mt-4 border-t border-surface-border pt-3 text-xs text-ink-faint">
              {data.sinFecha} {data.sinFecha === 1 ? 'persona' : 'personas'} sin fecha de nacimiento
              cargada: {data.sinFecha === 1 ? 'no aparece' : 'no aparecen'} en esta lista. El sistema
              se la pide al entrar.
            </p>
          )}
        </>
      )}
    </Card>
  );
};

export default UpcomingBirthdays;
