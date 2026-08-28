import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
)
from sqlalchemy.orm import relationship

from app.database import Base


class UserRole(str, enum.Enum):
    customer = "customer"
    courier = "courier"
    hub_staff = "hub_staff"
    admin = "admin"


class CourierStatus(str, enum.Enum):
    available = "available"
    on_delivery = "on_delivery"
    offline = "offline"


class ParcelStatus(str, enum.Enum):
    created = "created"
    picked_up = "picked_up"
    at_hub = "at_hub"
    in_transit = "in_transit"
    out_for_delivery = "out_for_delivery"
    delivered = "delivered"
    failed = "failed"


# Allowed forward transitions for the parcel state machine.
# Enforced in crud.update_parcel_status so a parcel can't jump illegal states.
ALLOWED_TRANSITIONS = {
    ParcelStatus.created: {ParcelStatus.picked_up, ParcelStatus.failed},
    ParcelStatus.picked_up: {ParcelStatus.at_hub, ParcelStatus.in_transit, ParcelStatus.failed},
    ParcelStatus.at_hub: {ParcelStatus.in_transit, ParcelStatus.out_for_delivery, ParcelStatus.failed},
    ParcelStatus.in_transit: {ParcelStatus.at_hub, ParcelStatus.out_for_delivery, ParcelStatus.failed},
    ParcelStatus.out_for_delivery: {ParcelStatus.delivered, ParcelStatus.failed},
    ParcelStatus.delivered: set(),
    ParcelStatus.failed: {ParcelStatus.picked_up},  # allow re-attempt
}


def generate_tracking_number() -> str:
    return "PCL-" + uuid.uuid4().hex[:10].upper()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(30), nullable=True)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.customer)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Saved default address (set from the Profile page) — lets a customer
    # reuse "home" or "work" as pickup without re-entering it every time.
    saved_address = Column(String(255), nullable=True)
    saved_address_lat = Column(Float, nullable=True)
    saved_address_lng = Column(Float, nullable=True)

    courier_profile = relationship("Courier", back_populates="user", uselist=False)
    sent_parcels = relationship("Parcel", back_populates="sender", foreign_keys="Parcel.sender_id")


class Hub(Base):
    __tablename__ = "hubs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    address = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Courier(Base):
    __tablename__ = "couriers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    current_hub_id = Column(Integer, ForeignKey("hubs.id"), nullable=True)
    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)
    status = Column(Enum(CourierStatus), default=CourierStatus.offline)

    user = relationship("User", back_populates="courier_profile")
    current_hub = relationship("Hub")
    parcels = relationship("Parcel", back_populates="assigned_courier")


class Parcel(Base):
    __tablename__ = "parcels"

    id = Column(Integer, primary_key=True, index=True)
    tracking_number = Column(String(30), unique=True, index=True, default=generate_tracking_number)

    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_name = Column(String(120), nullable=False)
    receiver_phone = Column(String(30), nullable=False)
    receiver_address = Column(String(255), nullable=False)

    pickup_address = Column(String(255), nullable=False)
    pickup_lat = Column(Float, nullable=False)
    pickup_lng = Column(Float, nullable=False)
    dropoff_address = Column(String(255), nullable=False)
    dropoff_lat = Column(Float, nullable=False)
    dropoff_lng = Column(Float, nullable=False)

    current_status = Column(Enum(ParcelStatus), default=ParcelStatus.created, nullable=False)
    assigned_courier_id = Column(Integer, ForeignKey("couriers.id"), nullable=True)
    current_hub_id = Column(Integer, ForeignKey("hubs.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sender = relationship("User", back_populates="sent_parcels", foreign_keys=[sender_id])
    assigned_courier = relationship("Courier", back_populates="parcels")
    current_hub = relationship("Hub")
    status_history = relationship(
        "ParcelStatusHistory", back_populates="parcel",
        order_by="ParcelStatusHistory.timestamp", cascade="all, delete-orphan"
    )


class ParcelStatusHistory(Base):
    __tablename__ = "parcel_status_history"

    id = Column(Integer, primary_key=True, index=True)
    parcel_id = Column(Integer, ForeignKey("parcels.id"), nullable=False)
    status = Column(Enum(ParcelStatus), nullable=False)
    changed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    note = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    parcel = relationship("Parcel", back_populates="status_history")


class HubTransfer(Base):
    __tablename__ = "hub_transfers"

    id = Column(Integer, primary_key=True, index=True)
    parcel_id = Column(Integer, ForeignKey("parcels.id"), nullable=False)
    from_hub_id = Column(Integer, ForeignKey("hubs.id"), nullable=True)
    to_hub_id = Column(Integer, ForeignKey("hubs.id"), nullable=False)
    transferred_at = Column(DateTime, default=datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parcel_id = Column(Integer, ForeignKey("parcels.id"), nullable=True)
    type = Column(String(50), nullable=False)
    message = Column(String(255), nullable=False)
    sent_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime, nullable=True)