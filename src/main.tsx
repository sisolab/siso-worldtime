import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/labnsoft-ui/tokens/index.css'
import './assets/labnsoft-ui/components/index.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
