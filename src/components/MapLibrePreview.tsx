import Map from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import './MapPreview.css'

// OpenFreeMap — free, no API key required
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

export default function MapLibrePreview() {
  return (
    <div className="map-preview-wrap">
      <div className="map-preview-label">② MapLibre GL + OpenFreeMap</div>
      <Map
        initialViewState={{ longitude: 0, latitude: 20, zoom: 1.2 }}
        mapStyle={STYLE_URL}
        scrollZoom={false}
        dragPan={false}
        dragRotate={false}
        keyboard={false}
        doubleClickZoom={false}
        touchZoomRotate={false}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      />
    </div>
  )
}
