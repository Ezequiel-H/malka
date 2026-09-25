import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import axios from 'axios';
import UpcomingBirthdays from './UpcomingBirthdays.jsx';

const respuesta = (overrides = {}) => ({
  desde: '2026-09-25',
  finDeEstaSemana: '2026-09-27',
  hasta: '2026-10-04',
  hoy: [],
  estaSemana: [],
  proximaSemana: [],
  total: 0,
  sinFecha: 0,
  ...overrides
});

const SALUDO = '¡Feliz cumpleaños, {nombre}! Cumplís {edad}.';

const mock = (data, saludo = SALUDO) =>
  vi.spyOn(axios, 'get').mockImplementation((url) => {
    if (url === '/admin/birthdays') return Promise.resolve({ data });
    if (url === '/settings') {
      return Promise.resolve({ data: { settings: { whatsappCumpleanosMensaje: saludo } } });
    }
    return Promise.reject(new Error(`url inesperada: ${url}`));
  });

const renderizar = () =>
  render(
    <MemoryRouter>
      <UpcomingBirthdays />
    </MemoryRouter>
  );

beforeEach(() => vi.restoreAllMocks());
afterEach(() => vi.restoreAllMocks());

describe('UpcomingBirthdays', () => {
  it('avisa cuando nadie cumple en las dos semanas', async () => {
    mock(respuesta());
    renderizar();

    expect(
      await screen.findByText('Nadie cumple años en estas dos semanas.')
    ).toBeInTheDocument();
  });

  it('destaca a quien cumple hoy con la edad que cumple', async () => {
    mock(
      respuesta({
        hoy: [
          {
            _id: 'u1',
            nombre: 'Ana',
            apellido: 'Pérez',
            fecha: '2026-09-25',
            edad: 34,
            esHoy: true,
            diasFaltan: 0,
            semana: 'esta'
          }
        ],
        total: 1
      })
    );
    renderizar();

    expect(await screen.findByText('Cumple 34 hoy')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ana Pérez' })).toHaveAttribute(
      'href',
      '/admin/users/u1'
    );
    // Con alguien cumpliendo hoy, el vacío no se muestra.
    expect(screen.queryByText('Nadie cumple años en estas dos semanas.')).not.toBeInTheDocument();
  });

  it('separa los dos grupos y dice cuándo es cada uno', async () => {
    mock(
      respuesta({
        estaSemana: [
          {
            _id: 'u2',
            nombre: 'Iara',
            apellido: 'Gomez',
            fecha: '2026-09-26',
            edad: 29,
            esHoy: false,
            diasFaltan: 1,
            semana: 'esta'
          }
        ],
        proximaSemana: [
          {
            _id: 'u3',
            nombre: 'David',
            apellido: 'Levi',
            fecha: '2026-10-01',
            edad: 41,
            esHoy: false,
            diasFaltan: 6,
            semana: 'proxima'
          }
        ],
        total: 2
      })
    );
    renderizar();

    await screen.findByText('Esta semana');
    expect(screen.getByText('La semana que viene')).toBeInTheDocument();

    // Mañana se dice "mañana", no "en 1 días".
    expect(screen.getByText('mañana')).toBeInTheDocument();
    expect(screen.getByText('en 6 días')).toBeInTheDocument();

    // El día calendario no se corre por zona horaria: 01/10 sigue siendo 01/10.
    expect(screen.getByText('01/10')).toBeInTheDocument();
    expect(screen.getByText('26/09')).toBeInTheDocument();
  });

  it('explica el pliegue del 29 de febrero', async () => {
    mock(
      respuesta({
        hoy: [
          {
            _id: 'u4',
            nombre: 'Leap',
            apellido: 'Año',
            fecha: '2027-02-28',
            edad: 27,
            esHoy: true,
            diasFaltan: 0,
            semana: 'esta',
            veintinueveDeFebrero: true
          }
        ],
        total: 1
      })
    );
    renderizar();

    expect(await screen.findByText('nació un 29/02')).toBeInTheDocument();
    // 2027 no es bisiesto: el festejo se corre al 28.
    expect(screen.getByText('28/02')).toBeInTheDocument();
  });

  it('aclara cuántos no tienen la fecha cargada', async () => {
    mock(respuesta({ sinFecha: 3 }));
    renderizar();

    expect(await screen.findByText(/3 personas sin fecha de nacimiento cargada/)).toBeInTheDocument();
  });

  it('muestra el error del backend sin romper el panel', async () => {
    vi.spyOn(axios, 'get').mockRejectedValue({
      response: { data: { message: 'Error al obtener próximos cumpleaños' } }
    });
    renderizar();

    const alerta = await screen.findByRole('alert');
    expect(within(alerta).getByText('Error al obtener próximos cumpleaños')).toBeInTheDocument();
  });

  it('no tira abajo el panel si la respuesta viene incompleta', async () => {
    // Un {} vacío no debería reventar: este bloque vive dentro del Panel y un
    // .length sobre undefined se llevaría puesta toda la pantalla.
    mock({});
    renderizar();

    expect(
      await screen.findByText('Nadie cumple años en estas dos semanas.')
    ).toBeInTheDocument();
  });

  it('ofrece saludar por WhatsApp a quien cumple hoy, con el texto ya armado', async () => {
    mock(
      respuesta({
        hoy: [
          {
            _id: 'u1',
            nombre: 'Ana',
            apellido: 'Pérez',
            telefono: '+54 9 11 3333-4444',
            fecha: '2026-09-25',
            edad: 34,
            esHoy: true,
            diasFaltan: 0,
            semana: 'esta'
          }
        ],
        total: 1
      })
    );
    renderizar();

    const boton = await screen.findByRole('link', { name: 'Saludar' });
    // El teléfono va sin +, espacios ni guiones: wa.me no los acepta.
    expect(boton).toHaveAttribute(
      'href',
      `https://wa.me/5491133334444?text=${encodeURIComponent('¡Feliz cumpleaños, Ana! Cumplís 34.')}`
    );
    expect(boton).toHaveAttribute('target', '_blank');
  });

  it('no ofrece saludar a quien cumple más adelante', async () => {
    mock(
      respuesta({
        estaSemana: [
          {
            _id: 'u2',
            nombre: 'Bruno',
            apellido: 'Feldman',
            telefono: '+5491140012345',
            fecha: '2026-09-26',
            edad: 38,
            esHoy: false,
            diasFaltan: 1,
            semana: 'esta'
          }
        ],
        total: 1
      })
    );
    renderizar();

    await screen.findByText('Bruno Feldman');
    // Un saludo de cumpleaños adelantado no es un saludo.
    expect(screen.queryByRole('link', { name: 'Saludar' })).not.toBeInTheDocument();
  });

  it('sin teléfono cargado no muestra el botón', async () => {
    mock(
      respuesta({
        hoy: [
          { _id: 'u3', nombre: 'Sin', apellido: 'Teléfono', fecha: '2026-09-25', edad: 40, esHoy: true, diasFaltan: 0, semana: 'esta' }
        ],
        total: 1
      })
    );
    renderizar();

    await screen.findByText('Sin Teléfono');
    expect(screen.queryByRole('link', { name: 'Saludar' })).not.toBeInTheDocument();
  });

  it('si Ajustes falla, la lista sale igual y sólo se pierde el botón', async () => {
    vi.spyOn(axios, 'get').mockImplementation((url) => {
      if (url === '/admin/birthdays') {
        return Promise.resolve({
          data: respuesta({
            hoy: [
              { _id: 'u4', nombre: 'Ana', apellido: 'Pérez', telefono: '+5491133334444', fecha: '2026-09-25', edad: 34, esHoy: true, diasFaltan: 0, semana: 'esta' }
            ],
            total: 1
          })
        });
      }
      return Promise.reject(new Error('ajustes caídos'));
    });
    renderizar();

    expect(await screen.findByText('Cumple 34 hoy')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Saludar' })).not.toBeInTheDocument();
  });

  it('pide los cumpleaños una sola vez', async () => {
    const spy = mock(respuesta());
    renderizar();
    await waitFor(() => expect(spy).toHaveBeenCalledWith('/admin/birthdays'));
    expect(spy.mock.calls.filter(([url]) => url === '/admin/birthdays')).toHaveLength(1);
  });
});
