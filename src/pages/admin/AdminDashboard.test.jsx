import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { DateTime } from 'luxon';
import * as AuthContext from '../../contexts/AuthContext.jsx';
import { AppTestShell } from '../../test/AppTestShell.jsx';
import AdminDashboard from './AdminDashboard.jsx';

const hoy = DateTime.now().setZone('America/Argentina/Buenos_Aires');
const dentroDe = (n) => hoy.plus({ days: n }).toISODate();
const mes = (n) => hoy.minus({ months: n }).toFormat('yyyy-MM');

/* El catálogo como lo devuelve el back (forma reducida pero real). */
const CATALOGO = [
  { id: 'pendientes', visible: true, ancho: 'entera', opciones: { mostrar: { tipo: 'lista', valores: ['personas', 'inscripciones', 'comprobantes'], defecto: ['personas', 'inscripciones', 'comprobantes'] } } },
  { id: 'numeros', visible: true, ancho: 'entera', opciones: { cuales: { tipo: 'lista', valores: ['vinieron', 'vuelven', 'veces', 'cubrio', 'nuevos', 'recaudado'], defecto: ['vinieron', 'vuelven', 'veces', 'cubrio'] }, meses: { tipo: 'uno', valores: [3, 6, 12], defecto: 6 } } },
  { id: 'semana', visible: true, ancho: 'entera', opciones: { borradores: { tipo: 'si_no', defecto: false } } },
  { id: 'proximo', visible: true, ancho: 'media', opciones: { criterio: { tipo: 'uno', valores: ['mas_gente', 'mas_cercano'], defecto: 'mas_gente' }, dias: { tipo: 'uno', valores: [3, 7, 14], defecto: 7 } } },
  { id: 'cumples', visible: true, ancho: 'media', opciones: { semanaQueViene: { tipo: 'si_no', defecto: true } } },
  { id: 'plata', visible: false, ancho: 'media', opciones: { comparar: { tipo: 'si_no', defecto: true } } },
];
const DE_SIEMPRE = CATALOGO.map((c) => ({ id: c.id, visible: c.visible, ancho: c.ancho, opciones: Object.fromEntries(Object.entries(c.opciones).map(([k, o]) => [k, o.defecto])) }));

const PENDIENTE_VACIO = { cantidad: 0, actividades: [], nombres: [], masAntigua: null };

function mockPanel({ pendientes = {}, cumples = {}, actividades = [] } = {}) {
  return vi.spyOn(axios, 'get').mockImplementation((url) => {
    if (url === '/admin/hoy') {
      return Promise.resolve({
        data: {
          personas: { cantidad: 0, nombres: [], masAntigua: null },
          inscripciones: PENDIENTE_VACIO,
          comprobantes: PENDIENTE_VACIO,
          ...pendientes,
        },
      });
    }
    if (url === '/admin/birthdays') return Promise.resolve({ data: { hoy: [], estaSemana: [], proximaSemana: [], total: 0, sinFecha: 0, ...cumples } });
    if (url === '/admin/metrics') {
      return Promise.resolve({
        data: {
          personas: {
            vuelven: { cohorte: 10, volvieron: 6, porcentaje: 60 },
            porMes: [5, 4, 3, 2, 1, 0].map((n, i) => ({ mes: mes(n), personas: 10 + i, nuevas: i, frecuencia: 1.5 })),
          },
          plata: { porMes: [5, 4, 3, 2, 1, 0].map((n) => ({ mes: mes(n), recaudado: 700, gastado: 1000 })) },
        },
      });
    }
    if (url === '/admin/actividades-resumen') {
      return Promise.resolve({ data: { semana: { desde: dentroDe(-3), hasta: dentroDe(3), hoy: hoy.toISODate() }, actividades } });
    }
    if (url === '/admin/inicio') return Promise.resolve({ data: { bloques: DE_SIEMPRE, personalizado: false, catalogo: CATALOGO } });
    if (url === '/tags') return Promise.resolve({ data: { tags: [] } });
    if (url === '/settings') return Promise.resolve({ data: { settings: { whatsappCumpleanosMensaje: '¡Feliz cumple, {nombre}!' } } });
    return Promise.reject(new Error(`unexpected GET ${url}`));
  });
}

