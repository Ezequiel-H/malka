import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    pendingUsers: 0,
    totalActivities: 0,
    publishedActivities: 0,
    totalInscriptions: 0,
    pendingInscriptions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to be ready before fetching stats
    if (!authLoading && user) {
      fetchStats();
    }
  }, [authLoading, user]);

  const fetchStats = async () => {
    try {
      const [usersRes, activitiesRes, inscriptionsRes, pendingInscriptionsRes] = await Promise.all([
        axios.get('/users/pending'),
        axios.get('/activities?estado=publicada'),
        axios.get('/inscriptions').catch(() => ({ data: { inscriptions: [], count: 0 } })),
        axios.get('/inscriptions?estado=pendiente').catch(() => ({ data: { inscriptions: [], count: 0 } }))
      ]);

      setStats({
        pendingUsers: usersRes.data.users?.length || 0,
        totalActivities: activitiesRes.data.count || 0,
        publishedActivities: activitiesRes.data.count || 0,
        totalInscriptions: inscriptionsRes.data.count || 0,
        pendingInscriptions: pendingInscriptionsRes.data.count || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-light-bg flex flex-col items-center justify-center">
        <div className="spinner"></div>
        <p className="mt-4 text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-primary">Panel de Administración</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card text-center hover:shadow-xl transition-shadow">
            <h2 className="text-5xl font-bold text-yellow-500 mb-3">
              {stats.pendingUsers}
            </h2>
            <p className="text-lg font-bold text-gray-800 mb-4">Usuarios Pendientes</p>
            <Link to="/admin/users/pending" className="btn btn-warning">
              Ver Pendientes
            </Link>
          </div>

          <div className="card text-center hover:shadow-xl transition-shadow">
            <h2 className="text-5xl font-bold text-primary mb-3">
              {stats.publishedActivities}
            </h2>
            <p className="text-lg font-bold text-gray-800 mb-4">Actividades Publicadas</p>
            <Link to="/admin/activities" className="btn btn-primary">
              Gestionar Actividades
            </Link>
          </div>

          <div className="card text-center hover:shadow-xl transition-shadow">
            <h2 className="text-5xl font-bold text-orange-500 mb-3">
              {stats.pendingInscriptions}
            </h2>
            <p className="text-lg font-bold text-gray-800 mb-4">Inscripciones Pendientes</p>
            <Link to="/admin/inscriptions?estado=pendiente" className="btn btn-warning">
              Gestionar Inscripciones
            </Link>
          </div>

          <div className="card text-center hover:shadow-xl transition-shadow">
            <h2 className="text-5xl font-bold text-green-600 mb-3">
              {stats.totalInscriptions}
            </h2>
            <p className="text-lg font-bold text-gray-800 mb-4">Total Inscripciones</p>
            <Link to="/admin/inscriptions" className="btn btn-success">
              Ver Todas
            </Link>
          </div>

          <div className="card text-center hover:shadow-xl transition-shadow">
            <h2 className="text-5xl font-bold text-gray-500 mb-3">
              <Link to="/admin/users" className="no-underline text-inherit hover:text-gray-600 transition-colors">
                👥
              </Link>
            </h2>
            <p className="text-lg font-bold text-gray-800 mb-4">Gestionar Usuarios</p>
            <Link to="/admin/users" className="btn btn-secondary">
              Ver Usuarios
            </Link>
          </div>

          <div className="card text-center hover:shadow-xl transition-shadow">
            <h2 className="text-5xl font-bold text-purple-500 mb-3">
              🏷️
            </h2>
            <p className="text-lg font-bold text-gray-800 mb-4">Gestionar Tags</p>
            <Link to="/admin/tags" className="btn btn-primary">
              Ver Tags
            </Link>
          </div>
        </div>

        <div className="card">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Acciones Rápidas</h2>
          <div className="flex flex-wrap gap-4">
            <Link to="/admin/activities/new" className="btn btn-primary">
              Crear Nueva Actividad
            </Link>
            <Link to="/admin/users/pending" className="btn btn-warning">
              Revisar Usuarios Pendientes
            </Link>
            <Link to="/admin/inscriptions?estado=pendiente" className="btn btn-warning">
              Confirmar Inscripciones
            </Link>
            <Link to="/admin/users" className="btn btn-secondary">
              Ver Todos los Usuarios
            </Link>
            <Link to="/admin/tags" className="btn btn-primary">
              Gestionar Tags
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

