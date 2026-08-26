import { useState } from "react";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import { api } from "../api/client";

export default function TrackPage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [parcel, setParcel] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setParcel(null);
    setBusy(true);
    try {
      const result = await api.trackParcel(trackingNumber.trim());
      setParcel(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <h1 className="page-title">Track a Parcel</h1>
      <p className="page-subtitle">
        Public lookup by tracking number — no login required, same as any real courier tracking page.
      </p>

      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10 }}>
          <input
            placeholder="e.g. PCL-AB12CD34EF"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            style={{ flex: 1, padding: "9px 11px", border: "1px solid var(--border)", borderRadius: 8 }}
            required
          />
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Searching..." : "Track"}
          </button>
        </form>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {parcel && (
        <div className="card">
          <h2 className="card-title">
            {parcel.tracking_number} — <StatusBadge status={parcel.current_status} />
          </h2>
          <p><strong>Receiver:</strong> {parcel.receiver_name}</p>
          <p><strong>Address:</strong> {parcel.receiver_address}</p>

          <h3 style={{ fontSize: 14, marginTop: 20 }}>Status Timeline</h3>
          <ul className="timeline">
            {parcel.status_history.map((h, i) => (
              <li className="timeline-item" key={i}>
                <span className="timeline-dot" />
                <StatusBadge status={h.status} />
                <div className="timeline-time">
                  {new Date(h.timestamp + "Z").toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Layout>
  );
}
