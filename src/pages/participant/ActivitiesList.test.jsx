import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import * as AuthContext from '../../contexts/AuthContext.jsx';
import { AppTestShell } from '../../test/AppTestShell.jsx';
import { hoyIso, sumarDias } from '../../utils/participante';
import ActivitiesList from './ActivitiesList.jsx';

const hoy = hoyIso();
const maniana = sumarDias(hoy, 1);

const ACTIVIDADES = [
  { _id: 'yoga', titulo: 'Kundalini Yoga', tipo: 'recurrente', categorias: ['bienestar'], esGratuita: true, cupo: 20 },
  { _id: 'cocina', titulo: 'Cocina israelí', tipo: 'unica', categorias: ['cocina'], esGratuita: false, precio: 8000, moneda: 'ARS', cupo: 16 },
  { _id: 'ceramica', titulo: 'Taller de cerámica', tipo: 'unica', categorias: ['arte'], esGratuita: false, precio: 9000, moneda: 'ARS', cupo: 8 },
];
const FECHAS = {
  yoga: [{ fechaStr: hoy, hora: '19:00', cuposDisponibles: 12, tieneCupo: true, estadoInscripcion: 'aceptada' }],
  cocina: [{ fechaStr: maniana, hora: '11:00', cuposDisponibles: 3, tieneCupo: true, estadoInscripcion: null }],
  ceramica: [{ fechaStr: maniana, hora: '18:00', cuposDisponibles: 0, tieneCupo: false, estadoInscripcion: null }],
};

const montar = (ruta = '/activities') =>
  render(
    <AppTestShell initialEntries={[ruta]}>
      <Routes>
        <Route path="/activities" element={<ActivitiesList />} />
      </Routes>
    </AppTestShell>,
  );

describe('ActivitiesList', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { _id: '1', role: 'participant', estado: 'approved', nombre: 'A', fechaNacimiento: '1990-01-01', nacionalidad: 'AR', residencia: 'buenos_aires' },
      loading: false,
    });
    vi.spyOn(axios, 'get').mockImplementation((url) => {
      if (url === '/activities') return Promise.resolve({ data: { activities: ACTIVIDADES } });
      if (url === '/tags') return Promise.resolve({ data: { tags: [] } });
      const m = url.match(/^\/inscriptions\/activity\/(\w+)\/available-dates$/);
      if (m) return Promise.resolve({ data: { availableDates: FECHAS[m[1]] } });
      return Promise.resolve({ data: {} });
    });
  });

  it('muestra la agenda por día con lo que ayuda a decidir', async () => {
    montar();
    expect(screen.getByRole('heading', { name: /Cartelera/i })).toBeInTheDocument();
    const deHoy = await screen.findByRole('region', { name: /^Hoy/ });
    expect(within(deHoy).getByText('Kundalini Yoga')).toBeInTheDocument();
    expect(within(deHoy).getByText('Vas')).toBeInTheDocument();

    const deManiana = screen.getByRole('region', { name: /^Mañana/ });
    expect(within(deManiana).getByText('Quedan 3')).toBeInTheDocument();
    expect(within(deManiana).getByText('Lleno · lista de espera')).toBeInTheDocument();
    // La fila lleva a la actividad con el día ya elegido.
    expect(within(deManiana).getByText('Cocina israelí').closest('a')).toHaveAttribute('href', `/activities/cocina?fecha=${maniana}`);
  });

  it('filtra por propuesta y por cuándo', async () => {
    const user = userEvent.setup();
    montar();
    await screen.findByText('Kundalini Yoga');
    await user.click(screen.getByRole('button', { name: 'cocina' }));
    await waitFor(() => expect(screen.queryByText('Kundalini Yoga')).not.toBeInTheDocument());
    expect(screen.getByText('Cocina israelí')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hoy' }));
    await waitFor(() => expect(screen.queryByText('Cocina israelí')).not.toBeInTheDocument());
    expect(screen.getByText('No encontramos actividades con los filtros seleccionados.')).toBeInTheDocument();
  });
});
