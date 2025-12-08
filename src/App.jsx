import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import ActivitiesList from './pages/participant/ActivitiesList';
import MyInscriptions from './pages/participant/MyInscriptions';
import AdminDashboard from './pages/admin/AdminDashboard';
import PendingUsers from './pages/admin/PendingUsers';
import ActivitiesManagement from './pages/admin/ActivitiesManagement';
import ActivityForm from './pages/admin/ActivityForm';
import UsersManagement from './pages/admin/UsersManagement';
import InscriptionsManagement from './pages/admin/InscriptionsManagement';
import ActivityInscriptions from './pages/admin/ActivityInscriptions';
import TagsManagement from './pages/admin/TagsManagement';
import UserDetail from './pages/admin/UserDetail';
import PrivateRoute from './components/auth/PrivateRoute';
import AdminRoute from './components/auth/AdminRoute';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-light-bg flex flex-col items-center justify-center">
        <div className="spinner"></div>
        <p className="mt-4 text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="App min-h-screen bg-light-bg">
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />

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
          path="/my-inscriptions"
          element={
            <PrivateRoute requireApproved>
              <MyInscriptions />
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

        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </div>
  );
}

export default App;

