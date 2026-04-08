import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './MapPreview.css'

export default function LeafletPreview() {
  return (
    <div className="map-preview-wrap">
      <div className="map-preview-label">① Leaflet + OpenStreetMap</div>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
        className="map-preview-map"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      </MapContainer>
    </div>
  )
}
