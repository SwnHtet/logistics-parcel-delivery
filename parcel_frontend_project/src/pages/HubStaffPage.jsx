import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import { api } from "../api/client";

export default function HubStaffPage() {
  const [hubs, setHubs] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [parcelId, setParcelId] = useState("");
  const [toHubId, setToHubId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const refresh = () => {
    api.listHubs().then(setHubs).catch((e) => setError(e.message));
    api.myParcels().then(setParcels).catch((e) => setError(e.message));
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await api.hubTransfer({ parcel_id: parseInt(parcelId), to_hub_id: parseInt(toHubId) });
      setMessage(`Parcel #${parcelId} transferred to hub #${toHubId}.`);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Layout>
      <h1 className="page-title">Hub Operations</h1>
      <p className="page-subtitle">Log parcel transfers between hubs.</p>

      {error && <div className="error-banner">{error}</div>}
      {message && <div className="success-banner">{message}</div>}

      <div className="grid-2">
        <div className="card">
          <h2 className="card-title">Record a Hub Transfer</h2>
          <form onSubmit={handleTransfer}>
            <div className="field">
              <label>Parcel ID</label>
              <input value={parcelId} onChange={(e) => setParcelId(e.target.value)} required />
            </div>
            <div className="field">
              <label>Transfer to hub</label>
              <select value={toHubId} onChange={(e) => setToHubId(e.target.value)} required>
                <option value="">Select a hub...</option>
                {hubs.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary">Record Transfer</button>
          </form>
        </div>

        <div className="card">
          <h2 className="card-title">Hubs</h2>
          {hubs.length === 0 ? (
            <div className="empty-state">No hubs yet. Ask an admin to create one via the API.</div>
          ) : (
            <table className="table">
              <thead><tr><th>ID</th><th>Name</th><th>Location</th></tr></thead>
              <tbody>
                {hubs.map((h) => (
                  <tr key={h.id}>
                    <td>{h.id}</td>
                    <td>{h.name}</td>
                    <td>{h.latitude.toFixed(3)}, {h.longitude.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Parcels Visible to You</h2>
        {parcels.length === 0 ? (
          <div className="empty-state">No parcels found.</div>
        ) : (
          <table className="table">
            <thead><tr><th>ID</th><th>Tracking #</th><th>Status</th><th>Current Hub</th></tr></thead>
            <tbody>
              {parcels.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td className="mono">{p.tracking_number}</td>
                  <td><StatusBadge status={p.current_status} /></td>
                  <td>{p.current_hub_id ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
