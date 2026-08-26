import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import { api } from "../api/client";

export default function AdminPage() {
  const [parcels, setParcels] = useState([]);
  const [users, setUsers] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [error, setError] = useState("");

  // New hub form
  const [hubForm, setHubForm] = useState({ name: "", address: "", latitude: "", longitude: "" });
  const [hubMessage, setHubMessage] = useState("");

  // New staff account form
  const [staffForm, setStaffForm] = useState({ name: "", email: "", password: "", phone: "", role: "courier" });
  const [staffMessage, setStaffMessage] = useState("");

  const refresh = () => {
    api.myParcels().then(setParcels).catch((e) => setError(e.message));
    api.listUsers().then(setUsers).catch((e) => setError(e.message));
    api.listHubs().then(setHubs).catch((e) => setError(e.message));
  };

  useEffect(() => {
    refresh();
  }, []);

  const stats = {
    total: parcels.length,
    delivered: parcels.filter((p) => p.current_status === "delivered").length,
    failed: parcels.filter((p) => p.current_status === "failed").length,
    inProgress: parcels.filter((p) => !["delivered", "failed"].includes(p.current_status)).length,
  };

  const handleCreateHub = async (e) => {
    e.preventDefault();
    setHubMessage("");
    try {
      await api.createHub({
        name: hubForm.name,
        address: hubForm.address,
        latitude: parseFloat(hubForm.latitude),
        longitude: parseFloat(hubForm.longitude),
      });
      setHubMessage("Hub created.");
      setHubForm({ name: "", address: "", latitude: "", longitude: "" });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setStaffMessage("");
    try {
      await api.createStaff(staffForm);
      setStaffMessage(`${staffForm.role.replace("_", " ")} account created for ${staffForm.email}.`);
      setStaffForm({ name: "", email: "", password: "", phone: "", role: "courier" });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Layout>
      <h1 className="page-title">Admin Overview</h1>
      <p className="page-subtitle">System-wide view of parcels, users, and hubs.</p>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-2" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 18 }}>
        {[
          ["Total Parcels", stats.total],
          ["In Progress", stats.inProgress],
          ["Delivered", stats.delivered],
          ["Failed", stats.failed],
        ].map(([label, value]) => (
          <div className="card" key={label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: "var(--midnight)" }}>{value}</div>
            <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <h2 className="card-title">All Parcels</h2>
          {parcels.length === 0 ? (
            <div className="empty-state">No parcels in the system yet.</div>
          ) : (
            <table className="table">
              <thead><tr><th>Tracking #</th><th>Status</th><th>Courier</th></tr></thead>
              <tbody>
                {parcels.map((p) => (
                  <tr key={p.id}>
                    <td className="mono">{p.tracking_number}</td>
                    <td><StatusBadge status={p.current_status} /></td>
                    <td>{p.assigned_courier_id ? `#${p.assigned_courier_id}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h2 className="card-title">All Users</h2>
          {users.length === 0 ? (
            <div className="empty-state">No users found.</div>
          ) : (
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className="role-badge" style={{ color: "var(--midnight)", background: "var(--ice)" }}>{u.role}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Add Staff Account</h2>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: -8, marginBottom: 14 }}>
          Courier, hub staff, and admin accounts are created here by an admin — not through
          public sign-up. This mirrors how real delivery platforms onboard staff.
        </p>
        {staffMessage && <div className="success-banner">{staffMessage}</div>}
        <form onSubmit={handleCreateStaff}>
          <div className="grid-2">
            <div className="field">
              <label>Full name</label>
              <input
                value={staffForm.name}
                onChange={(e) => setStaffForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={staffForm.email}
                onChange={(e) => setStaffForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Temporary password</label>
              <input
                type="password"
                value={staffForm.password}
                onChange={(e) => setStaffForm((f) => ({ ...f, password: e.target.value }))}
                required
                minLength={6}
              />
            </div>
            <div className="field">
              <label>Phone (optional)</label>
              <input
                value={staffForm.phone}
                onChange={(e) => setStaffForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>
          <div className="field">
            <label>Role</label>
            <select
              value={staffForm.role}
              onChange={(e) => setStaffForm((f) => ({ ...f, role: e.target.value }))}
            >
              <option value="courier">Courier</option>
              <option value="hub_staff">Hub Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button className="btn btn-primary">Create Staff Account</button>
        </form>
      </div>

      <div className="card">
        <h2 className="card-title">Create a Hub</h2>
        {hubMessage && <div className="success-banner">{hubMessage}</div>}
        <form onSubmit={handleCreateHub}>
          <div className="grid-2">
            <div className="field">
              <label>Name</label>
              <input value={hubForm.name} onChange={(e) => setHubForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="field">
              <label>Address</label>
              <input value={hubForm.address} onChange={(e) => setHubForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Latitude</label>
              <input value={hubForm.latitude} onChange={(e) => setHubForm((f) => ({ ...f, latitude: e.target.value }))} required />
            </div>
            <div className="field">
              <label>Longitude</label>
              <input value={hubForm.longitude} onChange={(e) => setHubForm((f) => ({ ...f, longitude: e.target.value }))} required />
            </div>
          </div>
          <button className="btn btn-primary">Create Hub</button>
        </form>
      </div>
    </Layout>
  );
}
