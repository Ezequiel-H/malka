import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';

const PendingUsers = () => {
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/users/pending');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await axios.put(`/users/${userId}/approve`);
      showSuccess('Usuario aprobado exitosamente');
      fetchUsers();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al aprobar usuario');
    }
  };

  const handleReject = async (userId) => {
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

  const handleEdit = (userId) => {
    navigate(`/admin/users/edit/${userId}`);
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
        <h1 className="text-4xl font-bold mb-8 text-primary">Usuarios Pendientes de Aprobación</h1>

        {users.length === 0 ? (
          <div className="card">
            <p className="text-gray-600 text-center py-4">No hay usuarios pendientes de aprobación.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map(user => (
              <div key={user._id} className="card hover:shadow-xl transition-shadow">
                <h2 className="text-xl font-bold mb-2 text-gray-800">{user.nombre} {user.apellido}</h2>
                <p className="text-gray-600 mb-4">{user.email}</p>
                {user.telefono && <p className="mb-2"><strong>Teléfono:</strong> {user.telefono}</p>}

                {user.tags && user.tags.length > 0 && (
                  <div className="mb-4">
                    <strong className="text-gray-700 block mb-2">Tags:</strong>
                    <div className="flex flex-wrap gap-2">
                      {user.tags.map(tag => (
                        <span key={tag} className="badge badge-info">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {user.intereses && user.intereses.length > 0 && (
                  <div className="mb-4">
                    <strong className="text-gray-700 block mb-1">Intereses:</strong>
                    <p className="text-gray-600 text-sm">{user.intereses.join(', ')}</p>
                  </div>
                )}

                {user.categoriasArtisticas && user.categoriasArtisticas.length > 0 && (
                  <div className="mb-4">
                    <strong className="text-gray-700 block mb-1">Categorías:</strong>
                    <p className="text-gray-600 text-sm">{user.categoriasArtisticas.join(', ')}</p>
                  </div>
                )}

                <div className="flex gap-2 mt-6 flex-wrap">
                  <button
                    onClick={() => handleApprove(user._id)}
                    className="btn btn-success flex-1 min-w-[100px]"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleReject(user._id)}
                    className="btn btn-danger flex-1 min-w-[100px]"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleEdit(user._id)}
                    className="btn btn-secondary flex-1 min-w-[100px]"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingUsers;

