import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import * as AuthContext from '../../contexts/AuthContext.jsx';
import { AppTestShell } from '../../test/AppTestShell.jsx';
import AdminDashboard from './AdminDashboard.jsx';

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { role: 'admin', nombre: 'Admin' },
      loading: false
    });
  });

  it('renders admin panel title', async () => {
    render(
      <AppTestShell initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </AppTestShell>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Panel de Administración/i })).toBeInTheDocument();
    });
  });
});
