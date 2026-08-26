import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_LINKS = {
  customer: [
    { to: "/book", label: "Book a Parcel" },
    { to: "/parcels", label: "My Parcels" },
    { to: "/track", label: "Track a Parcel" },
  ],
  courier: [
    { to: "/courier", label: "Courier Dashboard" },
    { to: "/track", label: "Track a Parcel" },
  ],
  hub_staff: [
    { to: "/hub", label: "Hub Operations" },
    { to: "/track", label: "Track a Parcel" },
  ],
  admin: [
    { to: "/admin", label: "Admin Overview" },
    { to: "/track", label: "Track a Parcel" },
  ],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = ROLE_LINKS[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          Parcel Delivery
          <small>CSC480 · TEST CONSOLE</small>
        </div>
        <nav>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <strong>{user?.name}</strong>
            {user?.email}
            <div>
              <span className="role-badge">{user?.role?.replace("_", " ")}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Log out</button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
