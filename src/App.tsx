import { useEffect } from 'react'
import WorldMap from './components/WorldMap'
import { useWorldTimeStore } from './store/useWorldTimeStore'
import './App.css'

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
