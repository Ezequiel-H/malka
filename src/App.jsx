import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import LoadingScreen from './components/layout/LoadingScreen';
import LoginGate from './components/auth/LoginGate';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
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
import PrivateRoute from './components/auth/PrivateRoute';
import AdminRoute from './components/auth/AdminRoute';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="App min-h-screen bg-light-bg">
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={<LoginGate />} />
        <Route path="/register" element={!user ? <Register /> : <LoginGate />} />

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

        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </div>
  );
}

export default App;

