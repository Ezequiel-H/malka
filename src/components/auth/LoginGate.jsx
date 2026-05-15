import { useAuth } from '../../contexts/AuthContext';
import Login from '../../pages/auth/Login';
import PostAuthRedirect from './PostAuthRedirect';

const LoginGate = () => {
  const { user } = useAuth();
  return user ? <PostAuthRedirect /> : <Login />;
};

export default LoginGate;