const montar = () =>
  render(
    <AppTestShell initialEntries={['/admin']}>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </AppTestShell>,
  );

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: { role: 'admin', nombre: 'Wally' }, loading: false });
  });

  it('saluda por nombre y dice que no hay nada pendiente', async () => {
    mockPanel();
    montar();
    expect(screen.getByRole('heading', { level: 1, name: /Wally/ })).toBeInTheDocument();
    expect(await screen.findByText(/Nada pendiente/)).toBeInTheDocument();
  });

  it('muestra lo pendiente con su acción a un toque', async () => {
    mockPanel({
      pendientes: {
        personas: { cantidad: 2, nombres: ['Noa Feld', 'Uri Kaplan'], masAntigua: hoy.minus({ days: 3 }).toISO() },
        comprobantes: { cantidad: 1, actividades: ['Cena de Shabat'], nombres: ['Ana Groisman'], masAntigua: null },
      },
    });
    montar();
    expect(await screen.findByText('2 personas esperan aprobación')).toBeInTheDocument();
    expect(screen.getByText(/hace 3 días/)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Revisar' }).map((a) => a.getAttribute('href'))).toEqual(['/admin/users/pending', '/admin/inscriptions?comprobantes=1']);
  });

  it('muestra los números del mes y el encuentro grande que viene', async () => {
    mockPanel({
      actividades: [
        {
          id: 'a1',
          titulo: 'Kabbalat Shabbat',
          estado: 'publicada',
          categorias: [],
          cupo: 40,
          semana: [],
          proximo: { fecha: dentroDe(2), texto: 'vie 15 nov', hora: '20:30', aceptadas: 34, enEspera: 3, pendientes: 0, comprobantes: 0, nombres: ['Tamar Levin'] },
        },
      ],
    });
    montar();
    expect(await screen.findByText('Vinieron este mes')).toBeInTheDocument();
    expect(screen.getByText('Vinieron este mes').parentElement).toHaveTextContent('15');
    expect(screen.getByText('60 %')).toBeInTheDocument();
    expect(screen.getByText('70 %')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Kabbalat Shabbat' })).toBeInTheDocument();
    expect(screen.getByText('3 en lista de espera')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lista para el día' })).toHaveAttribute('href', `/admin/activities/a1/inscriptions?fecha=${dentroDe(2)}`);
  });

  it('si una pieza falla, lo demás sale igual', async () => {
    const get = mockPanel();
    const original = get.getMockImplementation();
    get.mockImplementation((url, config) => (url === '/admin/metrics' ? Promise.reject(new Error('caído')) : original(url, config)));
    montar();
    expect(await screen.findByText(/Nada pendiente/)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Vinieron este mes')).not.toBeInTheDocument());
  });

  it('«Armar mi panel» edita sobre la misma pantalla: ocultar, sumar y Cancelar vuelve todo atrás', async () => {
    mockPanel();
    const user = userEvent.setup();
    montar();
    await user.click(await screen.findByRole('button', { name: 'Armar mi panel' }));
    expect(screen.getByText('Estás armando tu panel')).toBeInTheDocument();
    const bandeja = screen.getByRole('region', { name: 'Para sumar' });
    expect(within(bandeja).getByText('La plata del mes')).toBeInTheDocument();

    await user.click(within(bandeja).getByText('La plata del mes'));
    expect(within(bandeja).queryByText('La plata del mes')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Ocultar' })).toHaveLength(6);

    await user.click(screen.getAllByRole('button', { name: 'Cancelar' })[0]);
    expect(screen.queryByText('Estás armando tu panel')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'La plata del mes' })).not.toBeInTheDocument();
  });

  it('Guardar manda el orden y lo elegido al servidor', async () => {
    mockPanel();
    const put = vi.spyOn(axios, 'put').mockImplementation((url, body) => Promise.resolve({ data: { bloques: body.bloques, personalizado: true, catalogo: CATALOGO } }));
    const user = userEvent.setup();
    montar();
    await user.click(await screen.findByRole('button', { name: 'Armar mi panel' }));
    await user.click(screen.getAllByRole('button', { name: 'Bajar' })[0]); // «Para hacer» pasa abajo de los números
    await user.click(screen.getAllByRole('button', { name: 'Guardar' })[0]);
    await waitFor(() => expect(put).toHaveBeenCalled());
    const [url, body] = put.mock.calls[0];
    expect(url).toBe('/admin/inicio');
    expect(body.bloques.map((b) => b.id).slice(0, 2)).toEqual(['numeros', 'pendientes']);
  });

  it('el engranaje de un bloque cambia sólo sus opciones, y el bloque cambia al momento', async () => {
    mockPanel();
    const put = vi.spyOn(axios, 'put').mockImplementation((url, body) => Promise.resolve({ data: { bloques: body.bloques, personalizado: true, catalogo: CATALOGO } }));
    const user = userEvent.setup();
    montar();
    await user.click(await screen.findByRole('button', { name: 'Opciones de «Los números del mes»' }));
    expect(screen.queryByText('Estás armando tu panel')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Recaudado este mes' }));
    expect(screen.getByText('Recaudado este mes', { selector: 'a span' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Guardar/ }));
    await waitFor(() => expect(put).toHaveBeenCalled());
    expect(put.mock.calls[0][1].bloques.find((b) => b.id === 'numeros').opciones.cuales).toContain('recaudado');
  });
});
