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

interface LocationPickerProps {
  onLocationSelected: (lat: number, lng: number) => void;
  lat: number | null;
  lng: number | null;
}

export const LocationPicker = ({ onLocationSelected, lat, lng }: LocationPickerProps) => {
  function LocationMarker() {
    useMapEvents({
      click(e) {
        onLocationSelected(e.latlng.lat, e.latlng.lng);
      },
    });
    return lat && lng ? <Marker position={[lat, lng]} /> : null;
  }

  return (
    // FASE 2: Sinkronisasi Default Center diarahkan ke Sampit, Kabupaten Kotawaringin Timur secara global [3]
    <MapContainer center={[-6.4816, 106.8560]} zoom={11} className="h-64 w-full rounded-md">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <LocationMarker />
      <ResizeMap />
    </MapContainer>
  );
};