from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr, ConfigDict

from app.models import UserRole, CourierStatus, ParcelStatus


# ---------- Auth / Users ----------

class UserCreate(BaseModel):
    """Used internally (seed script, admin-created accounts) — allows setting any role."""
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    role: UserRole = UserRole.customer


class PublicRegisterRequest(BaseModel):
    """What the public /auth/register endpoint accepts. No 'role' field exists here
    at all, so a customer account is the only thing a public sign-up can ever create —
    this can't be bypassed by sending extra fields, unlike just defaulting a value."""
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None


class StaffCreateRequest(BaseModel):
    """Used by admins to create courier / hub_staff / admin accounts."""
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    role: UserRole


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: UserRole
    created_at: datetime
    saved_address: Optional[str] = None
    saved_address_lat: Optional[float] = None
    saved_address_lng: Optional[float] = None


class ProfileAddressUpdate(BaseModel):
    saved_address: str
    saved_address_lat: float
    saved_address_lng: float


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ---------- Hubs ----------

class HubCreate(BaseModel):
    name: str
    address: Optional[str] = None
    latitude: float
    longitude: float


class HubOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    address: Optional[str] = None
    latitude: float
    longitude: float


# ---------- Couriers ----------

class CourierLocationUpdate(BaseModel):
    latitude: float
    longitude: float


class CourierStatusUpdate(BaseModel):
    status: CourierStatus


class CourierOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    status: CourierStatus
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    current_hub_id: Optional[int] = None


# ---------- Parcels ----------

class ParcelCreate(BaseModel):
    receiver_name: str
    receiver_phone: str
    receiver_address: str
    pickup_address: str
    pickup_lat: float
    pickup_lng: float
    dropoff_address: str
    dropoff_lat: float
    dropoff_lng: float


class ParcelStatusUpdate(BaseModel):
    status: ParcelStatus
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    note: Optional[str] = None


class ParcelStatusHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status: ParcelStatus
    changed_by_user_id: Optional[int] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    note: Optional[str] = None
    timestamp: datetime


class ParcelOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tracking_number: str
    sender_id: int
    receiver_name: str
    receiver_phone: str
    receiver_address: str
    pickup_address: str
    pickup_lat: float
    pickup_lng: float
    dropoff_address: str
    dropoff_lat: float
    dropoff_lng: float
    current_status: ParcelStatus
    assigned_courier_id: Optional[int] = None
    current_hub_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class ParcelDetailOut(ParcelOut):
    status_history: List[ParcelStatusHistoryOut] = []


class HubTransferCreate(BaseModel):
    parcel_id: int
    to_hub_id: int