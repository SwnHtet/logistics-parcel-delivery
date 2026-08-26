import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "register") {
        // Public sign-up always creates a customer account. Courier, hub
        // staff, and admin accounts are created by an admin instead (see
        // /admin in the app, or seed_data.py on the backend) — the same
        // way real delivery platforms onboard staff, not via open signup.
        await api.register({ ...form, role: "customer" });
      }
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">
          {mode === "login" ? "Welcome back" : "Create an account"}
        </h1>
        <p className="auth-subtitle">
          Logistics & Parcel Delivery Platform — test console
        </p>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="field">
              <label>Full name</label>
              <input value={form.name} onChange={update("name")} required />
            </div>
          )}

          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={update("email")} required />
          </div>

          <div className="field">
            <label>Password</label>
            <input type="password" value={form.password} onChange={update("password")} required minLength={6} />
          </div>

          {mode === "register" && (
            <div className="field">
              <label>Phone (optional)</label>
              <input value={form.phone} onChange={update("phone")} />
            </div>
          )}

          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        {mode === "register" && (
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 14 }}>
            This creates a customer account. Courier, hub staff, and admin
            accounts are set up by an administrator, not through public sign-up.
          </p>
        )}

        <div className="auth-toggle">
          {mode === "login" ? (
            <>
              <span>Don't have an account?</span>
              <button onClick={() => setMode("register")}>Register</button>
            </>
          ) : (
            <>
              <span>Already have an account?</span>
              <button onClick={() => setMode("login")}>Log in</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}