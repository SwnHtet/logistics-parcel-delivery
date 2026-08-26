import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import { api, wsUrl } from "../api/client";

export default function ParcelDetailPage() {
  const { id } = useParams();
  const [parcel, setParcel] = useState(null);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const socketRef = useRef(null);

  const load = useCallback(() => {
    api.getParcel(id).then(setParcel).catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const socket = new WebSocket(wsUrl(id));
    socketRef.current = socket;

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const time = new Date().toLocaleTimeString();
      setEvents((prev) => [
        `[${time}] ${data.event}: ${JSON.stringify(data)}`,
        ...prev,
      ].slice(0, 30));
      // Refresh parcel details whenever a status update comes through.
      if (data.event === "status_update") load();
    };

    return () => socket.close();
  }, [id, load]);

  if (error) {
    return (
      <Layout>
        <div className="error-banner">{error}</div>
      </Layout>
    );
  }

  if (!parcel) {
    return (
      <Layout>
        <div className="empty-state">Loading parcel...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="page-title">Parcel {parcel.tracking_number}</h1>
      <p className="page-subtitle">
        <StatusBadge status={parcel.current_status} />{" "}
        <span className={`live-pill ${connected ? "live-on" : "live-off"}`} style={{ marginLeft: 10 }}>
          <span className={connected ? "pulse" : "dot dot-offline"} />
          {connected ? "Live tracking connected" : "Disconnected"}
        </span>
      </p>

      <div className="grid-2">
        <div className="card">
          <h2 className="card-title">Delivery details</h2>
          <p><strong>Receiver:</strong> {parcel.receiver_name} · {parcel.receiver_phone}</p>
          <p><strong>Address:</strong> {parcel.receiver_address}</p>
          <p><strong>Pickup:</strong> {parcel.pickup_lat}, {parcel.pickup_lng}</p>
          <p><strong>Drop-off:</strong> {parcel.dropoff_lat}, {parcel.dropoff_lng}</p>
          <p><strong>Assigned courier:</strong> {parcel.assigned_courier_id ? `#${parcel.assigned_courier_id}` : "Not yet assigned"}</p>
        </div>

        <div className="card">
          <h2 className="card-title">Live event feed (WebSocket)</h2>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: -8, marginBottom: 12 }}>
            Open this page in a second tab while a courier updates status/location elsewhere to see events arrive here in real time.
          </p>
          <div className="event-log">
            {events.length === 0 ? (
              <div style={{ color: "#7A8CA0" }}>Waiting for events...</div>
            ) : (
              events.map((e, i) => <div key={i}>{e}</div>)
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Status timeline</h2>
        <ul className="timeline">
          {parcel.status_history.map((h, i) => (
            <li className="timeline-item" key={i}>
              <span className="timeline-dot" />
              <StatusBadge status={h.status} />
              {h.note && <span style={{ marginLeft: 8, fontSize: 13 }}>{h.note}</span>}
              <div className="timeline-time">
                {new Date(h.timestamp + "Z").toLocaleString()}
                {h.location_lat != null && ` · ${h.location_lat.toFixed(4)}, ${h.location_lng.toFixed(4)}`}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}
