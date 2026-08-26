import math
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.security import hash_password


# ---------- Users ----------

def create_user(db: Session, user_in: schemas.UserCreate) -> models.User:
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        name=user_in.name,
        email=user_in.email,
        password_hash=hash_password(user_in.password),
        phone=user_in.phone,
        role=user_in.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # If registering as a courier, auto-create their courier profile.
    if user.role == models.UserRole.courier:
        courier = models.Courier(user_id=user.id, status=models.CourierStatus.offline)
        db.add(courier)
        db.commit()

    return user


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()


# ---------- Hubs ----------

def create_hub(db: Session, hub_in: schemas.HubCreate) -> models.Hub:
    hub = models.Hub(**hub_in.model_dump())
    db.add(hub)
    db.commit()
    db.refresh(hub)
    return hub


def list_hubs(db: Session):
    return db.query(models.Hub).all()


# ---------- Couriers ----------

def _haversine_km(lat1, lng1, lat2, lng2) -> float:
    """Great-circle distance between two points, in kilometers."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def find_nearest_available_courier(db: Session, lat: float, lng: float) -> Optional[models.Courier]:
    candidates = (
        db.query(models.Courier)
        .filter(
            models.Courier.status == models.CourierStatus.available,
            models.Courier.current_lat.isnot(None),
            models.Courier.current_lng.isnot(None),
        )
        .all()
    )
    if not candidates:
        return None
    return min(candidates, key=lambda c: _haversine_km(lat, lng, c.current_lat, c.current_lng))


def update_courier_location(db: Session, courier: models.Courier, lat: float, lng: float) -> models.Courier:
    courier.current_lat = lat
    courier.current_lng = lng
    db.commit()
    db.refresh(courier)
    return courier


def update_courier_status(db: Session, courier: models.Courier, new_status: models.CourierStatus) -> models.Courier:
    courier.status = new_status
    db.commit()
    db.refresh(courier)
    return courier


# ---------- Parcels ----------

def create_parcel(db: Session, parcel_in: schemas.ParcelCreate, sender: models.User) -> models.Parcel:
    parcel = models.Parcel(sender_id=sender.id, **parcel_in.model_dump())
    db.add(parcel)
    db.commit()
    db.refresh(parcel)

    # Seed the audit trail with the initial "created" event.
    _log_status(db, parcel, models.ParcelStatus.created, changed_by_user_id=sender.id)

    # Try to auto-assign the nearest available courier at booking time.
    courier = find_nearest_available_courier(db, parcel.pickup_lat, parcel.pickup_lng)
    if courier:
        parcel.assigned_courier_id = courier.id
        courier.status = models.CourierStatus.on_delivery
        db.commit()
        db.refresh(parcel)

    return parcel


def get_parcel(db: Session, parcel_id: int) -> models.Parcel:
    parcel = db.query(models.Parcel).filter(models.Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    return parcel


def get_parcel_by_tracking_number(db: Session, tracking_number: str) -> models.Parcel:
    parcel = (
        db.query(models.Parcel)
        .filter(models.Parcel.tracking_number == tracking_number)
        .first()
    )
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    return parcel


def list_parcels_for_user(db: Session, user: models.User):
    if user.role == models.UserRole.admin:
        return db.query(models.Parcel).all()
    if user.role == models.UserRole.courier:
        return (
            db.query(models.Parcel)
            .join(models.Courier)
            .filter(models.Courier.user_id == user.id)
            .all()
        )
    # customer / hub_staff default: parcels they sent
    return db.query(models.Parcel).filter(models.Parcel.sender_id == user.id).all()


def _log_status(
    db: Session,
    parcel: models.Parcel,
    status_value: models.ParcelStatus,
    changed_by_user_id: Optional[int] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    note: Optional[str] = None,
) -> models.ParcelStatusHistory:
    entry = models.ParcelStatusHistory(
        parcel_id=parcel.id,
        status=status_value,
        changed_by_user_id=changed_by_user_id,
        location_lat=lat,
        location_lng=lng,
        note=note,
    )
    db.add(entry)
    db.commit()
    return entry


def update_parcel_status(
    db: Session,
    parcel: models.Parcel,
    new_status: models.ParcelStatus,
    changed_by: models.User,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    note: Optional[str] = None,
) -> models.Parcel:
    current = parcel.current_status
    allowed = models.ALLOWED_TRANSITIONS.get(current, set())

    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot move parcel from '{current.value}' to '{new_status.value}'",
        )

    parcel.current_status = new_status
    db.commit()
    db.refresh(parcel)

    _log_status(db, parcel, new_status, changed_by_user_id=changed_by.id, lat=lat, lng=lng, note=note)

    # Free up the courier once a parcel reaches a terminal state.
    if new_status in (models.ParcelStatus.delivered, models.ParcelStatus.failed) and parcel.assigned_courier_id:
        courier = db.query(models.Courier).filter(models.Courier.id == parcel.assigned_courier_id).first()
        if courier:
            courier.status = models.CourierStatus.available
            db.commit()

    return parcel


def transfer_parcel_to_hub(db: Session, parcel: models.Parcel, to_hub_id: int) -> models.HubTransfer:
    transfer = models.HubTransfer(
        parcel_id=parcel.id,
        from_hub_id=parcel.current_hub_id,
        to_hub_id=to_hub_id,
    )
    parcel.current_hub_id = to_hub_id
    db.add(transfer)
    db.commit()
    db.refresh(transfer)
    return transfer
