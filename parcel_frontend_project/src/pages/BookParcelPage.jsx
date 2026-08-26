import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { api } from "../api/client";

const DEFAULTS = {
  receiver_name: "",
  receiver_phone: "",
  receiver_address: "",
  pickup_lat: "13.7563",
  pickup_lng: "100.5018",
  dropoff_lat: "14.0208",
  dropoff_lng: "100.5250",
};

export default function BookParcelPage() {
  const [form, setForm] = useState(DEFAULTS);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(null);
    setBusy(true);
    try {
      const payload = {
        ...form,
        pickup_lat: parseFloat(form.pickup_lat),
        pickup_lng: parseFloat(form.pickup_lng),
        dropoff_lat: parseFloat(form.dropoff_lat),
        dropoff_lng: parseFloat(form.dropoff_lng),
      };
      const parcel = await api.bookParcel(payload);
      setSuccess(parcel);
      setForm(DEFAULTS);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <h1 className="page-title">Book a Parcel</h1>
      <p className="page-subtitle">
        Coordinates default to Bangkok → Pathum Thani so you can submit immediately for testing.
      </p>

      {error && <div className="error-banner">{error}</div>}
      {success && (
        <div className="success-banner">
          Parcel booked — tracking number <strong>{success.tracking_number}</strong>.{" "}
          {success.assigned_courier_id
            ? `Auto-assigned to courier #${success.assigned_courier_id}.`
            : "No courier was available for auto-assignment yet."}{" "}
          <button className="btn btn-sm btn-secondary" onClick={() => navigate("/parcels")}>
            View My Parcels
          </button>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">Receiver details</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="field">
              <label>Receiver name</label>
              <input value={form.receiver_name} onChange={update("receiver_name")} required />
            </div>
            <div className="field">
              <label>Receiver phone</label>
              <input value={form.receiver_phone} onChange={update("receiver_phone")} required />
            </div>
          </div>
          <div className="field">
            <label>Receiver address</label>
            <input value={form.receiver_address} onChange={update("receiver_address")} required />
          </div>

          <h2 className="card-title" style={{ marginTop: 22 }}>Pickup & drop-off coordinates</h2>
          <div className="grid-2">
            <div className="field">
              <label>Pickup latitude</label>
              <input value={form.pickup_lat} onChange={update("pickup_lat")} required />
            </div>
            <div className="field">
              <label>Pickup longitude</label>
              <input value={form.pickup_lng} onChange={update("pickup_lng")} required />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Drop-off latitude</label>
              <input value={form.dropoff_lat} onChange={update("dropoff_lat")} required />
            </div>
            <div className="field">
              <label>Drop-off longitude</label>
              <input value={form.dropoff_lng} onChange={update("dropoff_lng")} required />
            </div>
          </div>

          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Booking..." : "Book Parcel"}
          </button>
        </form>
      </div>
    </Layout>
  );
}
