import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import AddressField from "../components/AddressField";
import { api } from "../api/client";

export default function BookParcelPage() {
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [pickup, setPickup] = useState({ address: "", lat: null, lng: null });
  const [dropoff, setDropoff] = useState({ address: "", lat: null, lng: null });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const resetForm = () => {
    setReceiverName("");
    setReceiverPhone("");
    setReceiverAddress("");
    setPickup({ address: "", lat: null, lng: null });
    setDropoff({ address: "", lat: null, lng: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(null);

    if (pickup.lat == null || pickup.lng == null) {
      setError("Please confirm the pickup address using \"Use my location\" or by selecting a suggestion.");
      return;
    }
    if (dropoff.lat == null || dropoff.lng == null) {
      setError("Please confirm the drop-off address by selecting a suggestion from the search results.");
      return;
    }

    setBusy(true);
    try {
      const parcel = await api.bookParcel({
        receiver_name: receiverName,
        receiver_phone: receiverPhone,
        receiver_address: receiverAddress,
        pickup_address: pickup.address,
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        dropoff_address: dropoff.address,
        dropoff_lat: dropoff.lat,
        dropoff_lng: dropoff.lng,
      });
      setSuccess(parcel);
      resetForm();
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
        Share your location or type an address — pick a suggestion to confirm the exact spot.
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
              <input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} required />
            </div>
            <div className="field">
              <label>Receiver phone</label>
              <input value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} required />
            </div>
          </div>
          <div className="field">
            <label>Receiver's delivery address</label>
            <input
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
              placeholder="e.g. Apartment 4B, 123 Main St"
              required
            />
          </div>

          <h2 className="card-title" style={{ marginTop: 22 }}>Pickup & drop-off</h2>
          <AddressField label="Pickup address" value={pickup} onChange={setPickup} />
          <AddressField label="Drop-off address" value={dropoff} onChange={setDropoff} />

          <button className="btn btn-primary" disabled={busy} style={{ marginTop: 4 }}>
            {busy ? "Booking..." : "Book Parcel"}
          </button>
        </form>
      </div>
    </Layout>
  );
}