import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';
import { userPrivateTags } from '../../utils/tagFields';
import { formatUtcCalendarDayAndTime } from '../../utils/dateUtils';
import LoadingScreen from '../../components/layout/LoadingScreen';
import PageContainer from '../../components/layout/PageContainer';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Select,
  Spinner,
  Table,
  useConfirm,
} from '../../components/ui';
import InscriptionStatusTag from '../../components/activities/InscriptionStatusTag';
import TagAssigner from '../../components/tags/TagAssigner';
import { etiquetaResidencia, nombrePais } from '../../utils/paises';
import ResumenPersona from '../../components/admin/ResumenPersona';
import { Segmentado } from '../../components/admin/metricas/piezas';

const VISTAS_FICHA = [
  { valor: 'resumen', etiqueta: 'Cómo viene' },
  { valor: 'datos', etiqueta: 'Datos' },
];
const ESTADO_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'rejected', label: 'Rechazado' },
];
/* Color de respaldo cuando la tag del catálogo no define el suyo. */
const DEFAULT_PUBLIC_TAG_COLOR = '#689b78';
const DEFAULT_PRIVATE_TAG_COLOR = '#835710';
const INSCRIPTION_COLUMNS = [
  {
    key: 'evento',
    header: 'Evento',
    render: (i) => (
      <span className="font-medium text-ink">
        {i.activityId?.titulo || 'Actividad eliminada'}
      </span>
    ),
  },
  {
    key: 'fecha',
    header: 'Fecha y hora',
    render: (i) => (
      <span className="whitespace-nowrap tabular-nums text-ink-soft">
        {formatUtcCalendarDayAndTime(i.fecha, i.hora || i.activityId?.hora)}
      </span>
    ),
  },
  {
    key: 'estado',
    header: 'Estado',
    render: (i) => (
      <span onClick={(e) => e.stopPropagation()}>
        <InscriptionStatusTag estado={i.estado} />
      </span>
    ),
  },
];
const UserDetail = () => {
  const [params, setParams] = useSearchParams();
  const vistaFicha = params.get('vista') === 'datos' ? 'datos' : 'resumen';
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const confirm = useConfirm();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [availablePrivateTags, setAvailablePrivateTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [tagInputPrivados, setTagInputPrivados] = useState('');
  const [inscriptions, setInscriptions] = useState([]);
  const [loadingInscriptions, setLoadingInscriptions] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    dni: '',
    telefono: '',
    tags: [],
    tagsPrivados: [],
    estado: '',
    role: '',
    restriccionesAlimentarias: [],
    comoSeEntero: ''
  });
  useEffect(() => {
    fetchUser();
    fetchAvailableTags();
    fetchAvailablePrivateTags();
  }, [id]);
  useEffect(() => {
    if (user && user._id) {
      fetchUserInscriptions();
    }
  }, [user]);
  const fetchUser = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`/users/${id}`);
      const userData = response.data.user;
      if (!userData) {
        throw new Error('Usuario no encontrado en la respuesta');
      }
      setUser(userData);
      setFormData({
        nombre: userData.nombre || '',
        apellido: userData.apellido || '',
        email: userData.email || '',
        dni: userData.dni || '',
        telefono: userData.telefono || '',
        tags: userData.tags || [],
        tagsPrivados: userPrivateTags(userData),
        estado: userData.estado || '',
        role: userData.role || '',
        restriccionesAlimentarias: userData.restriccionesAlimentarias || [],
        comoSeEntero: userData.comoSeEntero || ''
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Error al cargar la información del usuario';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  const fetchAvailableTags = async () => {
    try {
      const response = await axios.get('/tags?activa=true');
      setAvailableTags(response.data.tags || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };
  const fetchAvailablePrivateTags = async () => {
    try {
      const response = await axios.get('/tags-privados?activa=true');
      setAvailablePrivateTags(response.data.tags || []);
    } catch (error) {
      console.error('Error fetching tags privados:', error);
      setAvailablePrivateTags([]);
    }
  };
  const fetchUserInscriptions = async () => {
    try {
      setLoadingInscriptions(true);
      const response = await axios.get(`/inscriptions?userId=${user._id}`);
      const allInscriptions = response.data.inscriptions || [];
      // Obtener las últimas 10
      setInscriptions(allInscriptions.slice(0, 10));
    } catch (error) {
      console.error('Error fetching user inscriptions:', error);
      setInscriptions([]);
    } finally {
      setLoadingInscriptions(false);
    }
  };
  const handleRowClick = (inscription) => {
    if (inscription.activityId?._id) {
      navigate(`/admin/activities/${inscription.activityId._id}/inscriptions`);
    }
  };
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const next =
      type === 'checkbox' ? checked : name === 'dni' ? value.replace(/ /g, '').trim() : value;
    setFormData(prev => ({
      ...prev,
      [name]: next
    }));
  };
  const handleAddTag = () => {
    if (tagInput) {
      const tagNombreLower = tagInput.toLowerCase();
      const alreadyExists = formData.tags.some(t => t.toLowerCase() === tagNombreLower);
      if (!alreadyExists) {
        const tagFromBackend = availableTags.find(t => t.nombre.toLowerCase() === tagNombreLower);
        const tagToAdd = tagFromBackend ? tagFromBackend.nombre : tagInput;
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagToAdd]
        }));
        setTagInput('');
      }
    }
  };
  const handleRemoveTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };
  const handleAddPrivateTag = () => {
    if (!tagInputPrivados) return;
    const tagNombreLower = tagInputPrivados.toLowerCase();
    if (formData.tagsPrivados.some(t => t.toLowerCase() === tagNombreLower)) return;
    const tagFromBackend = availablePrivateTags.find(t => t.nombre.toLowerCase() === tagNombreLower);
    const tagToAdd = tagFromBackend ? tagFromBackend.nombre : tagInputPrivados;
    setFormData(prev => ({
      ...prev,
      tagsPrivados: [...prev.tagsPrivados, tagToAdd]
    }));
    setTagInputPrivados('');
  };
  const handleRemovePrivateTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tagsPrivados: prev.tagsPrivados.filter(t => t !== tag)
    }));
  };
  const handleApprove = async () => {
    const ok = await confirm({
      title: '¿Aprobar este usuario?',
      description: 'Va a poder ingresar y anotarse en actividades.',
      confirmLabel: 'Aprobar',
      tone: 'primary',
    });
    if (!ok) return;
    try {
      await axios.put(`/users/${id}/approve`);
      showSuccess('Usuario aprobado exitosamente');
      fetchUser();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al aprobar usuario');
    }
  };
  const handleReject = async () => {
    const ok = await confirm({
      title: '¿Rechazar este usuario?',
      description: 'No va a poder ingresar al sistema. Podés revertirlo después.',
      confirmLabel: 'Rechazar',
    });
    if (!ok) return;
    try {
      await axios.put(`/users/${id}/reject`);
      showSuccess('Usuario rechazado');
      fetchUser();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al rechazar usuario');
    }
  };
  const handleSetPending = async () => {
    const ok = await confirm({
      title: '¿Poner este usuario como pendiente?',
      description: 'Vuelve a la cola de aprobación y pierde el acceso mientras tanto.',
      confirmLabel: 'Poner pendiente',
      tone: 'warning',
    });
    if (!ok) return;
    try {
      await axios.put(`/users/${id}`, {
        nombre: formData.nombre,
        apellido: formData.apellido,
        dni: formData.dni.replace(/ /g, '').trim(),
        telefono: formData.telefono,
        tags: formData.tags,
        tagsPrivados: formData.tagsPrivados,
        estado: 'pending'
      });
      showSuccess('Usuario puesto como pendiente');
      fetchUser();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al cambiar estado del usuario');
    }
  };
  // Recibe el valor directo: el Select del DS es controlado por `value`, así
  // que ya no hace falta revertir el DOM a mano cuando la request falla.
  const handleEstadoChange = async (newEstado) => {
    if (!newEstado || newEstado === formData.estado) return;
    const confirms = {
      approved: {
        title: '¿Aprobar este usuario?',
        description: 'Va a poder ingresar y anotarse en actividades.',
        confirmLabel: 'Aprobar',
        tone: 'primary',
      },
      rejected: {
        title: '¿Rechazar este usuario?',
        description: 'No va a poder ingresar al sistema. Podés revertirlo después.',
        confirmLabel: 'Rechazar',
      },
      pending: {
        title: '¿Poner este usuario como pendiente?',
        description: 'Vuelve a la cola de aprobación y pierde el acceso mientras tanto.',
        confirmLabel: 'Poner pendiente',
        tone: 'warning',
      },
    };
    const ok = await confirm(confirms[newEstado]);
    if (!ok) return;
    try {
      if (newEstado === 'approved') {
        await axios.put(`/users/${id}/approve`);
        showSuccess('Usuario aprobado exitosamente');
      } else if (newEstado === 'rejected') {
        await axios.put(`/users/${id}/reject`);
        showSuccess('Usuario rechazado');
      } else {
        await axios.put(`/users/${id}`, {
          nombre: formData.nombre,
          apellido: formData.apellido,
          dni: formData.dni.replace(/ /g, '').trim(),
          telefono: formData.telefono,
          tags: formData.tags,
          tagsPrivados: formData.tagsPrivados,
          estado: 'pending'
        });
        showSuccess('Usuario puesto como pendiente');
      }
      fetchUser();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al cambiar estado del usuario');
      // No hay que revertir nada: el Select se pinta desde formData.estado,
      // que no cambió porque fetchUser() no llegó a correr.
    }
  };
  const handleChangePassword = async (e) => {
    e?.preventDefault?.();
    if (newPassword.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('Las contraseñas no coinciden');
      return;
    }
    const ok = await confirm({
      title: '¿Cambiar la contraseña de este usuario?',
      description: 'La contraseña anterior deja de funcionar de inmediato.',
      confirmLabel: 'Cambiar contraseña',
      tone: 'warning',
    });
    if (!ok) return;
    setSavingPassword(true);
    try {
      await axios.put(`/users/${id}/password`, { password: newPassword });
      showSuccess('Contraseña actualizada');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.msg ||
        'Error al cambiar la contraseña';
      showError(msg);
    } finally {
      setSavingPassword(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await axios.put(`/users/${id}`, {
        nombre: formData.nombre,
        apellido: formData.apellido,
        dni: formData.dni.replace(/ /g, '').trim(),
        telefono: formData.telefono,
        tags: formData.tags,
        tagsPrivados: formData.tagsPrivados
      });
      showSuccess('Usuario actualizado exitosamente');
      fetchUser();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al actualizar usuario');
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return <LoadingScreen message="Cargando información del usuario..." />;
  }
  if (!user && !loading) {
    return (
      <PageContainer>
          <Card>
            {error ? (
              <>
                <p className="mb-2 font-semibold text-danger-600">Error al cargar el usuario</p>
                <p className="mb-4 text-ink-muted">{error}</p>
              </>
            ) : (
              <p className="text-danger-600">Usuario no encontrado</p>
            )}
            <Button variant="secondary" icon="back" to="/admin/users" className="mt-4">
              Volver a usuarios
            </Button>
          </Card>
      </PageContainer>
    );
  }
  return (
    <PageContainer
      title={`${user.nombre} ${user.apellido}`}
      actions={
        <Button
          variant="secondary"
          icon="back"
          onClick={() => navigate('/admin/users')}
          className="w-full shrink-0 sm:w-auto"
        >
          Volver
        </Button>
      }
    >
        {error && (
          <Alert tone="danger" className="mb-4">
            {error}
          </Alert>
        )}
        {/* La ficha abre en cómo viene la persona (estado, números e
            historial); los datos para editar quedan en la otra pestaña. */}
        <Segmentado
          opciones={VISTAS_FICHA}
          valor={vistaFicha}
          onChange={(v) => setParams((p) => {
            const n = new URLSearchParams(p);
            if (v === 'resumen') n.delete('vista');
            else n.set('vista', v);
            return n;
          }, { replace: true })}
          etiqueta="Qué ver de la persona"
          className="mb-6"
        />
        {vistaFicha === 'resumen' ? (
          <div key="resumen" className="animate-fade-in">
            <ResumenPersona userId={user._id} />
          </div>
        ) : (
        <Card as="form" onSubmit={handleSubmit} key="datos" className="animate-fade-in">
          {/* Información Básica */}
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">Información Básica</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Email" hint="El email no se puede modificar">
                <Input type="email" icon="mail" value={formData.email} disabled />
              </Field>
              <Field label="Estado">
                <Select
                  name="estado"
                  options={ESTADO_OPTIONS}
                  value={formData.estado}
                  onChange={handleEstadoChange}
                />
              </Field>
              <Field label="Nombre" required>
                <Input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </Field>
              <Field label="Apellido" required>
                <Input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  required
                />
              </Field>
              <Field label="DNI" hint="Entre 7 y 10 dígitos, sin puntos">
                <Input
                  type="text"
                  name="dni"
                  value={formData.dni}
                  onChange={handleChange}
                  inputMode="numeric"
                  autoComplete="off"
                  minLength={7}
                  maxLength={10}
                  pattern="\d{7,10}"
                  title="Entre 7 y 10 dígitos"
                />
              </Field>
              <Field label="Teléfono">
                <Input
                  type="tel"
                  icon="phone"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                />
              </Field>
              <Field label="Rol" hint="El rol no se puede modificar desde aquí">
                <Input
                  type="text"
                  value={formData.role === 'admin' ? 'Administrador' : 'Participante'}
                  disabled
                />
              </Field>
            </div>
          </div>
          {/* Contraseña (admin) */}
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">Contraseña</h2>
            <p className="mb-4 text-sm text-ink-muted">
              Establecé una nueva contraseña para este usuario. No podés ver la contraseña actual.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nueva contraseña" htmlFor="admin-new-password" hint="Mínimo 6 caracteres">
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleChangePassword(e);
                    }
                  }}
                  minLength={6}
                />
              </Field>
              <Field
                label="Confirmar contraseña"
                htmlFor="admin-confirm-password"
                error={
                  confirmPassword && newPassword !== confirmPassword
                    ? 'Las contraseñas no coinciden'
                    : undefined
                }
              >
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleChangePassword(e);
                    }
                  }}
                  minLength={6}
                />
              </Field>
              <div className="md:col-span-2">
                <Button
                  type="button"
                  variant="secondary"
                  icon="settings"
                  loading={savingPassword}
                  disabled={savingPassword || !newPassword || !confirmPassword}
                  onClick={handleChangePassword}
                >
                  {savingPassword ? 'Guardando…' : 'Actualizar contraseña'}
                </Button>
              </div>
            </div>
          </div>
          {/* Información del Onboarding */}
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">Información del Onboarding</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Restricciones alimentarias" className="md:col-span-2">
                {formData.restriccionesAlimentarias && formData.restriccionesAlimentarias.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.restriccionesAlimentarias.map((restriccion, index) => (
                      <Badge key={index} tone="neutral">
                        {restriccion}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="italic text-ink-faint">No tiene restricciones alimentarias</p>
                )}
              </Field>
              <Field label="Nacionalidad">
                {user?.nacionalidad ? (
                  <p className="text-ink">{nombrePais(user.nacionalidad)}</p>
                ) : (
                  <p className="italic text-ink-faint">No especificada</p>
                )}
              </Field>
              <Field label="Dónde vive">
                {user?.residencia ? (
                  <p className="text-ink">
                    {etiquetaResidencia(user.residencia)}
                    {user.ciudad ? ` · ${user.ciudad}` : ''}
                  </p>
                ) : (
                  <p className="italic text-ink-faint">No especificado</p>
                )}
              </Field>
              <Field label="¿Cómo se enteró de esta propuesta?" className="md:col-span-2">
                {formData.comoSeEntero ? (
                  <p className="rounded-control border border-surface-border bg-surface p-3 text-ink-soft">
                    {formData.comoSeEntero}
                  </p>
                ) : (
                  <p className="italic text-ink-faint">No especificado</p>
                )}
              </Field>
            </div>
          </div>
          {/* Tags públicos */}
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">Tags públicos</h2>
            <p className="mb-4 text-sm text-ink-muted">
              Intereses del participante (también puede editarlos en &quot;Mis intereses&quot;). Catálogo:{' '}
              <Link to="/admin/tags" className="font-medium text-primary hover:underline">tags públicos</Link>.
            </p>
            <TagAssigner
              label="Tags del usuario"
              placeholder="Seleccionar tag"
              emptyMessage="No hay tags disponibles"
              catalog={availableTags}
              assigned={formData.tags}
              value={tagInput}
              onValueChange={setTagInput}
              onAdd={handleAddTag}
              onRemove={handleRemoveTag}
              defaultColor={DEFAULT_PUBLIC_TAG_COLOR}
              emptyHint={
                <p className="mt-2 text-sm text-ink-muted">
                  No hay tags disponibles.{' '}
                  <Button variant="link" size="sm" to="/admin/tags" className="min-h-0 px-0 py-0">
                    Crear tags
                  </Button>
                </p>
              }
            />
          </div>
          {/* Tags privados (admin) */}
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">Tags privados</h2>
            <p className="mb-4 text-sm text-ink-muted">
              Solo administración: segmentan qué actividades privadas puede ver este usuario. No se muestran al
              participante. Gestioná el catálogo en{' '}
              <Link to="/admin/tags-privados" className="font-medium text-primary hover:underline">Tags privados</Link>.
            </p>
            <TagAssigner
              label="Tags privados del usuario"
              placeholder="Seleccionar tag privada"
              emptyMessage="No hay tags privadas disponibles"
              catalog={availablePrivateTags}
              assigned={formData.tagsPrivados}
              value={tagInputPrivados}
              onValueChange={setTagInputPrivados}
              onAdd={handleAddPrivateTag}
              onRemove={handleRemovePrivateTag}
              defaultColor={DEFAULT_PRIVATE_TAG_COLOR}
              emptyHint={
                <p className="mt-2 text-sm text-ink-muted">
                  No hay tags privadas.{' '}
                  <Button
                    variant="link"
                    size="sm"
                    to="/admin/tags-privados"
                    className="min-h-0 px-0 py-0"
                  >
                    Crear en catálogo privado
                  </Button>
                </p>
              }
            />
          </div>
          {/* Inscripciones Recientes */}
          <div className="mb-8">
            <h2 className="mb-2 text-2xl font-semibold text-ink">Inscripciones Recientes</h2>
            <p className="mb-4 break-words text-sm text-ink-muted">
              {[formData.nombre, formData.apellido].filter(Boolean).join(' ').trim() || '—'}
              {' · '}
              {formData.telefono || '—'}
              {' · '}
              {formData.email || '—'}
            </p>
            {loadingInscriptions ? (
              <div className="flex flex-col items-center py-8">
                <Spinner size="lg" label="Cargando inscripciones" />
                <p className="mt-4 text-ink-muted">Cargando inscripciones...</p>
              </div>
            ) : inscriptions.length === 0 ? (
              <EmptyState
                icon="activity"
                title="Sin inscripciones"
                description="Este usuario todavía no se anotó en ninguna actividad."
              />
            ) : (
              <Table
                columns={INSCRIPTION_COLUMNS}
                rows={inscriptions}
                rowKey={(i) => i._id}
                onRowClick={handleRowClick}
              />
            )}
            {inscriptions.length >= 10 && (
              <p className="mt-2 text-center text-sm text-ink-muted">
                Mostrando las últimas 10 inscripciones
              </p>
            )}
          </div>
          {/* Botones de Acción */}
          <div className="flex gap-4">
            <Button type="submit" icon="check" loading={saving} className="flex-1">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/users')}>
              Cancelar
            </Button>
          </div>
        </Card>
        )}
    </PageContainer>
  );
};
export default UserDetail;
