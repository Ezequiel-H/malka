import { describe, it, expect } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { AppTestShell } from '../../test/AppTestShell.jsx';
import MyInscriptions from './MyInscriptions.jsx';

describe('MyInscriptions', () => {
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
