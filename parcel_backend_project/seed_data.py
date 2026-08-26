"""
Populates the database with demo users, hubs, and couriers so you don't
have to manually register accounts every time you restart the database.

Run with:  python seed_data.py
"""
from app.database import Base, engine, SessionLocal
from app import models
from app.security import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()

def get_or_create_user(name, email, password, role, phone=None):
    user = db.query(models.User).filter(models.User.email == email).first()
    if user:
        return user
    user = models.User(
        name=name, email=email, password_hash=hash_password(password),
        role=role, phone=phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    if role == models.UserRole.courier:
        db.add(models.Courier(user_id=user.id, status=models.CourierStatus.available))
        db.commit()
    return user

def get_or_create_hub(name, address, lat, lng):
    hub = db.query(models.Hub).filter(models.Hub.name == name).first()
    if hub:
        return hub
    hub = models.Hub(name=name, address=address, latitude=lat, longitude=lng)
    db.add(hub)
    db.commit()
    db.refresh(hub)
    return hub

print("Seeding demo data...")

admin = get_or_create_user("Admin User", "admin@example.com", "admin123", models.UserRole.admin)
hub_staff = get_or_create_user("Hub Staff One", "hubstaff@example.com", "hub123", models.UserRole.hub_staff)
customer = get_or_create_user("Alice Customer", "alice@example.com", "alice123", models.UserRole.customer)
courier1 = get_or_create_user("Bob Courier", "bob@example.com", "bob123", models.UserRole.courier, phone="0810000001")
courier2 = get_or_create_user("Dan Courier", "dan@example.com", "dan123", models.UserRole.courier, phone="0810000002")

hub_a = get_or_create_hub("Hub A - Bangkok Central", "Bangkok, Thailand", 13.7563, 100.5018)
hub_b = get_or_create_hub("Hub B - Pathum Thani", "Pathum Thani, Thailand", 14.0208, 100.5250)

# Give couriers a starting location + mark them available
c1 = db.query(models.Courier).filter(models.Courier.user_id == courier1.id).first()
c1.current_lat, c1.current_lng, c1.current_hub_id = 13.75, 100.50, hub_a.id
c2 = db.query(models.Courier).filter(models.Courier.user_id == courier2.id).first()
c2.current_lat, c2.current_lng, c2.current_hub_id = 14.02, 100.52, hub_b.id
db.commit()

print("Done. Demo accounts (all passwords shown above):")
print(f"  Admin      -> {admin.email} / admin123")
print(f"  Hub Staff  -> {hub_staff.email} / hub123")
print(f"  Customer   -> {customer.email} / alice123")
print(f"  Courier 1  -> {courier1.email} / bob123")
print(f"  Courier 2  -> {courier2.email} / dan123")
print(f"Hubs created: {hub_a.name}, {hub_b.name}")

db.close()
