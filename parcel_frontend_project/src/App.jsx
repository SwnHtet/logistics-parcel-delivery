import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import BookParcelPage from "./pages/BookParcelPage";
import MyParcelsPage from "./pages/MyParcelsPage";
import ParcelDetailPage from "./pages/ParcelDetailPage";
import TrackPage from "./pages/TrackPage";
import CourierDashboardPage from "./pages/CourierDashboardPage";
import HubStaffPage from "./pages/HubStaffPage";
import AdminPage from "./pages/AdminPage";

const HOME_BY_ROLE = {
  customer: "/book",
  courier: "/courier",
  hub_staff: "/hub",
  admin: "/admin",
};

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={HOME_BY_ROLE[user.role] || "/track"} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/" element={<HomeRedirect />} />

      <Route path="/book" element={<PrivateRoute><BookParcelPage /></PrivateRoute>} />
      <Route path="/parcels" element={<PrivateRoute><MyParcelsPage /></PrivateRoute>} />
      <Route path="/parcels/:id" element={<PrivateRoute><ParcelDetailPage /></PrivateRoute>} />
      <Route path="/track" element={<PrivateRoute><TrackPage /></PrivateRoute>} />
      <Route path="/courier" element={<PrivateRoute><CourierDashboardPage /></PrivateRoute>} />
      <Route path="/hub" element={<PrivateRoute><HubStaffPage /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
