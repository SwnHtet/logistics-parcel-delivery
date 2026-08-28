from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth, users, parcels, couriers, hubs, tracking, geocode

# Creates tables if they don't exist yet. Fine for a class project;
# a real production app would use Alembic migrations instead.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Logistics & Parcel Delivery Platform API",
    description="Backend for CSC480 group project — parcel booking, tracking, and delivery management.",
    version="0.1.0",
)

# Allow the React frontend (running on a different port/origin) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your frontend's URL before deploying
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(hubs.router)
app.include_router(couriers.router)
app.include_router(parcels.router)
app.include_router(tracking.router)
app.include_router(geocode.router)


@app.get("/")
def root():
    return {"message": "Logistics & Parcel Delivery Platform API is running"}