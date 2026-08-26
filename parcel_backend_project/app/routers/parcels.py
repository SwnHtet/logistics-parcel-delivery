from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.ws_manager import ws_manager

router = APIRouter(prefix="/parcels", tags=["parcels"])


@router.post("/", response_model=schemas.ParcelOut, status_code=201)
def book_parcel(
    parcel_in: schemas.ParcelCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Any logged-in user can book a parcel (acts as the sender)."""
    return crud.create_parcel(db, parcel_in, current_user)


@router.get("/", response_model=List[schemas.ParcelOut])
def list_my_parcels(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.list_parcels_for_user(db, current_user)


@router.get("/track/{tracking_number}", response_model=schemas.ParcelDetailOut)
def track_parcel(tracking_number: str, db: Session = Depends(get_db)):
    """Public tracking lookup by tracking number — no login required,
    same idea as any real courier tracking page."""
    return crud.get_parcel_by_tracking_number(db, tracking_number)


@router.get("/{parcel_id}", response_model=schemas.ParcelDetailOut)
def get_parcel(
    parcel_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.get_parcel(db, parcel_id)


@router.patch("/{parcel_id}/status", response_model=schemas.ParcelOut)
async def change_parcel_status(
    parcel_id: int,
    payload: schemas.ParcelStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        require_roles(models.UserRole.courier, models.UserRole.hub_staff, models.UserRole.admin)
    ),
):
    parcel = crud.get_parcel(db, parcel_id)
    parcel = crud.update_parcel_status(
        db, parcel, payload.status, current_user,
        lat=payload.latitude, lng=payload.longitude, note=payload.note,
    )

    await ws_manager.broadcast(parcel.id, {
        "event": "status_update",
        "parcel_id": parcel.id,
        "status": parcel.current_status.value,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
    })

    return parcel


@router.post("/hub-transfer", response_model=schemas.ParcelOut)
def hub_transfer(
    payload: schemas.HubTransferCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        require_roles(models.UserRole.hub_staff, models.UserRole.admin)
    ),
):
    parcel = crud.get_parcel(db, payload.parcel_id)
    crud.transfer_parcel_to_hub(db, parcel, payload.to_hub_id)
    return parcel
