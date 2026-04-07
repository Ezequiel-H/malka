import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import * as AuthContext from '../../contexts/AuthContext.jsx';
import PrivateRoute from './PrivateRoute';

describe('PrivateRoute', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('redirects to login when there is no user', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      loading: false
    });

    render(
      <MemoryRouter
        initialEntries={['/protected']}
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <Routes>
          <Route
            path="/protected"
            element={
              <PrivateRoute>
                <div>Secret</div>
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<div>LoginPage</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('LoginPage')).toBeInTheDocument();
  });

  it('shows pending message when requireApproved and user not approved', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: {
        nombre: 'Pat',
        apellido: 'Lee',
        role: 'participant',
        estado: 'pending'
      },
      loading: false
    });

    render(
      <PrivateRoute requireApproved>
        <div>Activities</div>
      </PrivateRoute>
    );

    expect(screen.getByText(/Tu usuario está siendo validado/i)).toBeInTheDocument();
  });

  it('renders children when approved participant and requireApproved', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { nombre: 'A', role: 'participant', estado: 'approved' },
      loading: false
    });

    render(
      <PrivateRoute requireApproved>
        <div>Activities</div>
      </PrivateRoute>
    );

    expect(screen.getByText('Activities')).toBeInTheDocument();
  });
});
