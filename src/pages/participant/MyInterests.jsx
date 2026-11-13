import { Navigate } from 'react-router-dom';

/* Los intereses ahora viven en el perfil, como pastillas que se guardan
   solas. La dirección vieja sigue andando y lleva directo a esa parte. */
const MyInterests = () => <Navigate to="/my-profile#intereses" replace />;

export default MyInterests;
