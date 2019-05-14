import eventBus from './events'

const { requestAnimationFrame: raf } = window
let scrolling = false
let resizing = false
let isRunning = false
let scrollTimeout, resizeTimeout
const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)

let state = {
  scrollTop: 0,
  orientation: vw > vh ? 'landscape' : 'portrait',
  scrollDirection: null,
  scrollLeft: 0,
  scrollHeight: document.scrollingElement.scrollHeight,
  vw,
  vh,
  atTop: true,
  atBottom: true,
  scrollDelta: 0
}

const getScrollDirection = (scrollTop, oldScrollTop, direction) => {
  const diff = oldScrollTop - scrollTop
  if (diff === 0) {
    return direction
  }
  return diff < 0 ? 'down' : 'up'
}

let deferredScrollDirectionChange = false
const scrollDirectionDidchange = (scrollDirection, oldScrollDirection, scrollTop, scrollHeight) => {
  // prevent scrollChange on bounce on top
  if (scrollTop <= 0) {
    deferredScrollDirectionChange = true
    return false
  } else if (scrollTop >= scrollHeight) {
    deferredScrollDirectionChange = true
    return false
  } else if (deferredScrollDirectionChange) {
    deferredScrollDirectionChange = false
    return true
  }
  return scrollDirection === oldScrollDirection
}

const run = () => {
  isRunning = true
  if (scrolling) {
    const oldScrollTop = state.scrollTop
    const oldScrollLeft = state.scrollLeft
    const scrollTop = document.scrollingElement.scrollTop
    const scrollLeft = document.scrollingElement.scrollLeft
    let scrollDirection = getScrollDirection(scrollTop, oldScrollTop, state.scrollDirection)
    const scrollHeight = document.scrollingElement.scrollHeight
    const scrollDelta = scrollTop - oldScrollTop
    const scrollXDelta = scrollLeft - oldScrollLeft
    const atTop = scrollTop <= 0
    const atBottom = scrollTop >= scrollHeight - state.vh
    const scrollDirectionChange = scrollDirectionDidchange(scrollDirection, state.scrollDirection, scrollTop, scrollHeight - state.vh)

    if (atBottom && !state.atBottom) {
      scrollDirection = 'down'
      eventBus['scrollReachedEnd'].forEach(fn => {
        fn({
          atBottom,
          scrollTop,
          scrollDirection
        })
      })
    }

    if (atTop && !state.atTop) {
      scrollDirection = 'up'

      eventBus['scrollReachedTop'].forEach(fn => {
        fn({
          atTop,
          scrollTop,
          scrollDirection
        })
      })
    }
    state = {
      ...state,
      scrollTop,
      scrollLeft,
      scrollDirection,
      atTop,
      atBottom,
      scrollHeight,
      scrollDelta,
      scrollXDelta
    }
    eventBus['scroll'].forEach(fn => {
      fn({
        ...state
      })
    })
    if (scrollDirectionChange) {
      eventBus['scrollDirectionChange'].forEach(fn => {
        fn({
          ...state
        })
      })
    }
    scrollTimeout = setTimeout(() => {
      eventBus['scrollEnd'].forEach(fn => {
        fn({
          ...state
        })
      })
    }, 30)
    if (scrollDelta) {
      eventBus['scrollY'].forEach(fn => {
        fn({
          scrollTop,
          scrollDelta
        })
      })
    }
    if (scrollXDelta) {
      eventBus['scrollX'].forEach(fn => {
        fn({
          scrollLeft,
          scrollXDelta
        })
      })
    }
  }

  if (resizing) {
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
    state = {
      ...state,
      scrollHeight: document.scrollingElement.scrollHeight,
      vw,
      vh,
      orientation: vw > vh ? 'landscape' : 'portrait'
    }

    resizeTimeout = setTimeout(() => {
      eventBus['resizeEnd'].forEach(fn => {
        fn({
          ...state
        })
      })
    }, 30)

    eventBus['resize'].forEach(fn => {
      fn({
        ...state
      })
    })
  }

  scrolling = false
  resizing = false

  raf(run)
}

window.scrollSpycheckEventBus = (event) => {
  if (event) {
    return [eventBus[event].length, eventBus[event]]
  } else {
    return [
      Object.values(eventBus).map(arr => arr.length).reduce((a, l) => a + l, 0),
      eventBus
    ]
  }
}
/**
 *
 * @param {string} eventName events to listen to separated by space. Any from eventBus works
 * @param {function} callback function to be run each event
 *
 * returns a unsubscribe function
 */
export const subscribe = (eventName, callback) => {
  const eventNames = eventName.split(' ')
  eventNames.forEach(event => {
    eventBus[event].push(callback)
  })
  return () => {
    // return a function to call to unsubscribe to event
    eventNames.forEach(event => {
      const i = eventBus[event].indexOf(callback)
      eventBus[event].splice(i, 1)
    })
  }
}
/**
 * Start the spy, use the returned subscribe-function to subscrbe to events
 * It will only start if not already started.
 */
export const startScrollSpy = () => {
  if (!isRunning) {
    window.addEventListener('scroll', () => {
      scrolling = true
      clearTimeout(scrollTimeout)
    })

    window.addEventListener('resize', () => {
      resizing = true
      clearTimeout(resizeTimeout)
    })
    raf(run)
  }
  return subscribe
}

/**
 * Unsubscribe everything or everything on a specific event
 * @param {string} eventName event to remove all listeners from
 */
export const unsubscribeAll = (eventName) => {
  if (!eventName) {
    for (var event in eventBus) {
      eventBus[event] = []
    }
  }
  if (eventBus[eventName]) {
    eventBus[eventName] = []
  }
}
