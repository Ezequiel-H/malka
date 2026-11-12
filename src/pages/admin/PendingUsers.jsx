import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import PageContainer from '../../components/layout/PageContainer';
import { Badge, Button, Card, EmptyState, useConfirm,
  SkeletonCards,
} from '../../components/ui';
import { etiquetaResidencia, nombrePais } from '../../utils/paises';

const PendingUsers = () => {
  const { showSuccess, showError } = useToast();
  const confirm = useConfirm();
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
    const ok = await confirm({
      title: '¿Aprobar este usuario?',
      description: 'Va a poder ingresar y anotarse en actividades.',
      confirmLabel: 'Aprobar',
      tone: 'primary',
    });
    if (!ok) return;

    try {
      await axios.put(`/users/${userId}/approve`);
      showSuccess('Usuario aprobado exitosamente');
      fetchUsers();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al aprobar usuario');
    }
  };

  const handleReject = async (userId) => {
    const ok = await confirm({
      title: '¿Rechazar a este usuario?',
      description: 'No va a poder ingresar al sistema. Podés revertirlo después desde su ficha.',
      confirmLabel: 'Rechazar',
    });
    if (!ok) return;

    try {
      await axios.put(`/users/${userId}/reject`);
      showSuccess('Usuario rechazado');
      fetchUsers();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al rechazar usuario');
    }
  };

  // La ficha del usuario vive en /admin/users/:id (ver App.jsx). Acá apuntaba
  // a /admin/users/edit/:id, que no existe como ruta y dejaba la pantalla en
  // blanco.
  const handleEdit = (userId) => {
    navigate(`/admin/users/${userId}`);
  };

  if (loading) {
    return (
      <PageContainer title="Pendientes de aprobación">
        <SkeletonCards count={3} />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Pendientes de aprobación">
      {users.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon="users"
            title="No hay usuarios pendientes"
            description="Cuando alguien se registre, va a aparecer acá para que lo apruebes."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <Card key={user._id} className="flex flex-col">
              <h2 className="mb-1 text-xl font-bold text-ink">
                {user.nombre} {user.apellido}
              </h2>
              <p className="mb-4 text-sm text-ink-muted">{user.email}</p>

              <dl className="space-y-1 text-sm">
                {user.dni && (
                  <div className="flex gap-2">
                    <dt className="font-medium text-ink-soft">{user.tipoDocumento === 'pasaporte' ? 'Pasaporte:' : 'DNI:'}</dt>
                    <dd className="text-ink">{user.dni}</dd>
                  </div>
                )}
                {user.telefono && (
                  <div className="flex gap-2">
                    <dt className="font-medium text-ink-soft">Teléfono:</dt>
                    <dd className="text-ink">{user.telefono}</dd>
                  </div>
                )}
                {user.nacionalidad && (
                  <div className="flex gap-2">
                    <dt className="font-medium text-ink-soft">Nacionalidad:</dt>
                    <dd className="text-ink">{nombrePais(user.nacionalidad)}</dd>
                  </div>
                )}
                {user.residencia && (
                  <div className="flex gap-2">
                    <dt className="font-medium text-ink-soft">Vive:</dt>
                    <dd className="text-ink">
                      {user.residencia === 'buenos_aires' ? 'En Buenos Aires' : user.ciudad || etiquetaResidencia(user.residencia)}
                    </dd>
                  </div>
                )}
              </dl>
              {/* Quien no vive en Buenos Aires o se registró con pasaporte
                  termina el registro por WhatsApp: el aviso le recuerda al
                  equipo que falta eso. */}
              {((user.residencia && user.residencia !== 'buenos_aires') || user.tipoDocumento === 'pasaporte') && (
                <Badge tone="warning" icon="whatsapp" className="mt-3">
                  Termina el registro por WhatsApp
                </Badge>
              )}

              {user.tags && user.tags.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium text-ink-soft">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {user.tags.map((tag) => (
                      <Badge key={tag} tone="primary" icon="tag">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {user.intereses && user.intereses.length > 0 && (
                <div className="mt-4">
                  <p className="mb-1 text-sm font-medium text-ink-soft">Intereses</p>
                  <p className="text-sm text-ink-muted">{user.intereses.join(', ')}</p>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap">
                <Button
                  variant="success"
                  icon="check"
                  onClick={() => handleApprove(user._id)}
                  className="w-full sm:w-auto sm:flex-1"
                >
                  Aprobar
                </Button>
                <Button
                  variant="danger"
                  icon="close"
                  onClick={() => handleReject(user._id)}
                  className="w-full sm:w-auto sm:flex-1"
                >
                  Rechazar
                </Button>
                <Button
                  variant="secondary"
                  icon="edit"
                  onClick={() => handleEdit(user._id)}
                  className="w-full sm:w-auto sm:flex-1"
                >
                  Editar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
};

export default PendingUsers;
