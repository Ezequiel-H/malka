import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import * as AuthContext from '../../contexts/AuthContext.jsx';
import { AppTestShell } from '../../test/AppTestShell.jsx';
import MyInscriptions from './MyInscriptions.jsx';

describe('MyInscriptions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { _id: '1', role: 'participant', estado: 'approved' },
      loading: false
    });
  });

  it('renders heading', async () => {
    render(
      <AppTestShell initialEntries={['/mine']}>
        <Routes>
          <Route path="/mine" element={<MyInscriptions />} />
        </Routes>
      </AppTestShell>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Mis Inscripciones/i })).toBeInTheDocument();
    });
  });
});
