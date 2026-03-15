"use client";


import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue with webpack/next
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Re-export MapMarker from the shared types file so existing imports
// from this module keep working (e.g. via dynamic import).
export type { MapMarker } from "@/lib/types";

// Import for local use in this file.
import type { MapMarker } from "@/lib/types";

interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  onClick?: (lat: number, lng: number) => void;
  polygon?: [number, number][];
  className?: string;
  style?: React.CSSProperties;
  flyTo?: [number, number] | null;
}

function ClickHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyToHandler({ flyTo }: { flyTo?: [number, number] | null }) {
  const map = useMap();
  if (flyTo) {
    map.flyTo(flyTo, 15, { duration: 1.5 });
  }
  return null;
}

export default function LeafletMap({
  center = [-28.2622, -52.4083],
  zoom = 13,
  markers = [],
  onClick,
  polygon,
  className = "",
  style,
  flyTo,
}: LeafletMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={className}
      style={{ height: "100%", width: "100%", ...style }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onClick={onClick} />
      <FlyToHandler flyTo={flyTo} />
      {markers.map((m) => (
        <Marker key={m.id} position={[m.lat, m.lng]}>
          {m.label && <Popup>{m.label}</Popup>}
        </Marker>
      ))}
      {polygon && polygon.length > 2 && (
        <Polygon
          positions={polygon}
          pathOptions={{ color: "#6fcf3e", fillColor: "#6fcf3e", fillOpacity: 0.2 }}
        />
      )}
    </MapContainer>
  );
}
