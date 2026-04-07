import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import * as AuthContext from '../../contexts/AuthContext.jsx';
import { AppTestShell } from '../../test/AppTestShell.jsx';
import MyInterests from './MyInterests.jsx';

describe('MyInterests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { _id: '1', tags: [], nombre: 'N', apellido: 'A' },
      loading: false,
      fetchUser: vi.fn().mockResolvedValue(null),
      updateMyTags: vi.fn().mockResolvedValue({ success: true })
    });
  });

  it('renders interests heading', async () => {
    render(
      <AppTestShell initialEntries={['/interests']}>
        <Routes>
          <Route path="/interests" element={<MyInterests />} />
        </Routes>
      </AppTestShell>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Mis intereses/i })).toBeInTheDocument();
    });
  });
});
