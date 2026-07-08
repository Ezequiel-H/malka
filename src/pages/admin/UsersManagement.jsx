import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import LoadingScreen from '../../components/layout/LoadingScreen';
import PageContainer from '../../components/layout/PageContainer';
import EmptyState from '../../components/common/EmptyState';
import UserStatusBadge from '../../components/users/UserStatusBadge';

const UsersManagement = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({
    estado: '',
    role: '',
    search: ''
  });

  const debouncedSearch = useDebounce(searchInput, 350);

  useEffect(() => {
    setFilters(prev => (
      prev.search === debouncedSearch ? prev : { ...prev, search: debouncedSearch }
    ));
  }, [debouncedSearch]);

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
      setInitialLoad(false);
    }
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

  if (initialLoad) {
    return <LoadingScreen message="Cargando usuarios..." />;
  }

  return (
    <PageContainer title="Gestión de Usuarios">

        {/* Filtros */}
        <div className="card mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-800">Filtros</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="form-group">
              <label>Buscar</label>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
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
        <div className={loading ? 'opacity-50 transition-opacity pointer-events-none' : 'transition-opacity'}>
        {users.length === 0 ? (
          <EmptyState message="No se encontraron usuarios con los filtros seleccionados." />
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="p-4 text-left align-middle font-semibold text-gray-700">Nombre</th>
                  <th className="p-4 text-left align-middle font-semibold text-gray-700">Email</th>
                  <th className="p-4 text-left align-middle font-semibold text-gray-700">Rol</th>
                  <th className="p-4 text-left align-middle font-semibold text-gray-700">Estado</th>
                  <th className="p-4 text-left align-middle font-semibold text-gray-700">Tags</th>
                  <th className="p-4 text-left align-middle font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr 
                    key={user._id} 
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/users/${user._id}`)}
                  >
                    <td className="p-4 align-middle">{user.nombre} {user.apellido}</td>
                    <td className="p-4 align-middle">{user.email}</td>
                    <td className="p-4 align-middle">
                      <span className="badge badge-secondary">
                        {user.role === 'admin' ? 'Admin' : 'Participante'}
                      </span>
                    </td>
                    <td className="p-4 align-middle"><UserStatusBadge estado={user.estado} /></td>
                    <td className="p-4 align-middle">
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
                    <td className="p-4 align-middle">
                      {user.estado === 'pending' && (
                        <div className="flex items-center gap-2">
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
    </PageContainer>
  );
};

export default UsersManagement;

