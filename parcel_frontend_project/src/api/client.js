const BASE_URL = "http://127.0.0.1:8000";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, { method = "GET", body, auth = true, form = false } = {}) {
  const headers = {};
  if (!form) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: form ? body : body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    // no JSON body
  }

  if (!res.ok) {
    const message = data?.detail || res.statusText || "Request failed";
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }
  return data;
}

export const api = {
  BASE_URL,

  register: (payload) => request("/auth/register", { method: "POST", body: payload, auth: false }),

  login: (email, password) => {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);
    return request("/auth/login", { method: "POST", body: form, auth: false, form: true });
  },

  me: () => request("/users/me"),

  listHubs: () => request("/hubs/", { auth: false }),
  createHub: (payload) => request("/hubs/", { method: "POST", body: payload }),

  bookParcel: (payload) => request("/parcels/", { method: "POST", body: payload }),
  myParcels: () => request("/parcels/"),
  getParcel: (id) => request(`/parcels/${id}`),
  trackParcel: (trackingNumber) => request(`/parcels/track/${trackingNumber}`, { auth: false }),
  updateParcelStatus: (id, payload) => request(`/parcels/${id}/status`, { method: "PATCH", body: payload }),
  hubTransfer: (payload) => request("/parcels/hub-transfer", { method: "POST", body: payload }),

  courierMe: () => request("/couriers/me"),
  updateCourierStatus: (status) => request("/couriers/me/status", { method: "POST", body: { status } }),
  updateCourierLocation: (latitude, longitude) =>
    request("/couriers/me/location", { method: "POST", body: { latitude, longitude } }),

  listUsers: () => request("/users/"),
  createStaff: (payload) => request("/auth/staff", { method: "POST", body: payload }),
};

export function wsUrl(parcelId) {
  return `${BASE_URL.replace("http", "ws")}/ws/parcels/${parcelId}`;
}
