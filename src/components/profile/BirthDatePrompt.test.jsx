import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BirthDatePrompt, { userNeedsBirthDate } from './BirthDatePrompt';

const patchMock = vi.fn();

vi.mock('axios', () => ({
  default: {
    patch: (...args) => patchMock(...args)
  }
}));

const authMock = {
  user: null,
  updateUser: vi.fn(),
  fetchUser: vi.fn()
};

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => authMock
}));

const toastMock = {
  showSuccess: vi.fn(),
  showError: vi.fn()
};

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => toastMock
}));

describe('userNeedsBirthDate', () => {
  it('returns true for participants without fechaNacimiento', () => {
    expect(userNeedsBirthDate({ role: 'participant' })).toBe(true);
    expect(userNeedsBirthDate({ role: 'participant', fechaNacimiento: '' })).toBe(true);
  });

  it('returns false when birth date exists or user is admin', () => {
    expect(userNeedsBirthDate({ role: 'participant', fechaNacimiento: '1990-05-15' })).toBe(false);
    expect(userNeedsBirthDate({ role: 'admin' })).toBe(false);
  });
});

describe('BirthDatePrompt', () => {
  beforeEach(() => {
    patchMock.mockReset();
    authMock.updateUser.mockReset();
    authMock.fetchUser.mockReset();
    toastMock.showSuccess.mockReset();
    toastMock.showError.mockReset();
    authMock.user = {
      role: 'participant',
      estado: 'approved',
      nombre: 'Ana'
    };
  });

  it('does not render when user already has fechaNacimiento', () => {
    authMock.user = { role: 'participant', fechaNacimiento: '1990-05-15' };
    const { container } = render(<BirthDatePrompt />);
    expect(container).toBeEmptyDOMElement();
  });

  it('saves fechaNacimiento via PATCH /users/me', async () => {
    const user = userEvent.setup();
    patchMock.mockResolvedValue({
      data: { user: { ...authMock.user, fechaNacimiento: '1985-03-20' } }
    });

    render(<BirthDatePrompt />);

    await user.type(screen.getByLabelText('Fecha de nacimiento'), '1985-03-20');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(patchMock).toHaveBeenCalledWith('/users/me', { fechaNacimiento: '1985-03-20' });
    });
    expect(authMock.updateUser).toHaveBeenCalledWith(
      expect.objectContaining({ fechaNacimiento: '1985-03-20' })
    );
    expect(toastMock.showSuccess).toHaveBeenCalledWith('Fecha de nacimiento guardada');
  });
});
