/**
 * Shared application types.
 *
 * MapMarker is defined here instead of in leaflet-map.tsx so that pages can
 * reference the type without importing the Leaflet component module (which
 * would pull in the heavy Leaflet library even on server-side or before the
 * dynamic import kicks in).
 */

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
}
