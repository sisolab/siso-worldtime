import { LABEL_GAP, DOT_SIZE } from '../constants/map'

type Box = [left: number, top: number, right: number, bottom: number]

interface ProjectedCity {
  id: string
  x: number
  y: number
  w: number
  h: number
}

function labelBox(p: ProjectedCity, isAbove: boolean): Box {
  const top = isAbove ? p.y - LABEL_GAP - p.h : p.y + LABEL_GAP
  return [p.x - p.w / 2, top, p.x + p.w / 2, top + p.h]
}

function boxesOverlap(a: Box, b: Box): boolean {
  return a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]
}

function hitsDot(box: Box, dotX: number, dotY: number): boolean {
  const r = DOT_SIZE / 2
  return box[0] < dotX + r && box[2] > dotX - r &&
         box[1] < dotY + r && box[3] > dotY - r
}

/**
 * Determine which city labels should be placed above their dot
 * to avoid overlaps with other labels and dots.
 *
 * Measures actual DOM label sizes, then iteratively flips labels
 * above until no overlaps remain.
 */
export function computeAboveCities(
  cities: { id: string; nameEn: string; lng: number; lat: number }[],
  project: (lng: number, lat: number) => { x: number; y: number },
): Set<string> {
  // Measure actual label sizes from DOM
  const labelEls = document.querySelectorAll('.city-ml-label')
  const sizes: Record<string, { w: number; h: number }> = {}
  labelEls.forEach(el => {
    const name = el.querySelector('.city-ml-name')?.textContent ?? ''
    const rect = el.getBoundingClientRect()
    sizes[name] = { w: rect.width, h: rect.height }
  })

  const projected: ProjectedCity[] = cities.map(c => {
    const p = project(c.lng, c.lat)
    const sz = sizes[c.nameEn] ?? { w: 62, h: 48 }
    return { id: c.id, x: p.x, y: p.y, w: sz.w, h: sz.h }
  })

  const above = new Set<string>()

  // Iterative: keep resolving overlaps until stable
  for (let pass = 0; pass < 10; pass++) {
    let changed = false
    for (let i = 0; i < projected.length; i++) {
      for (let j = i + 1; j < projected.length; j++) {
        const boxA = labelBox(projected[i], above.has(projected[i].id))
        const boxB = labelBox(projected[j], above.has(projected[j].id))
        const overlap = boxesOverlap(boxA, boxB)
        const aHitsJ = hitsDot(labelBox(projected[i], above.has(projected[i].id)), projected[j].x, projected[j].y)
        const bHitsI = hitsDot(labelBox(projected[j], above.has(projected[j].id)), projected[i].x, projected[i].y)

        if (overlap || aHitsJ || bHitsI) {
          if (!above.has(projected[j].id)) {
            const bAbove = labelBox(projected[j], true)
            if (!projected.some(p => p.id !== projected[j].id && hitsDot(bAbove, p.x, p.y))) {
              above.add(projected[j].id); changed = true; continue
            }
          }
          if (!above.has(projected[i].id)) {
            const aAbove = labelBox(projected[i], true)
            if (!projected.some(p => p.id !== projected[i].id && hitsDot(aAbove, p.x, p.y))) {
              above.add(projected[i].id); changed = true; continue
            }
          }
        }
      }
    }
    if (!changed) break
  }

  return above
}
