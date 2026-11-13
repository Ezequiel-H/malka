import UsersManagement from './UsersManagement';

/**
 * /admin/users/pending: la misma pantalla de Personas, con la lista mostrando
 * sólo las cuentas por aprobar (la bandeja de arriba sigue a mano para
 * aprobarlas de un toque).
 */
const PendingUsers = () => <UsersManagement enfoque="pendientes" />;

export default PendingUsers;
