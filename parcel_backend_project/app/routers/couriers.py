from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.ws_manager import ws_manager

router = APIRouter(prefix="/couriers", tags=["couriers"])


def _get_courier_profile(db: Session, user: models.User) -> models.Courier:
    courier = db.query(models.Courier).filter(models.Courier.user_id == user.id).first()
    if not courier:
        raise HTTPException(status_code=404, detail="Courier profile not found")
    return courier


@router.get("/me", response_model=schemas.CourierOut)
def get_my_courier_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.UserRole.courier)),
):
    return _get_courier_profile(db, current_user)


@router.post("/me/location", response_model=schemas.CourierOut)
async def update_my_location(
    payload: schemas.CourierLocationUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.UserRole.courier)),
):
    courier = _get_courier_profile(db, current_user)
    courier = crud.update_courier_location(db, courier, payload.latitude, payload.longitude)

    # Broadcast the new location to anyone watching this courier's active parcel(s).
    active_parcels = [p for p in courier.parcels if p.current_status not in (
        models.ParcelStatus.delivered, models.ParcelStatus.failed
    )]
    for parcel in active_parcels:
        await ws_manager.broadcast(parcel.id, {
            "event": "courier_location",
            "parcel_id": parcel.id,
            "latitude": payload.latitude,
            "longitude": payload.longitude,
        })

    return courier


@router.post("/me/status", response_model=schemas.CourierOut)
def update_my_status(
    payload: schemas.CourierStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.UserRole.courier)),
):
    courier = _get_courier_profile(db, current_user)
    return crud.update_courier_status(db, courier, payload.status)
