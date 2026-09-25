import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { DateTime } from 'luxon';
import LoadingScreen from '../../components/layout/LoadingScreen';
import PageContainer from '../../components/layout/PageContainer';
import UpcomingBirthdays from '../../components/admin/UpcomingBirthdays';
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
import { Alert, Badge, Button, Card, DatePicker, Field, Icon, Select } from '../../components/ui';
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
  const [showReturnInfo, setShowReturnInfo] = useState(false);

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

  const activityOptions = activities.map((a) => ({ value: a._id, label: a.titulo }));

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  return (
    <PageContainer title="Panel">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          {/* Tarjeta de métrica: el número es el protagonista, en tinta. La card
              entera navega; el pie con flecha sólo lo insinúa. Cinco botones de
              colores acá arriba convertían el panel en un semáforo. */}
          {[
            {
              value: stats.pendingUsers,
              label: 'Usuarios pendientes',
              to: '/admin/users/pending',
              cta: 'Ver pendientes',
              icon: 'users',
              attention: stats.pendingUsers > 0,
            },
            {
              value: stats.publishedActivities,
              label: 'Actividades publicadas',
              to: '/admin/activities',
              cta: 'Gestionar',
              icon: 'activity',
            },
            {
              value: stats.pendingInscriptions,
              label: 'Inscripciones pendientes',
              to: '/admin/inscriptions?estado=pendiente',
              cta: 'Gestionar',
              icon: 'document',
              attention: stats.pendingInscriptions > 0,
            },
            {
              value: stats.acceptedInscriptionsLast30Days,
              label: 'Aceptadas (últimos 30 días)',
              to: '/admin/inscriptions?estado=aceptada',
              cta: 'Ver aceptadas',
              icon: 'success',
            },
          ].map((card) => (
            <Card key={card.label} to={card.to} interactive className="group flex flex-col">
              <div className="mb-4 flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-control bg-primary-50 text-primary">
                  <Icon name={card.icon} size="md" />
                </span>
                {card.attention && (
                  <Badge tone="warning" dot size="sm">
                    Atención
                  </Badge>
                )}
              </div>

              <p className="text-3xl font-bold tabular-nums tracking-tight text-ink sm:text-4xl">
                {card.value}
              </p>
              <p className="mt-1 text-sm text-ink-muted">{card.label}</p>

              <p className="mt-auto flex items-center gap-1 pt-4 text-sm font-medium text-primary">
                {card.cta}
                <Icon
                  name="forward"
                  size="xs"
                  className="transition-transform duration-fast group-hover:translate-x-0.5 motion-reduce:transition-none"
                />
              </p>
            </Card>
          ))}

          <Card className="flex flex-col">
            <div className="mb-4 flex items-start justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-control bg-info-50 text-info-600">
                <Icon name="users" size="md" />
              </span>
              <div className="relative">
                <button
                  type="button"
                  className="inline-flex h-5 w-5 items-center justify-center rounded-pill border border-surface-border text-ink-muted transition-control duration-fast hover:border-primary-300 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  onClick={() => setShowReturnInfo((prev) => !prev)}
                  aria-expanded={showReturnInfo}
                  aria-label="Mostrar información sobre esta métrica"
                >
                  <Icon name="info" size="xs" />
                </button>
                {showReturnInfo && (
                  <div
                    className="absolute right-0 z-20 mt-2 w-64 rounded-card border border-surface-border bg-surface p-3 text-left text-xs leading-relaxed text-ink-muted shadow-raised"
                    role="tooltip"
                  >
                    Entre quienes se anotaron a un evento por primera vez hace al menos{' '}
                    {stats.firstInscriptionRepeat.minDaysSinceFirstInscription} días, cuántos tienen
                    más de un evento total. Cualquier estado de inscripción.
                  </div>
                )}
              </div>
            </div>

            <p className="text-3xl font-bold tabular-nums tracking-tight text-ink sm:text-4xl">
              {stats.firstInscriptionRepeat.withMoreThanOneInscription}
              <span className="text-xl font-semibold text-ink-faint"> / </span>
              {stats.firstInscriptionRepeat.cohortSize}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              Retorno tras primera inscripción ({stats.firstInscriptionRepeat.minDaysSinceFirstInscription}+ días)
            </p>
            <p className="mt-1 text-xs tabular-nums text-ink-faint">
              {stats.firstInscriptionRepeat.cohortSize > 0 && stats.firstInscriptionRepeat.rate != null
                ? `${(stats.firstInscriptionRepeat.rate * 100).toFixed(1)} % con más de una inscripción`
                : '—'}
            </p>

            <Link
              to="/admin/inscriptions"
              className="mt-auto flex items-center gap-1 pt-4 text-sm font-medium text-primary hover:underline"
            >
              Ver inscripciones
              <Icon name="forward" size="xs" />
            </Link>
          </Card>
        </div>

        <UpcomingBirthdays className="mb-8" />

        <Card as="section" className="mb-8">
          <h2 className="mb-2 text-xl font-bold text-ink">
            Inscripciones nuevas por semana
          </h2>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <Field label="Desde" className="mb-0 min-w-0 sm:w-52">
              <DatePicker value={from} onChange={(value) => handleRangeChange('from', value)} />
            </Field>
            <Field label="Hasta" className="mb-0 min-w-0 sm:w-52">
              <DatePicker value={to} onChange={(value) => handleRangeChange('to', value)} />
            </Field>
          </div>

          {chartError && (
            <Alert tone="danger" className="mb-4">
              {chartError}
            </Alert>
          )}

          {chartLoading ? (
            <div className="flex h-64 items-center justify-center text-ink-muted">Cargando estadísticas…</div>
          ) : (
            <div className="h-72 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyGlobal} {...chartCommon}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ebe4d8" vertical={false} />
                  <XAxis dataKey="weekTick" tick={{ fontSize: 11, fill: '#6b7a72' }} interval={0} angle={-35} textAnchor="end" height={50} axisLine={{ stroke: '#ebe4d8' }} tickLine={false} />
                  <YAxis allowDecimals={false} width={36} tick={{ fontSize: 11, fill: '#6b7a72' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(104, 155, 120, 0.08)' }}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #ebe4d8',
                      boxShadow: '0 8px 20px -6px rgba(44, 61, 52, 0.12)',
                      fontSize: 13,
                    }}
                    formatter={(value) => [value, 'Nuevas inscripciones']}
                    labelFormatter={weeklyTooltipLabel}
                  />
                  <Bar dataKey="count" fill="#689b78" name="Nuevas" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card as="section" className="mb-8">
          <h2 className="mb-2 text-xl font-bold text-ink">Por actividad</h2>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field label="Actividad" htmlFor="admin-dashboard-activity" className="mb-0 min-w-0 flex-1">
              <Select
                options={activityOptions}
                value={selectedActivityId}
                onChange={(value) => setSelectedActivityId(value ?? '')}
                placeholder="— Elegí una actividad —"
                searchable={activityOptions.length > 8}
              />
            </Field>
          </div>
          {!selectedActivityId ? (
            <p className="py-12 text-center text-ink-muted">Elegí una actividad para ver el gráfico.</p>
          ) : chartLoading ? (
            <div className="flex h-64 items-center justify-center text-ink-muted">Cargando…</div>
          ) : (
            <div className="h-72 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyActivity} {...chartCommon}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ebe4d8" vertical={false} />
                  <XAxis dataKey="weekTick" tick={{ fontSize: 11, fill: '#6b7a72' }} interval={0} angle={-35} textAnchor="end" height={50} axisLine={{ stroke: '#ebe4d8' }} tickLine={false} />
                  <YAxis allowDecimals={false} width={36} tick={{ fontSize: 11, fill: '#6b7a72' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(104, 155, 120, 0.08)' }}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #ebe4d8',
                      boxShadow: '0 8px 20px -6px rgba(44, 61, 52, 0.12)',
                      fontSize: 13,
                    }}
                    formatter={(value) => [value, 'Nuevas inscripciones']}
                    labelFormatter={weeklyTooltipLabel}
                  />
                  <Bar dataKey="count" fill="#3d7d99" name="Nuevas" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card as="section" className="mb-8 overflow-x-auto">
          <h2 className="mb-2 text-xl font-bold text-ink">
            Top {TOP_LIMIT} ocurrencias (inscripciones aceptadas)
          </h2>
          {chartLoading ? (
            <p className="py-8 text-center text-ink-muted">Cargando…</p>
          ) : topOccurrences.length === 0 ? (
            <p className="py-8 text-center text-ink-muted">No hay datos en este período.</p>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-border text-ink-muted">
                  <th className="py-2 pr-4 font-semibold">Actividad</th>
                  <th className="py-2 pr-4 font-semibold">Fecha de la clase</th>
                  <th className="py-2 pr-4 font-semibold text-right">Aceptadas</th>
                  <th className="py-2 font-semibold"> </th>
                </tr>
              </thead>
              <tbody>
                {topOccurrences.map((row) => (
                  <tr key={`${row.activityId}-${row.occurrenceDate}`} className="border-b border-surface-border">
                    <td className="py-2 pr-4 font-medium text-ink">{row.titulo || '—'}</td>
                    <td className="py-2 pr-4 tabular-nums text-ink-soft">
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
        </Card>
    </PageContainer>
  );
};

export default AdminDashboard;
