import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';

const UsersManagement = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    estado: '',
    role: '',
    search: ''
  });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await axios.get(`/users?${params.toString()}`);
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      approved: { class: 'badge-success', text: 'Aprobado' },
      pending: { class: 'badge-warning', text: 'Pendiente' },
      rejected: { class: 'badge-danger', text: 'Rechazado' }
    };
    const badge = badges[estado] || badges.pending;
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
  };

  const handleApprove = async (userId, e) => {
    e.stopPropagation(); // Prevenir que se active el click del row
    try {
      await axios.put(`/users/${userId}/approve`);
      showSuccess('Usuario aprobado exitosamente');
      fetchUsers();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al aprobar usuario');
    }
  };

  const handleReject = async (userId, e) => {
    e.stopPropagation(); // Prevenir que se active el click del row
    if (!window.confirm('¿Estás seguro de que deseas rechazar a este usuario?')) {
      return;
    }
    try {
      await axios.put(`/users/${userId}/reject`);
      showSuccess('Usuario rechazado');
      fetchUsers();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al rechazar usuario');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light-bg flex flex-col items-center justify-center">
        <div className="spinner"></div>
        <p className="mt-4 text-gray-600">Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-primary">Gestión de Usuarios</h1>

        {/* Filtros */}
        <div className="card mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Filtros</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="form-group">
              <label>Buscar</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Nombre, apellido o email..."
                className="bg-white"
              />
            </div>

            <div className="form-group">
              <label>Estado</label>
              <select
                value={filters.estado}
                onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
                className="bg-white"
              >
                <option value="">Todos</option>
                <option value="approved">Aprobado</option>
                <option value="pending">Pendiente</option>
                <option value="rejected">Rechazado</option>
              </select>
            </div>

            <div className="form-group">
              <label>Rol</label>
              <select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                className="bg-white"
              >
                <option value="">Todos</option>
                <option value="participant">Participante</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de usuarios */}
        {users.length === 0 ? (
          <div className="card">
            <p className="text-gray-600 text-center py-4">No se encontraron usuarios con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="p-4 text-left font-semibold text-gray-700">Nombre</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Email</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Rol</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Estado</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Tags</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr 
                    key={user._id} 
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/users/${user._id}`)}
                  >
                    <td className="p-4">{user.nombre} {user.apellido}</td>
                    <td className="p-4">{user.email}</td>
                    <td className="p-4">
                      <span className="badge badge-secondary">
                        {user.role === 'admin' ? 'Admin' : 'Participante'}
                      </span>
                    </td>
                    <td className="p-4">{getEstadoBadge(user.estado)}</td>
                    <td className="p-4">
                      {user.tags && user.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {user.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="badge badge-info">
                              {tag}
                            </span>
                          ))}
                          {user.tags.length > 3 && (
                            <span className="badge badge-secondary">
                              +{user.tags.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin tags</span>
                      )}
                    </td>
                    <td className="p-4">
                      {user.estado === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => handleApprove(user._id, e)}
                            className="btn btn-success btn-sm"
                            title="Aprobar usuario"
                          >
                            Aceptar
                          </button>
                          <button
                            onClick={(e) => handleReject(user._id, e)}
                            className="btn btn-danger btn-sm"
                            title="Rechazar usuario"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersManagement;

