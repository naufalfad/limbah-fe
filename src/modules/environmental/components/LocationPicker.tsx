// src/modules/environmental/components/LocationPicker.tsx
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Map size invalidator helper
function ResizeMap() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export const LocationPicker = ({ onLocationSelected, lat, lng }: any) => {
  function LocationMarker() {
    useMapEvents({
      click(e) {
        onLocationSelected(e.latlng.lat, e.latlng.lng);
      },
    });
    return lat && lng ? <Marker position={[lat, lng]} /> : null;
  }

  return (
    <MapContainer center={[-6.200000, 106.816666]} zoom={13} className="h-64 w-full rounded-md">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <LocationMarker />
      <ResizeMap />
    </MapContainer>
  );
};