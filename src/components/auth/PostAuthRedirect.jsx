import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { resolvePostAuthPath } from '../../utils/authRedirect';

/** Redirige tras login/registro según URL guardada o rol del usuario. */
const PostAuthRedirect = () => {
  const { user } = useAuth();
  const location = useLocation();
  const target = resolvePostAuthPath(user, location);
  return <Navigate to={target} replace />;
};

export default PostAuthRedirect;
