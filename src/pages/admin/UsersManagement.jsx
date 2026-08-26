import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import PageContainer from '../../components/layout/PageContainer';
import UserStatusBadge from '../../components/users/UserStatusBadge';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Select,
  Table,
  useConfirm,
  SkeletonRows,
} from '../../components/ui';

const ESTADO_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'rejected', label: 'Rechazado' },
];

const ROLE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'participant', label: 'Participante' },
  { value: 'admin', label: 'Administrador' },
];

const UsersManagement = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const confirm = useConfirm();
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

  const handleReject = async (userId, e) => {
    e.stopPropagation(); // Prevenir que se active el click del row
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

  const columns = [
    {
      key: 'nombre',
      header: 'Nombre',
      render: (user) => (
        <span className="font-medium text-ink">
          {user.nombre} {user.apellido}
        </span>
      ),
    },
    { key: 'email', header: 'Email', render: (user) => <span className="text-ink-soft">{user.email}</span> },
    {
      key: 'role',
      header: 'Rol',
      render: (user) => (
        <Badge tone={user.role === 'admin' ? 'primary' : 'neutral'}>
          {user.role === 'admin' ? 'Admin' : 'Participante'}
        </Badge>
      ),
    },
    { key: 'estado', header: 'Estado', render: (user) => <UserStatusBadge estado={user.estado} /> },
    {
      key: 'tags',
      header: 'Tags',
      render: (user) =>
        user.tags && user.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {user.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} tone="primary" size="sm">
                {tag}
              </Badge>
            ))}
            {user.tags.length > 3 && (
              <Badge tone="neutral" size="sm">
                +{user.tags.length - 3}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-ink-faint">Sin tags</span>
        ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (user) =>
        user.estado === 'pending' ? (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="success"
              icon="check"
              onClick={(e) => handleApprove(user._id, e)}
              title="Aprobar usuario"
            >
              Aceptar
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon="close"
              onClick={(e) => handleReject(user._id, e)}
              title="Rechazar usuario"
            >
              Rechazar
            </Button>
          </div>
        ) : null,
    },
  ];

  if (initialLoad) {
    return (
      <PageContainer title="Usuarios">
        <SkeletonRows count={8} />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Usuarios">
      <Card className="mb-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Buscar" className="mb-0">
            <Input
              type="search"
              icon="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Nombre, apellido o email..."
            />
          </Field>

          <Field label="Estado" className="mb-0">
            <Select
              options={ESTADO_OPTIONS}
              value={filters.estado}
              onChange={(value) => setFilters({ ...filters, estado: value ?? '' })}
            />
          </Field>

          <Field label="Rol" className="mb-0">
            <Select
              options={ROLE_OPTIONS}
              value={filters.role}
              onChange={(value) => setFilters({ ...filters, role: value ?? '' })}
            />
          </Field>
        </div>
      </Card>

      <div
        className={
          loading
            ? 'pointer-events-none opacity-50 transition-opacity duration-fast'
            : 'transition-opacity duration-fast'
        }
      >
        <Table
          columns={columns}
          rows={users}
          rowKey={(user) => user._id}
          onRowClick={(user) => navigate(`/admin/users/${user._id}`)}
          empty={
            <Card padding="none">
              <EmptyState
                icon="search"
                title="Sin resultados"
                description="No encontramos usuarios con los filtros seleccionados."
              />
            </Card>
          }
        />
      </div>
    </PageContainer>
  );
};

export default UsersManagement;
