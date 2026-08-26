import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import { api } from "../api/client";

export default function MyParcelsPage() {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.myParcels()
      .then(setParcels)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <h1 className="page-title">My Parcels</h1>
      <p className="page-subtitle">Every parcel you've booked, with its current status.</p>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : parcels.length === 0 ? (
          <div className="empty-state">You haven't booked any parcels yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Tracking #</th>
                <th>Receiver</th>
                <th>Status</th>
                <th>Courier</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {parcels.map((p) => (
                <tr key={p.id}>
                  <td className="mono">{p.tracking_number}</td>
                  <td>{p.receiver_name}</td>
                  <td><StatusBadge status={p.current_status} /></td>
                  <td>{p.assigned_courier_id ? `#${p.assigned_courier_id}` : "—"}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => navigate(`/parcels/${p.id}`)}
                    >
                      View
                    </button>
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
