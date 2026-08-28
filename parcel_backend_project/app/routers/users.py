from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas, crud
from app.database import get_db
from app.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=schemas.UserOut)
def read_current_user(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.patch("/me/address", response_model=schemas.UserOut)
def update_my_address(
    payload: schemas.ProfileAddressUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Saves a default address (e.g. 'home' or 'work') to the user's profile,
    set via the Profile page using either GPS or a typed/searched address."""
    return crud.update_profile_address(db, current_user, payload)


@router.get("/", response_model=List[schemas.UserOut])
def list_users(
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_roles(models.UserRole.admin)),
):
    return db.query(models.User).all()