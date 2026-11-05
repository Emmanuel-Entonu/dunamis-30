// Starts each animation again a little before it comes into view, so nobody sees it wake up.
const WAKE_MARGIN = '300px 0px'

type Styled = Element & ElementCSSInlineStyle

/**
 * Endless decorative animations (falling light, floating crests, the gloss on the cards) make the
 * browser do work on every frame, however far off the screen they are. When measured on a slow
 * phone that was the home page's biggest single cost, more than the photo ring. So each one pauses
 * while it's away. Any that this misses simply keeps running, as it would have anyway.
 * Returns a function that stops watching.
 */
export function pauseEndlessAnimationsOffscreen() {
  if (typeof IntersectionObserver === 'undefined' || typeof document.getAnimations !== 'function') return () => {}

  const movingIn = new WeakMap<Element, Set<Styled>>()
  const observer = new IntersectionObserver(
    (entries) => {
      for (const { target, isIntersecting } of entries) {
        movingIn.get(target)?.forEach((element) => {
          element.style.animationPlayState = isIntersecting ? '' : 'paused'
        })
      }
    },
    { rootMargin: WAKE_MARGIN },
  )

  const track = (animation: Animation) => {
    const effect = animation.effect as KeyframeEffect | null
    const target = effect?.target
    if (!target || effect.pseudoElement || effect.getComputedTiming().iterations !== Infinity) return
    // Parts that must stay in step look after their own resting.
    if (target.closest('[data-rests-together]')) return
    // Watch the parent, because a gloss band waiting off the edge of its card never counts as visible itself.
    const host = target.parentElement
    if (!host || !('style' in target)) return
    const siblings = movingIn.get(host)
    if (siblings) {
      siblings.add(target as Styled)
      return
    }
    movingIn.set(host, new Set([target as Styled]))
    observer.observe(host)
  }

  document.getAnimations().forEach(track)
  // Pages opened later, and anything added to this one, announce their animations as they start.
  const onStart = (event: AnimationEvent) => {
    if (event.target instanceof Element) event.target.getAnimations().forEach(track)
  }
  document.addEventListener('animationstart', onStart)

  return () => {
    document.removeEventListener('animationstart', onStart)
    observer.disconnect()
  }
}
