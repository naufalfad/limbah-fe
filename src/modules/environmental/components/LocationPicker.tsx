// src/modules/environmental/components/LocationPicker.tsx
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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
    </MapContainer>
  );
};