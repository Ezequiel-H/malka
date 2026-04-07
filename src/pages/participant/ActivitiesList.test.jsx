import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import * as AuthContext from '../../contexts/AuthContext.jsx';
import { AppTestShell } from '../../test/AppTestShell.jsx';
import ActivitiesList from './ActivitiesList.jsx';

describe('ActivitiesList', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { _id: '1', role: 'participant', estado: 'approved', nombre: 'A' },
      loading: false
    });
  });

  it('shows cartelera after loading activities', async () => {
    render(
      <AppTestShell initialEntries={['/activities']}>
        <Routes>
          <Route path="/activities" element={<ActivitiesList />} />
        </Routes>
      </AppTestShell>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Cartelera de Actividades/i })).toBeInTheDocument();
    });
  });
});
