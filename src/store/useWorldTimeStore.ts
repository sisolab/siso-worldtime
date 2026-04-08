import { create } from 'zustand'
import type { City } from '../data/cities'

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
  setActiveMode: (mode: ActiveMode) => void
  tick: () => void
  dismissToast: (id: number) => void
}

const emptyBar = (): BarState => ({ city: null })

let toastCounter = 0

function showToast(get: () => WorldTimeStore, set: (s: Partial<WorldTimeStore>) => void, message: string) {
  const id = ++toastCounter
  set({ toasts: [...get().toasts, { id, message }] })
  setTimeout(() => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) })
  }, 3000)
}

export const useWorldTimeStore = create<WorldTimeStore>((set, get) => ({
  bars: [emptyBar(), emptyBar(), emptyBar()],
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
  },

  setActiveMode(mode: ActiveMode) {
    set({ activeMode: mode })
  },
}))
