import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import { api } from "../api/client";

// Valid next steps per current status — mirrors the backend's state machine
// so the UI only offers buttons that will actually succeed.
const NEXT_STEPS = {
  created: ["picked_up", "failed"],
  picked_up: ["at_hub", "in_transit", "failed"],
  at_hub: ["in_transit", "out_for_delivery", "failed"],
  in_transit: ["at_hub", "out_for_delivery", "failed"],
  out_for_delivery: ["delivered", "failed"],
  delivered: [],
  failed: ["picked_up"],
};

export default function CourierDashboardPage() {
  const [courier, setCourier] = useState(null);
  const [parcels, setParcels] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [simulating, setSimulating] = useState(false);

  const refresh = () => {
    api.courierMe().then(setCourier).catch((e) => setError(e.message));
    api.myParcels().then(setParcels).catch((e) => setError(e.message));
  };

  useEffect(() => {
    refresh();
  }, []);

  const toggleAvailability = async () => {
    const next = courier.status === "offline" ? "available" : "offline";
    try {
      const updated = await api.updateCourierStatus(next);
      setCourier(updated);
    } catch (e) {
      setError(e.message);
    }
  };

  const sendLocation = async (lat, lng) => {
    try {
      const updated = await api.updateCourierLocation(lat, lng);
      setCourier(updated);
      setMessage(`Location broadcast: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } catch (e) {
      setError(e.message);
    }
  };

  const simulateMovement = async () => {
    // Walks a straight line from Hub A to Hub B in 6 steps, one per second —
    // stands in for a real device sending GPS pings, per your class-project scope.
    setSimulating(true);
    const start = { lat: 13.7563, lng: 100.5018 };
    const end = { lat: 14.0208, lng: 100.5250 };
    const steps = 6;
    for (let i = 1; i <= steps; i++) {
      const lat = start.lat + ((end.lat - start.lat) * i) / steps;
      const lng = start.lng + ((end.lng - start.lng) * i) / steps;
      await sendLocation(lat, lng);
      await new Promise((r) => setTimeout(r, 1000));
    }
    setSimulating(false);
  };

  const changeStatus = async (parcelId, status) => {
    setError("");
    try {
      await api.updateParcelStatus(parcelId, { status });
      refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  if (!courier) {
    return (
      <Layout>
        <div className="empty-state">Loading courier profile...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="page-title">Courier Dashboard</h1>
      <p className="page-subtitle">Manage your availability, location, and assigned deliveries.</p>

      {error && <div className="error-banner">{error}</div>}
      {message && <div className="success-banner">{message}</div>}

      <div className="grid-2">
        <div className="card">
          <h2 className="card-title">Availability</h2>
          <p>
            <span className={`dot dot-${courier.status}`} style={{ marginRight: 8 }} />
            Current status: <strong>{courier.status.replace("_", " ")}</strong>
          </p>
          <button className="btn btn-primary" onClick={toggleAvailability}>
            {courier.status === "offline" ? "Go Available" : "Go Offline"}
          </button>
        </div>

        <div className="card">
          <h2 className="card-title">Live location (simulated)</h2>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            Current: {courier.current_lat?.toFixed(4) ?? "—"}, {courier.current_lng?.toFixed(4) ?? "—"}
          </p>
          <button className="btn btn-secondary" onClick={simulateMovement} disabled={simulating}>
            {simulating ? "Moving..." : "Simulate Route (Hub A → Hub B)"}
          </button>
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
            Sends 6 GPS pings over 6 seconds — open a parcel's tracking page in another tab to watch it live.
          </p>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">My Assigned Parcels</h2>
        {parcels.length === 0 ? (
          <div className="empty-state">No parcels assigned to you yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Tracking #</th>
                <th>Receiver</th>
                <th>Status</th>
                <th>Next steps</th>
              </tr>
            </thead>
            <tbody>
              {parcels.map((p) => (
                <tr key={p.id}>
                  <td className="mono">{p.tracking_number}</td>
                  <td>{p.receiver_name}</td>
                  <td><StatusBadge status={p.current_status} /></td>
                  <td>
                    {NEXT_STEPS[p.current_status].length === 0 ? (
                      <span style={{ color: "var(--muted)" }}>—</span>
                    ) : (
                      NEXT_STEPS[p.current_status].map((s) => (
                        <button
                          key={s}
                          className="btn btn-sm btn-secondary"
                          style={{ marginRight: 6, marginBottom: 4 }}
                          onClick={() => changeStatus(p.id, s)}
                        >
                          → {s.replace("_", " ")}
                        </button>
                      ))
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
