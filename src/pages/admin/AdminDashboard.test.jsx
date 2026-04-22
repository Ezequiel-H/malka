import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import * as AuthContext from '../../contexts/AuthContext.jsx';
import { AppTestShell } from '../../test/AppTestShell.jsx';
import AdminDashboard from './AdminDashboard.jsx';

function mockAxiosDashboard() {
  return vi.spyOn(axios, 'get').mockImplementation((url, config) => {
    if (url === '/users/pending') {
      return Promise.resolve({ data: { users: [] } });
    }
    if (url === '/activities?estado=publicada') {
      return Promise.resolve({ data: { count: 1, activities: [] } });
    }
    if (url === '/activities') {
      return Promise.resolve({
        data: {
          activities: [
            { _id: '507f1f77bcf86cd799439011', titulo: 'Actividad demo' },
            { _id: '507f1f77bcf86cd799439012', titulo: 'Otra' }
          ]
        }
      });
    }
    if (url === '/inscriptions/stats/accepted-last-30-days') {
      return Promise.resolve({ data: { count: 2 } });
    }
    if (String(url).startsWith('/inscriptions?estado=pendiente')) {
      return Promise.resolve({ data: { inscriptions: [], count: 0 } });
    }
    if (url === '/admin/first-inscription-repeat-stats') {
      return Promise.resolve({
        data: {
          cohortSize: 20,
          withMoreThanOneInscription: 5,
          minDaysSinceFirstInscription: 15,
          rate: 0.25
        }
      });
    }
    if (url === '/admin/inscription-stats') {
      const activityId = config?.params?.activityId;
      if (activityId === '507f1f77bcf86cd799439011') {
        return Promise.resolve({
          data: {
            weeklyNewInscriptions: [{ weekStart: '2025-01-06T00:00:00.000Z', count: 1 }],
            topOccurrencesAccepted: []
          }
        });
      }
      return Promise.resolve({
        data: {
          weeklyNewInscriptions: [{ weekStart: '2025-01-06T00:00:00.000Z', count: 5 }],
          topOccurrencesAccepted: [
            {
              activityId: '507f1f77bcf86cd799439011',
              occurrenceDate: '2025-01-15',
              titulo: 'Actividad demo',
              count: 3
            }
          ]
        }
      });
    }
    return Promise.reject(new Error(`unexpected GET ${url}`));
  });
}

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { role: 'admin', nombre: 'Admin' },
      loading: false
    });
    mockAxiosDashboard();
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

  it('shows first-inscription repeat stats', async () => {
    render(
      <AppTestShell initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </AppTestShell>
    );

    await waitFor(() => {
      expect(screen.getByText(/Retorno tras primera inscripción/i)).toBeInTheDocument();
    });
    expect(screen.getByText('25.0 % con más de una inscripción')).toBeInTheDocument();
  });

  it('loads inscription stats sections and top table', async () => {
    render(
      <AppTestShell initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </AppTestShell>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Inscripciones nuevas por semana/i })).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getAllByText('Actividad demo').length).toBeGreaterThanOrEqual(1);
    });
    const inscLink = screen.getByRole('link', { name: /^Inscripciones$/ });
    expect(inscLink).toHaveAttribute(
      'href',
      '/admin/activities/507f1f77bcf86cd799439011/inscriptions?fecha=2025-01-15'
    );
  });

  it('requests per-activity stats when an activity is selected', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    render(
      <AppTestShell initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </AppTestShell>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Actividad/i)).toBeInTheDocument();
    });
    await user.selectOptions(screen.getByLabelText(/Actividad/i), '507f1f77bcf86cd799439011');

    await waitFor(() => {
      const calls = axios.get.mock.calls.filter((c) => c[0] === '/admin/inscription-stats');
      const withActivity = calls.some((c) => c[1]?.params?.activityId === '507f1f77bcf86cd799439011');
      expect(withActivity).toBe(true);
    });
  });
});
