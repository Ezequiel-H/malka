import { Navigate } from 'react-router-dom';

/** Compatibilidad: enlaces antiguos a /admin/tags-privados. */
const PrivateTagsManagement = () => <Navigate to="/admin/tags?catalog=private" replace />;

export default PrivateTagsManagement;
