import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { DateTime } from 'luxon';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import {
  defaultFourWeeksArgentinaRange,
  isoWeekMondaySlotsArgentina,
  mergeWeeklyCounts
} from '../../utils/adminDashboardDates';

const TOP_LIMIT = 10;
const AR_TZ = 'America/Argentina/Buenos_Aires';

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    pendingUsers: 0,
    publishedActivities: 0,
    acceptedInscriptionsLast30Days: 0,
    pendingInscriptions: 0,
    firstInscriptionRepeat: {
      cohortSize: 0,
      withMoreThanOneInscription: 0,
      minDaysSinceFirstInscription: 15,
      rate: null
    }
  });
  const [loading, setLoading] = useState(true);

  const [{ from, to }, setRange] = useState(() => defaultFourWeeksArgentinaRange());
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState(null);
  const [weeklyGlobal, setWeeklyGlobal] = useState([]);
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [topOccurrences, setTopOccurrences] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedActivityId, setSelectedActivityId] = useState('');

  const fetchStats = async () => {
    try {
      const [usersRes, activitiesRes, acceptedRecentRes, pendingInscriptionsRes, repeatRes] =
        await Promise.all([
          axios.get('/users/pending'),
          axios.get('/activities?estado=publicada'),
          axios.get('/inscriptions/stats/accepted-last-30-days').catch(() => ({ data: { count: 0 } })),
          axios.get('/inscriptions?estado=pendiente').catch(() => ({ data: { inscriptions: [], count: 0 } })),
          axios
            .get('/admin/first-inscription-repeat-stats')
            .catch(() => ({
              data: {
                cohortSize: 0,
                withMoreThanOneInscription: 0,
                minDaysSinceFirstInscription: 15,
                rate: null
              }
            }))
        ]);

      const fr = repeatRes.data || {};
      setStats({
        pendingUsers: usersRes.data.users?.length || 0,
        publishedActivities: activitiesRes.data.count || 0,
        acceptedInscriptionsLast30Days: acceptedRecentRes.data.count ?? 0,
        pendingInscriptions: pendingInscriptionsRes.data.count || 0,
        firstInscriptionRepeat: {
          cohortSize: fr.cohortSize ?? 0,
          withMoreThanOneInscription: fr.withMoreThanOneInscription ?? 0,
          minDaysSinceFirstInscription: fr.minDaysSinceFirstInscription ?? 15,
          rate: fr.rate ?? null
        }
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActivitiesOptions = useCallback(async () => {
    try {
      const res = await axios.get('/activities');
      const list = (res.data.activities || []).filter((a) => a.estado !== 'eliminada');
      const sorted = [...list].sort((a, b) =>
        String(a.titulo || '').localeCompare(String(b.titulo || ''), 'es', { sensitivity: 'base' })
      );
      setActivities(sorted);
      setSelectedActivityId((prev) =>
        prev && !sorted.some((a) => String(a._id) === String(prev)) ? '' : prev
      );
    } catch (e) {
      console.error('Error loading activities for dashboard:', e);
    }
  }, []);

  const loadInscriptionCharts = useCallback(async () => {
    setChartLoading(true);
    setChartError(null);
    try {
      const params = { from, to, limit: TOP_LIMIT };
      const requests = [axios.get('/admin/inscription-stats', { params })];
      if (selectedActivityId) {
        requests.push(
          axios.get('/admin/inscription-stats', {
            params: { ...params, activityId: selectedActivityId }
          })
        );
      }
      const results = await Promise.all(requests);
      const globalData = results[0].data;
      const slots = isoWeekMondaySlotsArgentina(from, to);
      setWeeklyGlobal(mergeWeeklyCounts(slots, globalData.weeklyNewInscriptions));
      setTopOccurrences(globalData.topOccurrencesAccepted || []);
      if (selectedActivityId && results[1]) {
        setWeeklyActivity(mergeWeeklyCounts(slots, results[1].data.weeklyNewInscriptions));
      } else {
        setWeeklyActivity([]);
      }
    } catch (e) {
      console.error(e);
      setChartError(e.response?.data?.message || 'No se pudieron cargar las estadísticas de inscripciones.');
      setWeeklyGlobal([]);
      setWeeklyActivity([]);
      setTopOccurrences([]);
    } finally {
      setChartLoading(false);
    }
  }, [from, to, selectedActivityId]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchStats();
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (!authLoading && user?.role === 'admin') {
      loadActivitiesOptions();
    }
  }, [authLoading, user, loadActivitiesOptions]);

  useEffect(() => {
    if (!authLoading && user?.role === 'admin') {
      loadInscriptionCharts();
    }
  }, [authLoading, user, loadInscriptionCharts]);

  const handleRangeChange = (field, value) => {
    setRange((prev) => ({ ...prev, [field]: value }));
  };

  const chartCommon = useMemo(
    () => ({
      margin: { top: 8, right: 8, left: 0, bottom: 0 }
    }),
    []
  );

  const weeklyTooltipLabel = useCallback((_, payload) => {
    const tick = payload?.[0]?.payload?.weekTick;
    return tick ? `Semana desde ${tick}` : '';
  }, []);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-light-bg flex flex-col items-center justify-center">
        <div className="spinner"></div>
        <p className="mt-4 text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto min-w-0">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-primary">
          Panel de Administración
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          <div className="card text-center hover:shadow-xl transition-shadow">
            <h2 className="text-4xl sm:text-5xl font-bold text-yellow-500 mb-3">{stats.pendingUsers}</h2>
            <p className="text-lg font-bold text-gray-800 mb-4">Usuarios Pendientes</p>
            <Link to="/admin/users/pending" className="btn btn-warning">
              Ver Pendientes
            </Link>
          </div>

          <div className="card text-center hover:shadow-xl transition-shadow">
            <h2 className="text-4xl sm:text-5xl font-bold text-primary mb-3">{stats.publishedActivities}</h2>
            <p className="text-lg font-bold text-gray-800 mb-4">Actividades Publicadas</p>
            <Link to="/admin/activities" className="btn btn-primary">
              Gestionar Actividades
            </Link>
          </div>

          <div className="card text-center hover:shadow-xl transition-shadow">
            <h2 className="text-4xl sm:text-5xl font-bold text-orange-500 mb-3">{stats.pendingInscriptions}</h2>
            <p className="text-lg font-bold text-gray-800 mb-4">Inscripciones Pendientes</p>
            <Link to="/admin/inscriptions?estado=pendiente" className="btn btn-warning">
              Gestionar Inscripciones
            </Link>
          </div>

          <div className="card text-center hover:shadow-xl transition-shadow">
            <h2 className="text-4xl sm:text-5xl font-bold text-green-600 mb-3">
              {stats.acceptedInscriptionsLast30Days}
            </h2>
            <p className="text-lg font-bold text-gray-800 mb-4">Inscripciones aceptadas (últimos 30 días)</p>
            <Link to="/admin/inscriptions?estado=aceptada" className="btn btn-success">
              Ver aceptadas
            </Link>
          </div>

          <div className="card text-center hover:shadow-xl transition-shadow">
            <h2 className="text-3xl sm:text-4xl font-bold text-teal-600 mb-1 tabular-nums">
              {stats.firstInscriptionRepeat.withMoreThanOneInscription}
              <span className="text-2xl font-semibold text-gray-500"> / </span>
              {stats.firstInscriptionRepeat.cohortSize}
            </h2>
            <p className="text-sm text-gray-600 mb-2 tabular-nums">
              {stats.firstInscriptionRepeat.cohortSize > 0 && stats.firstInscriptionRepeat.rate != null
                ? `${(stats.firstInscriptionRepeat.rate * 100).toFixed(1)} % con más de una inscripción`
                : '—'}
            </p>
            <p className="text-lg font-bold text-gray-800 mb-2">
              Retorno tras primera inscripción ({stats.firstInscriptionRepeat.minDaysSinceFirstInscription}+ días)
            </p>
            <p className="text-xs text-gray-500 mb-4 px-1">
              Entre quienes se anotaron a un evento por primera vez hace al menos{' '}
              {stats.firstInscriptionRepeat.minDaysSinceFirstInscription} días, cuántos
              tienen más de un evento total. Cualquier estado de inscripción.
            </p>
            <Link to="/admin/inscriptions" className="btn btn-outline btn-sm border-teal-600 text-teal-700">
              Ver inscripciones
            </Link>
          </div>
        </div>

        <section className="card mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Inscripciones nuevas por semana</h2>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="flex min-w-0 flex-col gap-1 text-sm font-medium text-gray-700">
              Desde
              <input
                type="date"
                value={from}
                onChange={(e) => handleRangeChange('from', e.target.value)}
                className="rounded border border-gray-300 px-3 py-2 text-gray-800"
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1 text-sm font-medium text-gray-700">
              Hasta
              <input
                type="date"
                value={to}
                onChange={(e) => handleRangeChange('to', e.target.value)}
                className="rounded border border-gray-300 px-3 py-2 text-gray-800"
              />
            </label>
          </div>

          {chartError && (
            <div className="alert alert-error mb-4" role="alert">
              {chartError}
            </div>
          )}

          {chartLoading ? (
            <div className="flex h-64 items-center justify-center text-gray-600">Cargando estadísticas…</div>
          ) : (
            <div className="h-72 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyGlobal} {...chartCommon}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="weekTick" tick={{ fontSize: 11 }} interval={0} angle={-35} textAnchor="end" height={50} />
                  <YAxis allowDecimals={false} width={36} />
                  <Tooltip
                    formatter={(value) => [value, 'Nuevas inscripciones']}
                    labelFormatter={weeklyTooltipLabel}
                  />
                  <Bar dataKey="count" fill="#689b78" name="Nuevas" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="card mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Por actividad</h2>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label
              htmlFor="admin-dashboard-activity"
              className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium text-gray-700"
            >
              Actividad
              <select
                id="admin-dashboard-activity"
                value={selectedActivityId}
                onChange={(e) => setSelectedActivityId(e.target.value)}
                className="w-full min-w-0 rounded border border-gray-300 bg-white px-3 py-2 text-gray-800"
              >
                <option value="">— Elegí una actividad —</option>
                {activities.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.titulo}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {!selectedActivityId ? (
            <p className="text-center text-gray-500 py-12">Elegí una actividad para ver el gráfico.</p>
          ) : chartLoading ? (
            <div className="flex h-64 items-center justify-center text-gray-600">Cargando…</div>
          ) : (
            <div className="h-72 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyActivity} {...chartCommon}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="weekTick" tick={{ fontSize: 11 }} interval={0} angle={-35} textAnchor="end" height={50} />
                  <YAxis allowDecimals={false} width={36} />
                  <Tooltip
                    formatter={(value) => [value, 'Nuevas inscripciones']}
                    labelFormatter={weeklyTooltipLabel}
                  />
                  <Bar dataKey="count" fill="#0d9488" name="Nuevas" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="card mb-8 overflow-x-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Top {TOP_LIMIT} ocurrencias (inscripciones aceptadas)</h2>
          {chartLoading ? (
            <p className="text-gray-600 py-8 text-center">Cargando…</p>
          ) : topOccurrences.length === 0 ? (
            <p className="text-gray-600 py-8 text-center">No hay datos en este período.</p>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-600">
                  <th className="py-2 pr-4 font-semibold">Actividad</th>
                  <th className="py-2 pr-4 font-semibold">Fecha de la clase</th>
                  <th className="py-2 pr-4 font-semibold text-right">Aceptadas</th>
                  <th className="py-2 font-semibold"> </th>
                </tr>
              </thead>
              <tbody>
                {topOccurrences.map((row) => (
                  <tr key={`${row.activityId}-${row.occurrenceDate}`} className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-medium text-gray-900">{row.titulo || '—'}</td>
                    <td className="py-2 pr-4 tabular-nums text-gray-700">
                      {DateTime.fromFormat(String(row.occurrenceDate), 'yyyy-LL-dd', { zone: AR_TZ })
                        .setLocale('es-AR')
                        .toLocaleString(DateTime.DATE_MED)}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">{row.count}</td>
                    <td className="py-2">
                      <Link
                        to={`/admin/activities/${row.activityId}/inscriptions?fecha=${encodeURIComponent(row.occurrenceDate)}`}
                        className="text-primary hover:underline font-medium"
                      >
                        Inscripciones
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
