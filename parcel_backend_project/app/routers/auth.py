from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import crud, models, schemas, security
from app.database import get_db
from app.dependencies import require_roles

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: schemas.PublicRegisterRequest, db: Session = Depends(get_db)):
    """Public sign-up. Always creates a customer account — there is no 'role'
    field on this request schema, so it cannot be used to create a courier,
    hub_staff, or admin account no matter what a client sends."""
    full_user = schemas.UserCreate(**user_in.model_dump(), role=models.UserRole.customer)
    return crud.create_user(db, full_user)


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # OAuth2PasswordRequestForm uses "username" as the field name; we treat it as email.
    user = crud.get_user_by_email(db, form_data.username)
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = security.create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return schemas.Token(access_token=token)


@router.post("/staff", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def create_staff_account(
    payload: schemas.StaffCreateRequest,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_roles(models.UserRole.admin)),
):
    """Admin-only. Creates a courier, hub_staff, or admin account.
    This is the real-world equivalent of an ops manager onboarding staff —
    the same pattern used by actual delivery platforms (courier/staff accounts
    are provisioned by the company, never self-registered)."""
    full_user = schemas.UserCreate(**payload.model_dump())
    return crud.create_user(db, full_user)