import { describe, it, expect } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/msw/server.js';
import { AppTestShell } from '../../test/AppTestShell.jsx';
import { locationStub } from '../../test/setup.js';
import Login from './Login.jsx';

describe('Login', () => {
  it('submits credentials and navigates for approved participant', async () => {
    server.use(
      http.post('http://localhost:5001/api/auth/login', async () =>
        HttpResponse.json({
          token: 'test-token',
          user: {
            id: 'u1',
            email: 'user@test.com',
            role: 'participant',
            estado: 'approved',
            nombre: 'U',
            apellido: 'Ser'
          }
        })
      )
    );

    const user = userEvent.setup();
    render(
      <AppTestShell initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/activities" element={<div>At Activities</div>} />
        </Routes>
      </AppTestShell>
    );

    const form = document.querySelector('form');
    const [emailInput, passInput] = form.querySelectorAll('input');

    await user.type(emailInput, 'user@test.com');
    await user.type(passInput, 'password123');
    await user.click(screen.getByRole('button', { name: /Iniciar sesión/i }));

    expect(await screen.findByText('At Activities')).toBeInTheDocument();
  });

  it('shows API error message on failure', async () => {
    locationStub.pathname = '/login';
    locationStub.href = 'http://localhost:5173/login';
    server.use(
      http.post('http://localhost:5001/api/auth/login', async () =>
        HttpResponse.json({ message: 'Credenciales inválidas' }, { status: 401 })
      )
    );

    const user = userEvent.setup();
    render(
      <AppTestShell initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </AppTestShell>
    );

    const form = document.querySelector('form');
    const [emailInput, passInput] = form.querySelectorAll('input');
    await user.type(emailInput, 'x@y.com');
    await user.type(passInput, 'bad');
    await user.click(screen.getByRole('button', { name: /Iniciar sesión/i }));

    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument();
  });
});
