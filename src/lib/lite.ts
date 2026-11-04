/**
 * Slow phones get a lighter site: the same pages and words, with the costliest effects switched off.
 * It turns on before the first paint for devices that are clearly low-end or saving data, and during
 * a visit if the page is visibly struggling. `?lite=1` forces it on and `?lite=0` opts out, for good.
 */
const CHOICE = 'dunamis-lite'
const THIS_VISIT = 'dunamis-lite-visit'
const CHANGED = 'dunamis-lite-change'

/**
 * Runs in the head, before anything paints, so a slow phone never starts drawing the heavy version.
 * iPhones and Macs are left out of the core count, because Safari doesn't report the real number. If
 * an old iPhone struggles, the watch below catches it. Budget Androids often have eight slow cores,
 * so memory says more about them than cores do.
 */
export const liteScript = `(function(){try{var n=navigator,c=n.connection||{},w=location.search.match(/[?&]lite=([01])/),s=null,v=null;try{if(w)localStorage.setItem('${CHOICE}',w[1]);s=localStorage.getItem('${CHOICE}');v=sessionStorage.getItem('${THIS_VISIT}')}catch(e){}if(w)s=w[1];if(s==='0')return;var a=/iPhone|iPad|Macintosh/.test(n.userAgent),t=matchMedia('(pointer: coarse)').matches,p=n.hardwareConcurrency||8;if(s==='1'||v==='1'||c.saveData||/2g|3g/.test(c.effectiveType||'')||n.deviceMemory<4||(!a&&p<=(t?4:2)))document.documentElement.dataset.lite='1'}catch(e){}})()`

export const isLite = () => typeof document !== 'undefined' && document.documentElement.dataset.lite === '1'

function enableLite() {
  document.documentElement.dataset.lite = '1'
  try {
    sessionStorage.setItem(THIS_VISIT, '1')
  } catch {
    // Private browsing. It simply checks again on the next visit.
  }
  window.dispatchEvent(new Event(CHANGED))
}

export function onLiteChange(listener: () => void) {
  window.addEventListener(CHANGED, listener)
  return () => window.removeEventListener(CHANGED, listener)
}

/** Builds a scroll scene for how the page is now, and rebuilds it if the page turns lite later on. */
export function rebuildOnLite(build: (lite: boolean) => () => void) {
  let undo = build(isLite())
  const stop = onLiteChange(() => {
    undo()
    undo = build(true)
  })
  return () => {
    stop()
    undo()
  }
}

// Two windows of 45 frames in a row, with over 40% of frames too slow for 28 frames a second. That's
// about three seconds of real struggling, so one busy moment doesn't change anything. 36ms also
// leaves phones alone in low-power mode, which hold a steady 30.
const SLOW_FRAME_MS = 36
const WINDOW_FRAMES = 45
const SLOW_SHARE = 0.4
const STRIKES = 2
const STALL_MS = 500

let optedOut: boolean | null = null
let activeUntil = 0
let running = false
let lastFrame = 0
let seen = 0
let slow = 0
let strikes = 0

function tick(now: number) {
  if (now > activeUntil) {
    running = false
    lastFrame = 0
    return
  }
  const gap = lastFrame ? now - lastFrame : 0
  lastFrame = now
  // A very long gap is a background tab or a one-off stall, not a slow phone.
  if (gap && gap < STALL_MS) {
    seen++
    if (gap > SLOW_FRAME_MS) slow++
    if (seen >= WINDOW_FRAMES) {
      strikes = slow / seen > SLOW_SHARE ? strikes + 1 : 0
      seen = 0
      slow = 0
      if (strikes >= STRIKES) {
        running = false
        enableLite()
        return
      }
    }
  }
  requestAnimationFrame(tick)
}

/** Times frames for a moment, so only moments with something moving on screen count. */
export function keepWatching() {
  if (isLite()) return
  if (optedOut === null) {
    try {
      optedOut = localStorage.getItem(CHOICE) === '0'
    } catch {
      optedOut = false
    }
  }
  if (optedOut) return
  activeUntil = performance.now() + 250
  if (!running) {
    running = true
    requestAnimationFrame(tick)
  }
}
