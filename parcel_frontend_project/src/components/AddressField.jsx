import { useState, useRef, useEffect } from "react";
import { api } from "../api/client";

/**
 * An address text field that can be filled in three ways, matching how
 * real delivery apps handle location:
 *   1. "Use my location" — asks the browser for GPS permission, then
 *      reverse-geocodes the coordinates into a readable address.
 *   2. Typing — searches OpenStreetMap as you type and shows matching
 *      addresses to pick from (forward geocoding).
 *   3. Manual edit — the resulting address text is a normal input, so the
 *      user can tweak it (add a unit number, landmark, etc.) after it's
 *      auto-filled.
 *
 * Whichever way it's filled, the parent always ends up with both the
 * display address AND the lat/lng the backend needs, via onChange.
 */
export default function AddressField({ label, value, onChange }) {
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);

  const handleTextChange = (text) => {
    onChange({ address: text, lat: null, lng: null });
    setError("");

    clearTimeout(debounceRef.current);
    if (text.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await api.geocodeSearch(text);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (_) {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  };

  const pickSuggestion = (s) => {
    onChange({ address: s.display_name, lat: s.latitude, lng: s.longitude });
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Your browser doesn't support location sharing.");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const result = await api.geocodeReverse(latitude, longitude);
          onChange({ address: result.display_name, lat: latitude, lng: longitude });
        } catch (_) {
          // Reverse lookup failed, but we still have coordinates — fall back
          // to showing them so the field isn't left empty.
          onChange({ address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, lat: latitude, lng: longitude });
        } finally {
          setLocating(false);
        }
      },
      (geoError) => {
        setLocating(false);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError("Location permission denied. Type your address instead.");
        } else {
          setError("Couldn't get your location. Type your address instead.");
        }
      }
    );
  };

  return (
    <div className="field" style={{ position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label>{label}</label>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          style={{
            background: "none", border: "none", color: "var(--teal)",
            fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0,
          }}
        >
          {locating ? "Locating..." : "📍 Use my location"}
        </button>
      </div>
      <input
        value={value.address}
        onChange={(e) => handleTextChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        placeholder="Start typing an address..."
        required
      />
      {value.lat != null && (
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
          ✓ Location confirmed ({value.lat.toFixed(4)}, {value.lng.toFixed(4)})
        </div>
      )}
      {error && <div style={{ fontSize: 11.5, color: "var(--danger)", marginTop: 3 }}>{error}</div>}
      {searching && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>Searching...</div>}

      {showSuggestions && suggestions.length > 0 && (
        <ul style={{
          listStyle: "none", margin: "4px 0 0", padding: 4, position: "absolute",
          top: "100%", left: 0, right: 0, background: "white", border: "1px solid var(--border)",
          borderRadius: 8, boxShadow: "var(--shadow)", zIndex: 10, maxHeight: 220, overflowY: "auto",
        }}>
          {suggestions.map((s, i) => (
            <li
              key={i}
              onMouseDown={() => pickSuggestion(s)}
              style={{ padding: "8px 10px", fontSize: 13, cursor: "pointer", borderRadius: 6 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ice)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {s.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}