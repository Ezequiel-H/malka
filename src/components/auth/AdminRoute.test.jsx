import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import * as AuthContext from '../../contexts/AuthContext.jsx';
import AdminRoute from './AdminRoute';

describe('AdminRoute', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('redirects to login without user', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: null, loading: false });

    render(
      <MemoryRouter
        initialEntries={['/admin']}
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div>AdminHome</div>
              </AdminRoute>
            }
          />
          <Route path="/login" element={<div>LoginPage</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('LoginPage')).toBeInTheDocument();
  });

  it('blocks non-admin', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { role: 'participant', estado: 'approved' },
      loading: false
    });

    render(
      <AdminRoute>
        <div>AdminHome</div>
      </AdminRoute>
    );

    expect(screen.getByText(/Acceso denegado/i)).toBeInTheDocument();
  });

  it('allows admin', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { role: 'admin' },
      loading: false
    });

    render(
      <AdminRoute>
        <div>AdminHome</div>
      </AdminRoute>
    );

    expect(screen.getByText('AdminHome')).toBeInTheDocument();
  });
});
