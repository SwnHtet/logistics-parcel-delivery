from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.database import get_db
from app.dependencies import require_roles

router = APIRouter(prefix="/hubs", tags=["hubs"])


@router.post("/", response_model=schemas.HubOut, status_code=201)
def create_hub(
    hub_in: schemas.HubCreate,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_roles(models.UserRole.admin)),
):
    return crud.create_hub(db, hub_in)


@router.get("/", response_model=List[schemas.HubOut])
def list_hubs(db: Session = Depends(get_db)):
    return crud.list_hubs(db)
