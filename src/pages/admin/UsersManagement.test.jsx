import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import * as AuthContext from '../../contexts/AuthContext.jsx';
import { AppTestShell } from '../../test/AppTestShell.jsx';
import { ConfirmProvider } from '../../components/ui';
import UsersManagement from './UsersManagement.jsx';
import PendingUsers from './PendingUsers.jsx';

const USUARIOS = [
  { _id: 'u1', nombre: 'Tamar', apellido: 'Levin', email: 'tamar@demo.malka', telefono: '+54 9 11 5555-0101', role: 'participant', estado: 'approved', createdAt: '2025-03-01T00:00:00Z' },
  { _id: 'u2', nombre: 'Ilan', apellido: 'Roitman', email: 'ilan@demo.malka', telefono: '+54 9 11 5555-0102', role: 'participant', estado: 'approved', createdAt: '2026-10-01T00:00:00Z' },
  { _id: 'u3', nombre: 'Noa', apellido: 'Feld', email: 'noa@demo.malka', role: 'participant', estado: 'pending', residencia: 'exterior', createdAt: '2026-11-12T00:00:00Z' },
  { _id: 'a1', nombre: 'Admin', apellido: 'Malka', email: 'admin@malka.local', role: 'admin', estado: 'approved' },
];
const METRICAS = [
  { id: 'u1', estado: 'frecuente', vecesTotal: 23, ultimaVez: '2026-11-08T00:00:00Z', sinAnotarse: 1, categorias: ['cocina'], ultimosMeses: [1, 2, 3, 2, 4, 3, 2, 1] },
  { id: 'u2', estado: 'nueva', vecesTotal: 2, ultimaVez: '2026-10-29T00:00:00Z', sinAnotarse: 0, categorias: [], ultimosMeses: [0, 0, 0, 0, 0, 0, 1, 1] },
  { id: 'u3', estado: 'sin_participar', vecesTotal: 0, ultimaVez: null, sinAnotarse: 0, categorias: [], ultimosMeses: [0, 0, 0, 0, 0, 0, 0, 0] },
];

const mockApi = () => {
  vi.spyOn(axios, 'get').mockImplementation((url) => {
    if (url === '/users') return Promise.resolve({ data: { users: USUARIOS } });
    if (url === '/admin/metrics/people') return Promise.resolve({ data: { personas: METRICAS } });
    if (url === '/tags') return Promise.resolve({ data: { tags: [{ nombre: 'cocina', color: '#c98a1e' }] } });
    return Promise.reject(new Error(`unexpected GET ${url}`));
  });
  return vi.spyOn(axios, 'put').mockResolvedValue({ data: {} });
};

const montar = (ruta = '/admin/users', Pantalla = UsersManagement) =>
  render(
    <AppTestShell initialEntries={[ruta]}>
      <ConfirmProvider>
        <Routes>
          <Route path="/admin/users" element={<Pantalla />} />
          <Route path="/admin/users/pending" element={<Pantalla />} />
        </Routes>
      </ConfirmProvider>
    </AppTestShell>,
  );

const lista = () => screen.getByText(/^\d+ personas?\b/).parentElement.querySelector('ul');

describe('Personas', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: { role: 'admin', nombre: 'Admin' }, loading: false });
  });

  it('junta arriba las cuentas por aprobar y lista a los participantes con cómo vienen', async () => {
    mockApi();
    montar();
    const bandeja = await screen.findByRole('region', { name: 'Esperan aprobación' });
    expect(within(bandeja).getByText('Noa Feld')).toBeInTheDocument();
    expect(await screen.findByText('3 personas')).toBeInTheDocument();
    expect(within(lista()).getByText('Frecuente')).toBeInTheDocument();
    expect(within(lista()).queryByText('Admin Malka')).not.toBeInTheDocument();
  });

  it('aprueba de un toque, sin confirmar', async () => {
    const put = mockApi();
    const user = userEvent.setup();
    montar();
    await user.click(await screen.findByRole('button', { name: 'Aprobar a Noa Feld' }));
    await waitFor(() => expect(put).toHaveBeenCalledWith('/users/u3/approve'));
  });

  it('los filtros se suman: cómo viene y búsqueda por teléfono', async () => {
    mockApi();
    const user = userEvent.setup();
    montar();
    await screen.findByText('3 personas');
    await user.click(screen.getByRole('button', { name: 'Frecuentes' }));
    expect(await screen.findByText(/^1 persona\b/)).toBeInTheDocument();
    expect(within(lista()).getByText('Tamar Levin')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Todas' }));
    await user.type(screen.getByRole('searchbox', { name: 'Buscar personas' }), '5555-0102');
    await waitFor(() => expect(screen.getByText(/^1 persona\b/)).toBeInTheDocument());
    expect(within(lista()).getByText('Ilan Roitman')).toBeInTheDocument();
  });

  it('/admin/users/pending muestra sólo las cuentas por aprobar', async () => {
    mockApi();
    montar('/admin/users/pending', PendingUsers);
    expect(await screen.findByText('1 persona')).toBeInTheDocument();
    expect(within(lista()).getByText('Noa Feld')).toBeInTheDocument();
  });
});
