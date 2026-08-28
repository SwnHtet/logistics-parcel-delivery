import { useState } from "react";
import Layout from "../components/Layout";
import AddressField from "../components/AddressField";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [address, setAddress] = useState({
    address: user?.saved_address || "",
    lat: user?.saved_address_lat ?? null,
    lng: user?.saved_address_lng ?? null,
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (address.lat == null || address.lng == null) {
      setError("Please confirm the address using \"Use my location\" or by selecting a suggestion.");
      return;
    }

    setBusy(true);
    try {
      await api.updateMyAddress({
        saved_address: address.address,
        saved_address_lat: address.lat,
        saved_address_lng: address.lng,
      });
      setMessage("Saved address updated.");
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <h1 className="page-title">My Profile</h1>
      <p className="page-subtitle">
        Save a default address (e.g. home or work) to reuse when booking parcels.
      </p>

      <div className="card">
        <h2 className="card-title">Account</h2>
        <p><strong>Name:</strong> {user?.name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.role?.replace("_", " ")}</p>
      </div>

      <div className="card">
        <h2 className="card-title">Saved Address</h2>
        {error && <div className="error-banner">{error}</div>}
        {message && <div className="success-banner">{message}</div>}
        <form onSubmit={handleSave}>
          <AddressField label="Default address" value={address} onChange={setAddress} />
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Saving..." : "Save Address"}
          </button>
        </form>
      </div>
    </Layout>
  );
}