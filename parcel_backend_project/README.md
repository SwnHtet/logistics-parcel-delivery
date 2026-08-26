# Logistics & Parcel Delivery Platform — Backend

FastAPI backend for the CSC480 group project. Covers parcel booking, the
parcel state machine with full audit history, role-based access (customer /
courier / hub_staff / admin), nearest-courier assignment, and real-time
tracking over WebSocket.

## 1. Setup

```bash
# from the project folder
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env            # then edit .env if you want PostgreSQL
```

By default `.env` points at SQLite (`parcel_delivery.db`), so the app runs
with zero extra setup. To use PostgreSQL instead, install it locally (or use
a free host like Supabase/Railway/Neon), create a database, then set:

```
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<db_name>
```

## 2. Run it

```bash
uvicorn app.main:app --reload
```

- API root: http://127.0.0.1:8000
- Interactive docs (Swagger UI): http://127.0.0.1:8000/docs

Tables are created automatically on first run — no migration step needed
for this project.

## 3. Load demo data (optional but recommended)

```bash
python seed_data.py
```

Creates an admin, hub staff member, customer, two couriers, and two hubs so
you can test immediately without registering accounts by hand. Login
credentials are printed to the console when you run it.

## 4. Project structure

```
app/
├── main.py            FastAPI app + router registration + CORS
├── config.py          Settings (reads .env)
├── database.py        SQLAlchemy engine/session
├── models.py           All tables + the parcel state machine rules
├── schemas.py          Pydantic request/response models
├── security.py          Password hashing + JWT helpers
├── dependencies.py      get_current_user + require_roles(...) guard
├── crud.py               Business logic (booking, status transitions,
│                         nearest-courier matching, hub transfers)
├── ws_manager.py         WebSocket connection manager for live tracking
└── routers/
    ├── auth.py           /auth/register, /auth/login
    ├── users.py          /users/me, /users (admin only)
    ├── hubs.py           /hubs (create = admin, list = anyone)
    ├── couriers.py       /couriers/me, .../location, .../status
    ├── parcels.py        /parcels (book, list, get, status update, transfer)
    └── tracking.py       /ws/parcels/{parcel_id}  (WebSocket)
```

## 5. How the core pieces work

**Parcel state machine** (`models.ALLOWED_TRANSITIONS`)
A parcel can only move to specific next states — e.g. `picked_up` can go to
`at_hub`, `in_transit`, or `failed`, but never straight to `delivered`.
Illegal transitions return `409 Conflict`. Every transition — legal or not
attempted twice — is written to `parcel_status_history`, so nothing is ever
overwritten; you always have the full timeline.

**Roles** (`dependencies.require_roles(...)`)
Each endpoint that should be restricted takes a dependency like:
```python
current_user: models.User = Depends(require_roles(models.UserRole.admin))
```
Anyone with the wrong role gets `403 Forbidden`.

**Nearest-courier assignment** (`crud.find_nearest_available_courier`)
Uses the haversine formula (great-circle distance) over all couriers with
`status = available`, no PostGIS/extra dependency required. Runs
automatically the moment a parcel is booked.

**Real-time tracking** (`ws_manager.py` + `routers/tracking.py`)
A frontend client connects to `ws://.../ws/parcels/{parcel_id}`. Whenever a
courier posts a new location (`POST /couriers/me/location`) or a status
changes (`PATCH /parcels/{id}/status`), the update is broadcast to every
client watching that parcel. In the browser:
```js
const socket = new WebSocket(`ws://127.0.0.1:8000/ws/parcels/${parcelId}`);
socket.onmessage = (event) => console.log(JSON.parse(event.data));
```

## 6. Example flow to try in Swagger UI (`/docs`)

1. `POST /auth/register` — create a customer and a courier account
2. `POST /auth/login` — log in as the courier, copy the `access_token`
3. Click "Authorize" in Swagger UI, paste the token
4. `POST /couriers/me/status` → `{"status": "available"}`
5. `POST /couriers/me/location` → set a lat/lng
6. Log in as the customer instead, authorize with their token
7. `POST /parcels/` — book a parcel; check the response, a courier should
   already be auto-assigned
8. Switch back to the courier's token
9. `PATCH /parcels/{id}/status` — walk it through
   `picked_up → in_transit → out_for_delivery → delivered`
10. `GET /parcels/track/{tracking_number}` — see the full status history

## 7. What's intentionally left simple (and why)

- **No message queue (Kafka/RabbitMQ)** — notifications/events happen
  in-process. Fine at class-project scale; mention in your report that a
  production version would move this to a queue for decoupling.
- **No Redis** — courier's live location is stored directly in the
  `couriers` table. Sufficient at this scale since it's just overwritten.
- **`Base.metadata.create_all` instead of Alembic migrations** — simplest
  option for a project with one deployment target. Worth mentioning as a
  "future improvement" in your report.

## 8. Next steps for the team

- Build the React frontend against this API (Swagger docs at `/docs` show
  every request/response shape)
- Add automated tests with `pytest` for the state machine rules
- Add email/SMS sending via `BackgroundTasks` for the `notifications` table
  (currently the table exists but nothing writes to it yet — good task to
  split off to one teammate)
