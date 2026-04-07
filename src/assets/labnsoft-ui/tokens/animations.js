/**
 * LabnSoft UI — Collapse/Expand Animation Utilities
 *
 * Height-based animations extracted from LabnDraw.
 * Duration is dynamically calculated: Math.max(80, height * 1.2) ms
 * Easing: linear
 *
 * Usage:
 *   import { animateCollapse, animateExpand } from 'labnsoft-ui/tokens/animations.js'
 *
 *   animateCollapse(el, () => { el.style.display = 'none' })
 *   animateExpand(el)
 */

/** Fixed collapse/expand duration (ms) */
export const LN_COLLAPSE_MS = 120

/**
 * Collapse an element by animating its height to 0.
 * @param {HTMLElement} el - Target element
 * @param {Function} [onDone] - Callback after animation completes
 */
export function animateCollapse(el, onDone) {
  const h = el.getBoundingClientRect().height
  el.style.overflow = 'hidden'
  el.style.transition = 'none'
  el.style.height = h + 'px'
  el.offsetHeight // force reflow
  el.style.transition = `height ${LN_COLLAPSE_MS}ms ease`
  el.style.height = '0px'
  el.addEventListener(
    'transitionend',
    () => {
      el.style.transition = ''
      onDone?.()
    },
    { once: true }
  )
}

/**
 * Expand an element by animating its height from 0 to full.
 * @param {HTMLElement} el - Target element (should be in the DOM but collapsed)
 * @param {Function} [onDone] - Callback after animation completes
 */
export function animateExpand(el, onDone) {
  el.style.overflow = 'hidden'
  el.style.transition = 'none'
  el.style.height = '0px'
  el.offsetHeight // force reflow
  const fullH = el.scrollHeight
  el.style.transition = `height ${LN_COLLAPSE_MS}ms ease`
  el.style.height = fullH + 'px'
  el.addEventListener(
    'transitionend',
    () => {
      el.style.height = ''
      el.style.transition = ''
      el.style.overflow = ''
      onDone?.()
    },
    { once: true }
  )
}
