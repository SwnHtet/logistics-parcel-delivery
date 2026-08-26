from typing import Dict, List
from fastapi import WebSocket


class ConnectionManager:
    """Tracks active WebSocket connections, grouped by parcel_id, so location
    updates can be broadcast only to clients watching that specific parcel."""

    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, parcel_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.setdefault(parcel_id, []).append(websocket)

    def disconnect(self, parcel_id: int, websocket: WebSocket):
        connections = self.active_connections.get(parcel_id, [])
        if websocket in connections:
            connections.remove(websocket)
        if not connections and parcel_id in self.active_connections:
            del self.active_connections[parcel_id]

    async def broadcast(self, parcel_id: int, message: dict):
        for connection in self.active_connections.get(parcel_id, []):
            await connection.send_json(message)


ws_manager = ConnectionManager()
