# Logistics & Parcel Delivery Platform — Frontend (Test Console)

A React app built to exercise every endpoint in the FastAPI backend —
registration, booking, courier status/location updates, hub transfers,
admin overview, and **live WebSocket tracking**. Styled to match the
project's presentation deck so it looks consistent, but the priority here
is functional testing, not marketing polish.

## 1. Setup

```bash
npm install
npm run dev
```

Opens at **http://localhost:5173**. It talks to the backend at
`http://127.0.0.1:8000` by default — see `src/api/client.js` if you need to
change that (e.g. once you deploy the backend somewhere else).

**Make sure the backend is running first** (`uvicorn app.main:app --reload`
in the backend project), otherwise every page will show connection errors.

## 2. Test accounts

If you ran `python seed_data.py` on the backend, you can log in immediately
with:

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | admin123 |
| Hub Staff | hubstaff@example.com | hub123 |
| Customer | alice@example.com | alice123 |
| Courier | bob@example.com | bob123 |
| Courier | dan@example.com | dan123 |

Or just register new accounts from the login page — a role selector is
built into the register form.

## 3. Suggested test flow (this exercises every backend feature)

1. **Log in as a courier** (bob@example.com) → Courier Dashboard
   - Click "Go Available"
   - Click "Simulate Route" (sends 6 fake GPS pings over 6 seconds —
     stands in for a real phone's GPS, since this is a class project)
2. **Open a second browser tab, log in as the customer** (alice@example.com)
   → Book a Parcel → submit with the default coordinates
   - You should see it auto-assign a courier immediately
3. Go to **My Parcels → View** on the parcel you just booked
   - Note the "Live tracking connected" pill — this is the WebSocket
     connection from `routers/tracking.py`
4. **Switch back to the courier tab**, click through the status buttons:
   `picked_up → in_transit → out_for_delivery → delivered`
5. **Switch back to the customer's parcel detail tab** — you should see
   each status change appear in the live event feed and the timeline
   update *without refreshing the page*. This is the real-time tracking
   feature actually working, not simulated on the frontend.
6. **Log in as hub staff** (hubstaff@example.com) → record a hub transfer
   for any parcel ID
7. **Log in as admin** (admin@example.com) → see system-wide stats, all
   parcels, all users, and create a new hub

## 4. Pages included

| Route | Role | Purpose |
|---|---|---|
| `/login` | anyone | Login / register (role selector included) |
| `/book` | customer | Book a parcel |
| `/parcels` | customer | List of parcels you've booked |
| `/parcels/:id` | any logged-in user | Parcel detail + **live WebSocket feed** + timeline |
| `/track` | any logged-in user | Public-style tracking-number lookup |
| `/courier` | courier | Availability toggle, location simulator, assigned-parcel status buttons |
| `/hub` | hub_staff | Record hub transfers, view hubs/parcels |
| `/admin` | admin | System stats, all parcels, all users, create hubs |

The UI only shows status-transition buttons that the backend's state
machine will actually accept (see `NEXT_STEPS` in
`CourierDashboardPage.jsx`) — if you want to test an *illegal* transition
on purpose, use Swagger UI (`/docs` on the backend) instead, since the
frontend deliberately won't offer that button.

## 5. Notes for your team

- No map library (Leaflet/Google Maps) is wired in yet — locations are
  shown as raw lat/lng. Good next task for whoever owns the map/UI polish.
- `simulateMovement()` in `CourierDashboardPage.jsx` is the "fake GPS
  device" — swap this for `navigator.geolocation.watchPosition(...)` if
  you want to test with a real phone's location instead.
- All API calls live in one file (`src/api/client.js`) — makes it easy to
  point at a deployed backend URL later (just change `BASE_URL`).
