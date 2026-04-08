import { useEffect, Suspense, lazy } from 'react'
import WorldMap from './components/WorldMap'
import TimeBar from './components/TimeBar'
import { useWorldTimeStore } from './store/useWorldTimeStore'
import './App.css'

const LeafletPreview = lazy(() => import('./components/LeafletPreview'))
const MapLibrePreview = lazy(() => import('./components/MapLibrePreview'))

export default function App() {
  const { tick, toasts, dismissToast } = useWorldTimeStore()

  useEffect(() => {
    const interval = setInterval(tick, 60 * 1000)
    return () => clearInterval(interval)
  }, [tick])

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          WORLD TIME <span className="app-title-by">by</span> SISOLAB
        </h1>
      </header>

      <main className="app-main">
        <section className="app-map-section">
          <WorldMap />
        </section>

        <section className="app-bars-section">
          <TimeBar index={0} />
          <TimeBar index={1} />
          <TimeBar index={2} />
        </section>

        <section className="app-map-previews">
          <p className="app-map-previews-title">지도 라이브러리 비교</p>
          <div className="app-map-previews-grid">
            <Suspense fallback={<div className="map-preview-placeholder" />}>
              <LeafletPreview />
            </Suspense>
            <Suspense fallback={<div className="map-preview-placeholder" />}>
              <MapLibrePreview />
            </Suspense>
          </div>
        </section>
      </main>

      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast ln-frosted" onClick={() => dismissToast(toast.id)}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  )
}
