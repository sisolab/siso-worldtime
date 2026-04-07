import { create } from 'zustand'
import type { City } from '../data/cities'

export type ActiveMode =
  | { type: 'none' }
  | { type: 'business'; barIndex: number }
  | { type: 'calendar'; barIndex: number; date: Date }

export interface BarState {
  city: City | null
  fixed: boolean
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
  toggleFix: (index: number) => void
  setActiveMode: (mode: ActiveMode) => void
  tick: () => void
  dismissToast: (id: number) => void
}

const emptyBar = (): BarState => ({ city: null, fixed: false })

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

    // fixed bars occupy top positions; unfixed are below
    const fixedBars = bars.filter((b) => b.fixed)
    const unfixedBars = bars.filter((b) => !b.fixed)

    // All fixed → block
    if (unfixedBars.length === 0) {
      showToast(get, set, 'Fix된 바가 가득 찼습니다. 도시를 제거하거나 Fix를 해제하세요.')
      return
    }

    // Build new unfixed list: if there's an empty unfixed slot, add there;
    // otherwise drop the oldest unfixed (first in array) and append new city at end
    const hasEmpty = unfixedBars.some((b) => b.city === null)

    let newUnfixed: BarState[]
    if (hasEmpty) {
      newUnfixed = unfixedBars.map((b, i) => {
        if (b.city === null && !unfixedBars.slice(0, i).some((x) => x.city === null)) {
          // fill first empty slot
          return { city, fixed: false }
        }
        return b
      })
    } else {
      // Drop first unfixed, append new
      newUnfixed = [...unfixedBars.slice(1), { city, fixed: false }]
    }

    // Merge: fixed first, unfixed after
    const merged = [...fixedBars, ...newUnfixed] as [BarState, BarState, BarState]
    set({ bars: merged })
  },

  removeBar(index: number) {
    const bars = [...get().bars] as [BarState, BarState, BarState]
    bars[index] = emptyBar()

    // Also reset activeMode if this bar owned it
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

  toggleFix(index: number) {
    const bars = [...get().bars] as [BarState, BarState, BarState]
    const bar = bars[index]
    const wasFixed = bar.fixed

    if (wasFixed) {
      // Unfix: move to end (index 2)
      const newBar = { ...bar, fixed: false }
      const rest = bars.filter((_, i) => i !== index)
      const merged = [...rest, newBar] as [BarState, BarState, BarState]
      set({ bars: merged })
    } else {
      // Fix: move to last fixed position (right before unfixed bars)
      const newBar = { ...bar, fixed: true }
      const others = bars.filter((_, i) => i !== index)
      const fixedOthers = others.filter((b) => b.fixed)
      const unfixedOthers = others.filter((b) => !b.fixed)
      const merged = [...fixedOthers, newBar, ...unfixedOthers] as [BarState, BarState, BarState]
      set({ bars: merged })
    }
  },

  setActiveMode(mode: ActiveMode) {
    set({ activeMode: mode })
  },
}))
