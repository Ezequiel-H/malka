import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import MyProfile from './MyProfile';

const patchMock = vi.fn();

vi.mock('axios', () => {
  return {
    default: {
      patch: (...args) => patchMock(...args)
    }
  };
});

const authMock = {
  user: null,
  updateUser: vi.fn(),
  fetchUser: vi.fn()
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
      restriccionesAlimentarias: ['Sin gluten'],
      comoSeEntero: 'Instagram',
      estado: 'approved',
      role: 'participant'
    };
  });

  it('muestra el formulario prellenado y email bloqueado', () => {
    render(
      <MemoryRouter>
        <MyProfile />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Mi perfil' })).toBeInTheDocument();

    expect(screen.getByLabelText('Nombre')).toHaveValue('Ana');
    expect(screen.getByLabelText('Apellido')).toHaveValue('Perez');
    expect(screen.getByLabelText('DNI')).toHaveValue('12345678');
    expect(screen.getByLabelText('Teléfono')).toHaveValue('+5491112345678');
    expect(screen.getByLabelText('Email')).toHaveValue('ana@example.com');
    expect(screen.getByLabelText('Email')).toBeDisabled();

    expect(screen.getByLabelText('¿Cómo te enteraste de esta propuesta?')).toHaveValue('Instagram');
    expect(screen.getByLabelText('Sin gluten')).toBeChecked();
  });

  it('envía PATCH /users/me y actualiza el user cuando el API devuelve user', async () => {
    const u = userEvent.setup();
    patchMock.mockResolvedValueOnce({
      data: {
        user: {
          ...authMock.user,
          telefono: '+5491100000000',
          restriccionesAlimentarias: ['Vegano']
        }
      }
    });

    render(
      <MemoryRouter>
        <MyProfile />
      </MemoryRouter>
    );

    await u.clear(screen.getByLabelText('Teléfono'));
    await u.type(screen.getByLabelText('Teléfono'), '+5491100000000');
    await u.click(screen.getByLabelText('Sin gluten'));
    await u.click(screen.getByLabelText('Vegano'));

    await u.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(patchMock).toHaveBeenCalledTimes(1);
    });

    expect(patchMock).toHaveBeenCalledWith('/users/me', {
      nombre: 'Ana',
      apellido: 'Perez',
      dni: '12345678',
      telefono: '+5491100000000',
      restriccionesAlimentarias: ['Vegano'],
      comoSeEntero: 'Instagram'
    });

    expect(authMock.updateUser).toHaveBeenCalledWith({
      ...authMock.user,
      telefono: '+5491100000000',
      restriccionesAlimentarias: ['Vegano']
    });
    expect(toastMock.showSuccess).toHaveBeenCalledWith('Tu perfil se guardó correctamente');
  });

  it('muestra error si falla el PATCH', async () => {
    const u = userEvent.setup();
    patchMock.mockRejectedValueOnce({
      response: { data: { message: 'Teléfono inválido' } }
    });

    render(
      <MemoryRouter>
        <MyProfile />
      </MemoryRouter>
    );

    await u.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(toastMock.showError).toHaveBeenCalledWith('Teléfono inválido');
    });
  });
});

