import httpx
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/geocode", tags=["geocode"])

# OpenStreetMap's Nominatim — free, no API key needed. Usage policy requires
# a real User-Agent identifying the app and a max of ~1 request/second, which
# is more than enough for a class project. In a production app you'd swap
# this for a paid provider (Google Maps, Mapbox) with a proper key.
NOMINATIM_BASE = "https://nominatim.openstreetmap.org"
HEADERS = {"User-Agent": "CSC480-ParcelDeliveryPlatform/1.0"}


@router.get("/search")
async def search_address(q: str = Query(..., min_length=3)):
    """Forward geocoding: turns a typed address into candidate lat/lng matches.
    Used for the drop-off address autocomplete."""
    async with httpx.AsyncClient(timeout=8.0) as client:
        try:
            resp = await client.get(
                f"{NOMINATIM_BASE}/search",
                params={"q": q, "format": "json", "limit": 5},
                headers=HEADERS,
            )
            resp.raise_for_status()
        except httpx.HTTPError:
            raise HTTPException(status_code=502, detail="Address lookup service unavailable")

    results = resp.json()
    return [
        {
            "display_name": r["display_name"],
            "latitude": float(r["lat"]),
            "longitude": float(r["lon"]),
        }
        for r in results
    ]


@router.get("/reverse")
async def reverse_geocode(lat: float, lng: float):
    """Reverse geocoding: turns GPS coordinates (from the browser's
    navigator.geolocation) into a human-readable address. Used to auto-fill
    the pickup address once the user shares their location."""
    async with httpx.AsyncClient(timeout=8.0) as client:
        try:
            resp = await client.get(
                f"{NOMINATIM_BASE}/reverse",
                params={"lat": lat, "lon": lng, "format": "json"},
                headers=HEADERS,
            )
            resp.raise_for_status()
        except httpx.HTTPError:
            raise HTTPException(status_code=502, detail="Address lookup service unavailable")

    data = resp.json()
    if "display_name" not in data:
        raise HTTPException(status_code=404, detail="No address found for this location")

    return {"display_name": data["display_name"], "latitude": lat, "longitude": lng}