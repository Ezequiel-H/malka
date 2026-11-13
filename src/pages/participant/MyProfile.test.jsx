import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import MyProfile from './MyProfile';

const patchMock = vi.fn();

const getMock = vi.fn();

vi.mock('axios', () => {
  return {
    default: {
      patch: (...args) => patchMock(...args),
      get: (...args) => getMock(...args)
    }
  };
});

const authMock = {
  user: null,
  updateUser: vi.fn(),
  fetchUser: vi.fn(),
  updateMyTags: vi.fn(),
  logout: vi.fn()
};

vi.mock('../../contexts/AuthContext', () => {
  return {
    useAuth: () => authMock
  };
});

const toastMock = {
  showSuccess: vi.fn(),
  showError: vi.fn()
};

vi.mock('../../contexts/ToastContext', () => {
  return {
    useToast: () => toastMock
  };
});

describe('MyProfile', () => {
  beforeEach(() => {
    patchMock.mockReset();
    getMock.mockReset();
    getMock.mockResolvedValue({ data: { tags: [{ nombre: 'música', color: '#7c5cbf', icono: 'music' }, { nombre: 'cocina', color: '#c98a1e', icono: 'chef' }] } });
    authMock.updateMyTags.mockReset();
    authMock.updateMyTags.mockResolvedValue({ success: true });
    authMock.updateUser.mockReset();
    authMock.fetchUser.mockReset();
    toastMock.showSuccess.mockReset();
    toastMock.showError.mockReset();

    authMock.user = {
      nombre: 'Ana',
      apellido: 'Perez',
      dni: '12345678',
      email: 'ana@example.com',
      telefono: '+5491112345678',
      fechaNacimiento: '1992-07-10',
      restriccionesAlimentarias: ['Sin TACC'],
      comoSeEntero: 'Instagram',
      estado: 'approved',
      role: 'participant'
    };
  });

  const montar = () =>
    render(
      <MemoryRouter>
        <MyProfile />
      </MemoryRouter>
    );

  it('muestra los datos como una lista y el email sin poder cambiarse', async () => {
    montar();
    expect(screen.getByRole('heading', { name: 'Mi perfil' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nombre\s*Ana/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Teléfono\s*\+5491112345678/ })).toBeInTheDocument();
    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ana@example.com/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sin TACC/ })).toHaveAttribute('aria-pressed', 'true');
    expect(await screen.findByRole('button', { name: /música/i })).toBeInTheDocument();
  });

  it('un dato se edita en el lugar y se guarda solo ese', async () => {
    const u = userEvent.setup();
    patchMock.mockResolvedValueOnce({ data: { user: { ...authMock.user, telefono: '+5491100000000' } } });
    montar();
    await u.click(screen.getByRole('button', { name: /Teléfono/ }));
    const campo = screen.getByLabelText('Teléfono');
    await u.clear(campo);
    await u.type(campo, '+5491100000000');
    await u.click(screen.getByRole('button', { name: 'Listo' }));
    await waitFor(() => expect(patchMock).toHaveBeenCalledWith('/users/me', { telefono: '+5491100000000' }));
    expect(authMock.updateUser).toHaveBeenCalledWith({ ...authMock.user, telefono: '+5491100000000' });
  });

  it('no deja vaciar un dato obligatorio', async () => {
    const u = userEvent.setup();
    montar();
    await u.click(screen.getByRole('button', { name: /Nombre/ }));
    await u.clear(screen.getByLabelText('Nombre'));
    await u.click(screen.getByRole('button', { name: 'Listo' }));
    expect(screen.getByText('Este dato no puede quedar vacío')).toBeInTheDocument();
    expect(patchMock).not.toHaveBeenCalled();
  });

  it('la comida y los intereses se guardan solos al tocarlos', async () => {
    const u = userEvent.setup();
    patchMock.mockResolvedValue({ data: {} });
    montar();
    await u.click(screen.getByRole('button', { name: /Vegano/ }));
    await waitFor(() => expect(patchMock).toHaveBeenCalledWith('/users/me', { restriccionesAlimentarias: ['Sin TACC', 'Vegano'] }), { timeout: 2500 });
    await u.click(await screen.findByRole('button', { name: /música/i }));
    await waitFor(() => expect(authMock.updateMyTags).toHaveBeenCalledWith(['música']), { timeout: 2500 });
  });

  it('muestra el error si no se puede guardar', async () => {
    const u = userEvent.setup();
    patchMock.mockRejectedValueOnce({ response: { data: { message: 'Teléfono inválido' } } });
    montar();
    await u.click(screen.getByRole('button', { name: /Apellido/ }));
    await u.type(screen.getByLabelText('Apellido'), 'z');
    await u.click(screen.getByRole('button', { name: 'Listo' }));
    await waitFor(() => expect(toastMock.showError).toHaveBeenCalledWith('Teléfono inválido'));
  });
});
