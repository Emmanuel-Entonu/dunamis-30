export const INTRO_SEEN_KEY = 'dunamis-intro-seen'
export const INTRO_REVEAL_EVENT = 'dunamis-intro-reveal'

/**
 * Runs `start` as the home page's intro screen lifts, or straight away if it isn't showing.
 * Returns a function that cancels the wait.
 */
export function afterIntro(start: () => void) {
  const intro = document.getElementById('intro')
  if (!intro || intro.style.display === 'none') {
    start()
    return () => {}
  }
  window.addEventListener(INTRO_REVEAL_EVENT, start, { once: true })
  return () => window.removeEventListener(INTRO_REVEAL_EVENT, start)
}
