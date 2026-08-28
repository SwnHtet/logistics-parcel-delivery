import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_LINKS = {
  customer: [
    { to: "/book", label: "Book a Parcel" },
    { to: "/parcels", label: "My Parcels" },
    { to: "/track", label: "Track a Parcel" },
    { to: "/profile", label: "My Profile" },
  ],
  courier: [
    { to: "/courier", label: "Courier Dashboard" },
    { to: "/track", label: "Track a Parcel" },
    { to: "/profile", label: "My Profile" },
  ],
  hub_staff: [
    { to: "/hub", label: "Hub Operations" },
    { to: "/track", label: "Track a Parcel" },
    { to: "/profile", label: "My Profile" },
  ],
  admin: [
    { to: "/admin", label: "Admin Overview" },
    { to: "/track", label: "Track a Parcel" },
    { to: "/profile", label: "My Profile" },
  ],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = ROLE_LINKS[user?.role] || [];
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="app-shell">
      {/* Compact top bar — visible only on narrow/mobile screens (see index.css) */}
      <div className="mobile-topbar">
        <span className="mobile-topbar-brand">Parcel Delivery</span>
        <button
          className="hamburger-btn"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      <aside className={`sidebar${menuOpen ? " sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          Parcel Delivery
          <small>CSC480 · TEST CONSOLE</small>
        </div>
        <nav>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={closeMenu}
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

      <main className="main-content" onClick={closeMenu}>{children}</main>
    </div>
  );
}