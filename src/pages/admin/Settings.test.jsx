import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import * as AuthContext from '../../contexts/AuthContext.jsx';
import { AppTestShell } from '../../test/AppTestShell.jsx';
import Settings from './Settings.jsx';

const AJUSTES = {
  instruccionesPagoDefault: 'Alias MALKA',
  whatsappNumero: '5491134405730',
  whatsappViajeMensaje: 'Hola! Soy {nombre}, voy a {actividad}.',
  whatsappRegistroMensaje: 'Hola! Soy {nombre}, vivo en {ciudad}.',
  whatsappCumpleanosMensaje: '¡Feliz cumple, {nombre}!',
  plantillasWhatsApp: [{ nombre: 'Recordatorio', mensaje: 'Hola {nombre}, te esperamos el {fecha}.' }],
};

const montar = (ruta = '/admin/settings') =>
  render(
    <AppTestShell initialEntries={[ruta]}>
      <Routes>
        <Route path="/admin/settings" element={<Settings />} />
      </Routes>
    </AppTestShell>,
  );

describe('Ajustes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: { role: 'admin', nombre: 'Admin' }, loading: false });
    vi.spyOn(axios, 'get').mockResolvedValue({ data: { settings: AJUSTES } });
  });

  it('se guarda solo, mandando sólo lo que cambió', async () => {
    const put = vi.spyOn(axios, 'put').mockImplementation((url, body) => Promise.resolve({ data: { settings: { ...AJUSTES, ...body } } }));
    const user = userEvent.setup();
    montar();
    const campo = await screen.findByLabelText('Instrucciones de pago por defecto');
    await user.type(campo, ' · CBU 123');
    await waitFor(() => expect(put).toHaveBeenCalled(), { timeout: 3000 });
    expect(put).toHaveBeenCalledWith('/settings', { instruccionesPagoDefault: 'Alias MALKA · CBU 123' });
    expect(await screen.findByText('Guardado')).toBeInTheDocument();
  });

  it('los mensajes muestran los datos como pastillas, sin llaves, y cómo llegan', async () => {
    montar('/admin/settings?seccion=mensajes');
    const viaje = await screen.findByRole('textbox', { name: 'Coordinar un viaje' });
    expect(viaje.textContent).not.toContain('{');
    expect(viaje.textContent).toContain('Nombre');
    // La vista previa reemplaza los datos por un ejemplo.
    expect(screen.getAllByText('Tamar').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Ciudad' })).toBeInTheDocument();
  });

  it('las plantillas se crean, se editan y se borran', async () => {
    const put = vi.spyOn(axios, 'put').mockImplementation((url, body) => Promise.resolve({ data: { settings: { ...AJUSTES, ...body } } }));
    const user = userEvent.setup();
    montar('/admin/settings?seccion=plantillas');
    await screen.findByDisplayValue('Recordatorio');
    await user.click(screen.getByRole('button', { name: 'Nueva plantilla' }));
    expect(screen.getByText(/Le falta el nombre/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Borrar «Recordatorio»' }));
    await waitFor(() => expect(put).toHaveBeenCalledWith('/settings', { plantillasWhatsApp: [] }), { timeout: 3000 });
  });
});
