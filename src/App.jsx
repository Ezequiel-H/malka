import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AppShell from './components/layout/AppShell';
import ErrorBoundary from './components/layout/ErrorBoundary';
import LoadingScreen from './components/layout/LoadingScreen';
import LoginGate from './components/auth/LoginGate';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
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
import UserDetail from './pages/admin/UserDetail';
import MyInterests from './pages/participant/MyInterests';
import MyProfile from './pages/participant/MyProfile';
import PostAuthRedirect from './components/auth/PostAuthRedirect';
import PrivateRoute from './components/auth/PrivateRoute';
import AdminRoute from './components/auth/AdminRoute';
// TEMPORAL: vitrina del design system. Se borra junto con su ruta /ds.
import DesignSystem from './pages/DesignSystem';
import Casa from './pages/Casa';

function App() {
  const { user, loading } = useAuth();
  const location = useLocation();

  /* Al navegar, la vista nueva arranca desde arriba: sin esto el router
     conserva el scroll de la pantalla anterior y una ruta nueva puede abrir
     "abajo de todo" (se nota sobre todo en mobile). */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (loading) {
    return <LoadingScreen />;
  }

  const routes = (
    <ErrorBoundary key={location.pathname}>
      <Routes>
        <Route path="/login" element={<LoginGate />} />
        <Route path="/register" element={!user ? <Register /> : <LoginGate />} />

        {/* TEMPORAL: /ds — vitrina del design system, sin auth para poder
            iterarla sin loguearse. Borrar antes de producción. */}
        <Route path="/ds" element={<DesignSystem />} />
        {/* Maqueta de la landing nueva. Igual que /ds, no va a producción. */}
        <Route path="/casa" element={<Casa />} />

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
          path="/admin/settings"
          element={
            <AdminRoute>
              <Settings />
            </AdminRoute>
          }
        />

        {/* La raíz es la vitrina pública: reemplaza a casamalka.org como
            puerta de entrada. Quien ya tiene sesión no la ve — sigue yendo
            a donde le corresponde por su rol, igual que antes. */}
        <Route path="/" element={user ? <PostAuthRedirect /> : <Landing />} />
      </Routes>
    </ErrorBoundary>
  );

  // Las rutas sin sesión (login, registro, /ds) no llevan el shell.
  return <div className="App min-h-screen">{user ? <AppShell>{routes}</AppShell> : routes}</div>;
}

export default App;

