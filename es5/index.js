"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.unsubscribeAll = exports.startScrollSpy = exports.subscribe = exports.scrollingElement = void 0;

var _events = _interopRequireDefault(require("./events"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _window = window,
    raf = _window.requestAnimationFrame;
var scrolling = false;
var resizing = false;
var isRunning = false;
var scrollTimeout, resizeTimeout;
var vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
var vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
var scrollingElement = getScrollingElement();
exports.scrollingElement = scrollingElement;

function getScrollingElement() {
  var d = document;

  if ('scrollingElement' in d) {
    return d.scrollingElement;
  }

  return d.documentElement.scrollHeight > d.body.scrollHeight && d.compatMode.indexOf('CSS1') == 0 ? d.documentElement : d.body;
}

var state = {
  scrollTop: 0,
  orientation: vw > vh ? 'landscape' : 'portrait',
  scrollDirection: null,
  scrollLeft: 0,
  scrollHeight: scrollingElement.scrollHeight,
  vw: vw,
  vh: vh,
  atTop: true,
  atBottom: true,
  scrollDelta: 0
};

var getScrollDirection = function getScrollDirection(scrollTop, oldScrollTop, direction) {
  var diff = oldScrollTop - scrollTop;

  if (diff === 0) {
    return direction;
  }

  return diff < 0 ? 'down' : 'up';
};

var deferredScrollDirectionChange = false;

var scrollDirectionDidChange = function scrollDirectionDidChange(scrollDirection, oldScrollDirection, scrollTop, scrollHeight) {
  // prevent scrollChange on bounce on top
  if (scrollTop <= 0) {
    deferredScrollDirectionChange = true;
    return false;
  } else if (scrollTop >= scrollHeight) {
    deferredScrollDirectionChange = true;
    return false;
  } else if (deferredScrollDirectionChange) {
    deferredScrollDirectionChange = false;
    return true;
  }

  return scrollDirection === oldScrollDirection;
};

var run = function run() {
  isRunning = true;

  if (scrolling) {
    var oldScrollTop = state.scrollTop;
    var oldScrollLeft = state.scrollLeft;
    var scrollTop = scrollingElement.scrollTop;
    var scrollLeft = scrollingElement.scrollLeft;
    var scrollDirection = getScrollDirection(scrollTop, oldScrollTop, state.scrollDirection);
    var scrollHeight = scrollingElement.scrollHeight;
    var scrollDelta = scrollTop - oldScrollTop;
    var scrollXDelta = scrollLeft - oldScrollLeft;
    var atTop = scrollTop <= 0;
    var atBottom = scrollTop >= scrollHeight - state.vh;
    var scrollDirectionChange = scrollDirectionDidChange(scrollDirection, state.scrollDirection, scrollTop, scrollHeight - state.vh);

    if (atBottom && !state.atBottom) {
      scrollDirection = 'down';

      _events["default"]['scrollReachedEnd'].forEach(function (fn) {
        fn({
          atBottom: atBottom,
          scrollTop: scrollTop,
          scrollDirection: scrollDirection
        });
      });
    }

    if (atTop && !state.atTop) {
      scrollDirection = 'up';

      _events["default"]['scrollReachedTop'].forEach(function (fn) {
        fn({
          atTop: atTop,
          scrollTop: scrollTop,
          scrollDirection: scrollDirection
        });
      });
    }

    state = _objectSpread({}, state, {
      scrollTop: scrollTop,
      scrollLeft: scrollLeft,
      scrollDirection: scrollDirection,
      atTop: atTop,
      atBottom: atBottom,
      scrollHeight: scrollHeight,
      scrollDelta: scrollDelta,
      scrollXDelta: scrollXDelta
    });

    _events["default"]['scroll'].forEach(function (fn) {
      fn(_objectSpread({}, state));
    });

    if (scrollDirectionChange) {
      _events["default"]['scrollDirectionChange'].forEach(function (fn) {
        fn(_objectSpread({}, state));
      });
    }

    scrollTimeout = setTimeout(function () {
      _events["default"]['scrollEnd'].forEach(function (fn) {
        fn(_objectSpread({}, state));
      });
    }, 30);

    if (scrollDelta) {
      _events["default"]['scrollY'].forEach(function (fn) {
        fn({
          scrollTop: scrollTop,
          scrollDelta: scrollDelta
        });
      });
    }

    if (scrollXDelta) {
      _events["default"]['scrollX'].forEach(function (fn) {
        fn({
          scrollLeft: scrollLeft,
          scrollXDelta: scrollXDelta
        });
      });
    }
  }

  if (resizing) {
    var _vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

    var _vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    state = _objectSpread({}, state, {
      scrollHeight: scrollingElement.scrollHeight,
      vw: _vw,
      vh: _vh,
      orientation: _vw > _vh ? 'landscape' : 'portrait'
    });
    resizeTimeout = setTimeout(function () {
      _events["default"]['resizeEnd'].forEach(function (fn) {
        fn(_objectSpread({}, state));
      });
    }, 30);

    _events["default"]['resize'].forEach(function (fn) {
      fn(_objectSpread({}, state));
    });
  }

  scrolling = false;
  resizing = false;
  raf(run);
};

window.scrollSpyCheckEventBus = function (event) {
  if (event) {
    return [_events["default"][event].length, _events["default"][event]];
  } else {
    return [Object.values(_events["default"]).map(function (arr) {
      return arr.length;
    }).reduce(function (a, l) {
      return a + l;
    }, 0), _events["default"]];
  }
};
/**
 *
 * @param {string} eventName events to listen to separated by space. Any from eventBus works
 * @param {function} callback function to be run each event
 *
 * returns a unsubscribe function
 */


var subscribe = function subscribe(eventName, callback) {
  var eventNames = eventName.split(' ');
  eventNames.forEach(function (event) {
    _events["default"][event].push(callback);
  });
  return function () {
    // return a function to call to unsubscribe to event
    eventNames.forEach(function (event) {
      var i = _events["default"][event].indexOf(callback);

      if (i !== -1) {
        _events["default"][event].splice(i, 1);
      }
    });
  };
};
/**
 * Start the spy, use the returned subscribe-function to subscribe to events
 * It will only start if not already started.
 */


exports.subscribe = subscribe;

var startScrollSpy = function startScrollSpy() {
  if (!isRunning) {
    window.addEventListener('scroll', function () {
      scrolling = true;
      clearTimeout(scrollTimeout);
    });
    window.addEventListener('resize', function () {
      resizing = true;
      clearTimeout(resizeTimeout);
    });
    raf(run);
  }

  return subscribe;
};
/**
 * Unsubscribe everything or everything on a specific event
 * @param {string} eventName event to remove all listeners from
 */


exports.startScrollSpy = startScrollSpy;

var unsubscribeAll = function unsubscribeAll(eventName) {
  if (!eventName) {
    for (var event in _events["default"]) {
      _events["default"][event] = [];
    }
  }

  if (_events["default"][eventName]) {
    _events["default"][eventName] = [];
  }
};

exports.unsubscribeAll = unsubscribeAll;