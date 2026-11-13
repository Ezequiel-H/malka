import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { DateTime } from 'luxon';
import * as AuthContext from '../../contexts/AuthContext.jsx';
import { AppTestShell } from '../../test/AppTestShell.jsx';
import AdminDashboard from './AdminDashboard.jsx';

const hoy = DateTime.now().setZone('America/Argentina/Buenos_Aires');
const dentroDe = (n) => hoy.plus({ days: n }).toISODate();
const mes = (n) => hoy.minus({ months: n }).toFormat('yyyy-MM');

const PENDIENTE_VACIO = { cantidad: 0, actividades: [], nombres: [], masAntigua: null };

function mockPanel({ pendientes = {}, cumples = {}, actividades = [] } = {}) {
  return vi.spyOn(axios, 'get').mockImplementation((url) => {
    if (url === '/admin/hoy') {
      return Promise.resolve({
        data: {
          personas: { cantidad: 0, nombres: [], masAntigua: null },
          inscripciones: PENDIENTE_VACIO,
          comprobantes: PENDIENTE_VACIO,
          ...pendientes,
        },
      });
    }
    if (url === '/admin/birthdays') return Promise.resolve({ data: { hoy: [], estaSemana: [], proximaSemana: [], total: 0, sinFecha: 0, ...cumples } });
    if (url === '/admin/metrics') {
      return Promise.resolve({
        data: {
          personas: {
            vuelven: { cohorte: 10, volvieron: 6, porcentaje: 60 },
            porMes: [5, 4, 3, 2, 1, 0].map((n, i) => ({ mes: mes(n), personas: 10 + i, nuevas: i, frecuencia: 1.5 })),
          },
          plata: { porMes: [5, 4, 3, 2, 1, 0].map((n) => ({ mes: mes(n), recaudado: 700, gastado: 1000 })) },
        },
      });
    }
    if (url === '/admin/actividades-resumen') {
      return Promise.resolve({ data: { semana: { desde: dentroDe(-3), hasta: dentroDe(3), hoy: hoy.toISODate() }, actividades } });
    }
    if (url === '/tags') return Promise.resolve({ data: { tags: [] } });
    if (url === '/settings') return Promise.resolve({ data: { settings: { whatsappCumpleanosMensaje: '¡Feliz cumple, {nombre}!' } } });
    return Promise.reject(new Error(`unexpected GET ${url}`));
  });
}

const montar = () =>
  render(
    <AppTestShell initialEntries={['/admin']}>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </AppTestShell>,
  );

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: { role: 'admin', nombre: 'Wally' }, loading: false });
  });

  it('saluda por nombre y dice que no hay nada pendiente', async () => {
    mockPanel();
    montar();
    expect(screen.getByRole('heading', { level: 1, name: /Wally/ })).toBeInTheDocument();
    expect(await screen.findByText(/Nada pendiente/)).toBeInTheDocument();
  });

  it('muestra lo pendiente con su acción a un toque', async () => {
    mockPanel({
      pendientes: {
        personas: { cantidad: 2, nombres: ['Noa Feld', 'Uri Kaplan'], masAntigua: hoy.minus({ days: 3 }).toISO() },
        comprobantes: { cantidad: 1, actividades: ['Cena de Shabat'], nombres: ['Ana Groisman'], masAntigua: null },
      },
    });
    montar();
    expect(await screen.findByText('2 personas esperan aprobación')).toBeInTheDocument();
    expect(screen.getByText(/hace 3 días/)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Revisar' }).map((a) => a.getAttribute('href'))).toEqual(['/admin/users/pending', '/admin/inscriptions?comprobantes=1']);
  });

  it('muestra los números del mes y el encuentro grande que viene', async () => {
    mockPanel({
      actividades: [
        {
          id: 'a1',
          titulo: 'Kabbalat Shabbat',
          categorias: [],
          cupo: 40,
          semana: [],
          proximo: { fecha: dentroDe(2), texto: 'vie 15 nov', hora: '20:30', aceptadas: 34, enEspera: 3, pendientes: 0, comprobantes: 0, nombres: ['Tamar Levin'] },
        },
      ],
    });
    montar();
    expect(await screen.findByText('Vinieron este mes')).toBeInTheDocument();
    expect(screen.getByText('Vinieron este mes').parentElement).toHaveTextContent('15');
    expect(screen.getByText('60 %')).toBeInTheDocument();
    expect(screen.getByText('70 %')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Kabbalat Shabbat' })).toBeInTheDocument();
    expect(screen.getByText('3 en lista de espera')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lista para el día' })).toHaveAttribute('href', `/admin/activities/a1/inscriptions?fecha=${dentroDe(2)}`);
  });

  it('si una pieza falla, lo demás sale igual', async () => {
    const get = mockPanel();
    const original = get.getMockImplementation();
    get.mockImplementation((url, config) => (url === '/admin/metrics' ? Promise.reject(new Error('caído')) : original(url, config)));
    montar();
    expect(await screen.findByText(/Nada pendiente/)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Vinieron este mes')).not.toBeInTheDocument());
  });
});
