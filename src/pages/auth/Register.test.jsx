import { describe, it, expect, beforeEach } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/msw/server.js';
import { AppTestShell } from '../../test/AppTestShell.jsx';
import Register from './Register.jsx';

describe('Register', () => {
  beforeEach(() => {
    server.use(
      http.get('http://localhost:5001/api/tags', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('activa') === 'true') {
          return HttpResponse.json({ tags: [{ _id: 't1', nombre: 'música' }], count: 1 });
        }
        return HttpResponse.json({ tags: [], count: 0 });
      })
    );
  });

  it('renders registration heading after tag fetch', async () => {
    render(
      <AppTestShell initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </AppTestShell>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Registro' })).toBeInTheDocument();
    });
  });
});
