import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useIdioma } from './i18n';
import AppShell from './components/layout/AppShell';
import ErrorBoundary from './components/layout/ErrorBoundary';
import LoadingScreen from './components/layout/LoadingScreen';
import LoginGate from './components/auth/LoginGate';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import PostAuthRedirect from './components/auth/PostAuthRedirect';
import ActivitiesList from './pages/participant/ActivitiesList';
import ActivityDetail from './pages/participant/ActivityDetail';
import MyInscriptions from './pages/participant/MyInscriptions';
import AdminDashboard from './pages/admin/AdminDashboard';
import PendingUsers from './pages/admin/PendingUsers';
import ActivitiesManagement from './pages/admin/ActivitiesManagement';
import ActivityForm from './pages/admin/ActivityForm';
import UsersManagement from './pages/admin/UsersManagement';
import InscriptionsManagement from './pages/admin/InscriptionsManagement';
import ActivityInscriptions from './pages/admin/ActivityInscriptions';
import TagsManagement from './pages/admin/TagsManagement';
import PrivateTagsManagement from './pages/admin/PrivateTagsManagement';
import Settings from './pages/admin/Settings';
import Metricas from './pages/admin/Metricas';
import Historial from './pages/admin/Historial';
import ContactoDetalle from './pages/admin/ContactoDetalle';
import UserDetail from './pages/admin/UserDetail';
import MyInterests from './pages/participant/MyInterests';
import MyProfile from './pages/participant/MyProfile';
import PrivateRoute from './components/auth/PrivateRoute';
import AdminRoute from './components/auth/AdminRoute';
// TEMPORAL: vitrina del design system. Se borra junto con su ruta /ds.
import DesignSystem from './pages/DesignSystem';

/* Las tres direcciones de la vitrina (castellano, inglés y hebreo) son la
   misma página: cambiar de idioma no es navegar a otra pantalla. */
const RUTAS_VITRINA = ['/', '/en', '/he'];

function App() {
  const { user, loading } = useAuth();
  const { fundido } = useIdioma();
  const location = useLocation();
  const esVitrina = RUTAS_VITRINA.includes(location.pathname);
  const pantalla = esVitrina ? 'vitrina' : location.pathname;

  /* Al navegar, la vista nueva arranca desde arriba: sin esto el router
     conserva el scroll de la pantalla anterior y una ruta nueva puede abrir
     "abajo de todo" (se nota sobre todo en mobile). Cambiar el idioma de la
     vitrina no cuenta: te quedás donde estabas leyendo. */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pantalla]);

  if (loading) {
    return <LoadingScreen />;
  }

  const routes = (
    <ErrorBoundary key={pantalla}>
      <Routes>
        <Route path="/login" element={<LoginGate />} />
        <Route path="/register" element={!user ? <Register /> : <LoginGate />} />

        {/* TEMPORAL: /ds — vitrina del design system, sin auth para poder
            iterarla sin loguearse. Borrar antes de producción. */}
        <Route path="/ds" element={<DesignSystem />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* Participant Routes */}
        <Route
          path="/activities"
          element={
            <PrivateRoute requireApproved>
              <ActivitiesList />
            </PrivateRoute>
          }
        />
        <Route
          path="/activities/:id"
          element={
            <PrivateRoute requireApproved>
              <ActivityDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/my-inscriptions"
          element={
            <PrivateRoute requireApproved>
              <MyInscriptions />
            </PrivateRoute>
          }
        />
        <Route
          path="/my-interests"
          element={
            <PrivateRoute>
              <MyInterests />
            </PrivateRoute>
          }
        />
        <Route
          path="/my-profile"
          element={
            <PrivateRoute>
              <MyProfile />
            </PrivateRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users/pending"
          element={
            <AdminRoute>
              <PendingUsers />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <UsersManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users/:id"
          element={
            <AdminRoute>
              <UserDetail />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/activities"
          element={
            <AdminRoute>
              <ActivitiesManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/activities/new"
          element={
            <AdminRoute>
              <ActivityForm />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/activities/edit/:id"
          element={
            <AdminRoute>
              <ActivityForm />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/activities/:id/inscriptions"
          element={
            <AdminRoute>
              <ActivityInscriptions />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/inscriptions"
          element={
            <AdminRoute>
              <InscriptionsManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/tags"
          element={
            <AdminRoute>
              <TagsManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/tags-privados"
          element={
            <AdminRoute>
              <PrivateTagsManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/historial"
          element={
            <AdminRoute>
              <Historial />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/contactos/:id"
          element={
            <AdminRoute>
              <ContactoDetalle />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/metricas"
          element={
            <AdminRoute>
              <Metricas />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminRoute>
              <Settings />
            </AdminRoute>
          }
        />

        {/* La raíz es la vitrina pública, en castellano, inglés (/en) y
            hebreo (/he). Es sólo para quien todavía no tiene cuenta: con sesión
            iniciada te lleva directo a tu lugar en la app (la agenda, el panel
            o la espera de aprobación), así la vitrina y la plataforma no se
            mezclan. La landing va en una ruta contenedora y las tres direcciones
            son hijas vacías: así cambiar de idioma no la vuelve a montar y el
            cambio se funde en vez de recargar la página. */}
        <Route element={user ? <PostAuthRedirect /> : <Landing />}>
          {RUTAS_VITRINA.map((ruta) => (
            <Route key={ruta} path={ruta} element={null} />
          ))}
        </Route>
      </Routes>
    </ErrorBoundary>
  );

  /* La vitrina no lleva el shell: con sesión ni se muestra (te manda a la
     app), y el shell alrededor del salto se vería un instante. */
  // Las rutas sin sesión (login, registro, /ds) no llevan el shell.
  return (
    /* Al cambiar de idioma la app se apaga, cambia el texto y vuelve. */
    <div
      className={`App min-h-screen transition-opacity duration-200 ease-standard motion-reduce:transition-none ${
        fundido ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {user && !esVitrina ? <AppShell>{routes}</AppShell> : routes}
    </div>
  );
}

export default App;

