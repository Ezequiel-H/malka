import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Alert, Badge, Button, Card, Icon } from '../ui';
import { formatUtcCalendarDateEsAR } from '../../utils/dateUtils';
import { buildWaLink, renderPlantilla } from '../../utils/whatsapp';

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
const Fila = ({ persona, destacado = false, saludo }) => (
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

        {/* Sólo en la fila de hoy: un saludo adelantado nueve días no es un
            saludo. Sin teléfono cargado tampoco hay botón — uno que no puede
            hacer nada es peor que ninguno.
            Va adentro del contenedor que envuelve: afuera, en el teléfono se
            montaba encima del nombre. */}
        {saludo && (
          <Button
            href={saludo}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            icon="whatsapp"
            className="ml-auto shrink-0"
          >
            Saludar
          </Button>
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

/* `semanaQueViene`: el panel a medida puede mostrar sólo esta semana. */
const UpcomingBirthdays = ({ className = '', semanaQueViene = true }) => {
  const [data, setData] = useState(null);
  const [saludoPlantilla, setSaludoPlantilla] = useState('');
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

  /* El saludo se pide aparte: si Ajustes falla, la lista de cumpleaños tiene
     que salir igual — se pierde el botón, no el bloque. */
  useEffect(() => {
    let vigente = true;
    axios
      .get('/settings')
      .then((res) => {
        if (vigente) setSaludoPlantilla(res.data?.settings?.whatsappCumpleanosMensaje || '');
      })
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, []);

  /* wa.me se abre contra el teléfono DE LA PERSONA, no contra el número del
     centro: acá el que escribe es Malka.
     Sin texto no hay botón: lo que el botón promete es un saludo ya escrito, y
     abrir un chat en blanco no es eso. */
  const linkDeSaludo = (persona) => {
    const texto = renderPlantilla(saludoPlantilla, {
      nombre: persona.nombre,
      edad: persona.edad,
    }).trim();
    return texto ? buildWaLink(persona.telefono, texto) : null;
  };

  const hoy = data?.hoy ?? [];
  const proxima = semanaQueViene ? data?.proximaSemana ?? [] : [];
  const vacio = data && !hoy.length && !data.estaSemana.length && !proxima.length;

  return (
    <Card as="section" className={className}>
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary-50 text-primary">
          <Icon name="cake" size="md" />
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-ink">Próximos cumpleaños</h2>
          <p className="text-sm text-ink-muted">{semanaQueViene ? 'Esta semana y la que viene' : 'Esta semana'}</p>
        </div>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      {loading && !error && <p className="py-2 text-sm text-ink-muted">Cargando cumpleaños…</p>}

      {!loading && !error && (
        <>
          {hoy.length > 0 && (
            <ul className="mb-4 space-y-2">
              {hoy.map((persona) => (
                <Fila
                  key={persona._id}
                  persona={persona}
                  destacado
                  saludo={linkDeSaludo(persona)}
                />
              ))}
            </ul>
          )}

          {vacio ? (
            <p className="py-2 text-sm text-ink-muted">
              {semanaQueViene ? 'Nadie cumple años en estas dos semanas.' : 'Nadie cumple años esta semana.'}
            </p>
          ) : (
            <>
              <Grupo titulo="Esta semana" personas={data.estaSemana} />
              <Grupo titulo="La semana que viene" personas={proxima} />
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
