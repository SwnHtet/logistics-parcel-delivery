from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.ws_manager import ws_manager

router = APIRouter(tags=["tracking"])


@router.websocket("/ws/parcels/{parcel_id}")
async def parcel_tracking_socket(websocket: WebSocket, parcel_id: int):
    """A customer's frontend connects here (e.g. new WebSocket(`ws://.../ws/parcels/${id}`))
    to receive live courier-location and status-update events for one parcel."""
    await ws_manager.connect(parcel_id, websocket)
    try:
        while True:
            # We don't expect incoming messages from the tracking client,
            # but we must keep the loop alive to detect disconnects.
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(parcel_id, websocket)
