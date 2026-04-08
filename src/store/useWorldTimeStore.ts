import { create } from 'zustand'
import type { City } from '../data/cities'
import { CITIES } from '../data/cities'

const emptyBar = (): BarState => ({ city: null })

// Persist selected city IDs to localStorage
function saveBars(bars: BarState[]) {
  const ids = bars.map(b => b.city?.id ?? null)
  localStorage.setItem('worldtime-cities', JSON.stringify(ids))
}

function loadBars(): [BarState, BarState, BarState] {
  try {
    const stored = localStorage.getItem('worldtime-cities')
    if (!stored) return [emptyBar(), emptyBar(), emptyBar()]
    const ids = JSON.parse(stored) as (string | null)[]
    return ids.map(id => {
      if (!id) return emptyBar()
      const city = CITIES.find(c => c.id === id) ?? null
      return { city }
    }).slice(0, 3) as [BarState, BarState, BarState]
  } catch {
    return [emptyBar(), emptyBar(), emptyBar()]
  }
}

export type ActiveMode =
  | { type: 'none' }
  | { type: 'business'; barIndex: number }
  | { type: 'calendar'; barIndex: number; date: Date }

export interface BarState {
  city: City | null
}

export interface Toast {
  id: number
  message: string
}

interface WorldTimeStore {
  bars: [BarState, BarState, BarState]
  activeMode: ActiveMode
  now: Date
  toasts: Toast[]

  addCity: (city: City) => void
  removeBar: (index: number) => void
  moveBarUp: (index: number) => void
  setActiveMode: (mode: ActiveMode) => void
  tick: () => void
  dismissToast: (id: number) => void
}

let toastCounter = 0

function showToast(get: () => WorldTimeStore, set: (s: Partial<WorldTimeStore>) => void, message: string) {
  const id = ++toastCounter
  set({ toasts: [...get().toasts, { id, message }] })
  setTimeout(() => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) })
  }, 3000)
}

export const useWorldTimeStore = create<WorldTimeStore>((set, get) => ({
  bars: loadBars(),
  activeMode: { type: 'none' },
  now: new Date(),
  toasts: [],

  tick() {
    set({ now: new Date() })
  },

  dismissToast(id) {
    set({ toasts: get().toasts.filter((t) => t.id !== id) })
  },

  addCity(city: City) {
    const bars = [...get().bars] as [BarState, BarState, BarState]

    if (bars.every((b) => b.city !== null)) {
      showToast(get, set, 'All 3 slots are in use. Remove one to add another.')
      return
    }

    const emptyIndex = bars.findIndex((b) => b.city === null)
    bars[emptyIndex] = { city }
    set({ bars })
    saveBars(bars)
  },

  moveBarUp(index: number) {
    if (index <= 0) return
    const bars = [...get().bars] as [BarState, BarState, BarState]
    // Move to first position (swap with index 0)
    ;[bars[0], bars[index]] = [bars[index], bars[0]]
    set({ bars })
    saveBars(bars)
  },

  removeBar(index: number) {
    const bars = [...get().bars] as [BarState, BarState, BarState]
    bars[index] = emptyBar()

    const mode = get().activeMode
    let activeMode = get().activeMode
    if (
      (mode.type === 'business' || mode.type === 'calendar') &&
      mode.barIndex === index
    ) {
      activeMode = { type: 'none' }
    }

    set({ bars, activeMode })
    saveBars(bars)
  },

  setActiveMode(mode: ActiveMode) {
    set({ activeMode: mode })
  },
}))
