import { useEffect } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Circle,
    useMapEvents,
    useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ── Custom dark-store marker icon ────────────────────── */
const storeIcon = new L.DivIcon({
    html: `<div style="
    width:32px;height:32px;border-radius:50%;
    background:linear-gradient(135deg,#6c63ff,#4f46e5);
    border:3px solid #e8eaed;
    box-shadow:0 0 12px rgba(108,99,255,0.5);
    display:flex;align-items:center;justify-content:center;
  ">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  </div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
});

export interface Pin {
    id: string;
    lat: number;
    lng: number;
}

export interface RadiusCircle {
    id: string;
    lat: number;
    lng: number;
    radiusMeters: number;
}

interface MapViewProps {
    center: [number, number];
    pins: Pin[];
    circles: RadiusCircle[];
    onMapClick: (lat: number, lng: number) => void;
}

/* ── Re-center helper ─────────────────────────────────── */
function RecenterMap({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, 12, { duration: 1.2 });
    }, [center, map]);
    return null;
}

/* ── Invalidate map size on mount ─────────────────────── */
function MapSizeFixer() {
    const map = useMap();
    useEffect(() => {
        // Fix tile rendering when map container resizes
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 100);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
}

/* ── Click handler ────────────────────────────────────── */
function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

export default function MapView({ center, pins, circles, onMapClick }: MapViewProps) {
    return (
        <MapContainer
            center={center}
            zoom={12}
            zoomControl={true}
            style={{ height: "100%", width: "100%" }}
        >
            <TileLayer
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RecenterMap center={center} />
            <MapSizeFixer />
            <ClickHandler onClick={onMapClick} />

            {pins.map((pin) => (
                <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={storeIcon} />
            ))}

            {circles.map((c) => (
                <Circle
                    key={c.id}
                    center={[c.lat, c.lng]}
                    radius={c.radiusMeters}
                    pathOptions={{
                        color: "#6c63ff",
                        fillColor: "#6c63ff",
                        fillOpacity: 0.1,
                        weight: 2,
                        dashArray: "8 4",
                    }}
                />
            ))}
        </MapContainer>
    );
}
