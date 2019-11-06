# Scroll Spy

A library for subscribing to scroll events in the browser. Runs all your events in one requestAnimationFrame.

## Installation

```sh
$ npm install @earthpeople/scroll-spy
```

or

```sh
$ yarn add @earthpeople/scroll-spy
```

## Usage

```js
// some-component.js
import { startScrollSpy } from "@earthpeople/scroll-spy";

const subscribe = startScrollSpy();

let scrolledPast100 = false;

subscribe("scroll", event => {
  if (event.scrollTop > 100) {
    scrolledPast100 = true;
  }
});
```

`startScrollSpy` will only start the event loop if it's not already running, but it will always return the subscription function.

## Events

| Event                 | Returns                                | Fires                               |
| --------------------- | -------------------------------------- | ----------------------------------- |
| scroll                | `EventObject`                          | On document scroll                  |
| scrollY               | `scrollTop, scrollDelta`               | On vertical scroll                  |
| scrollX               | `scrollLeft, scrollXDelta`             | On horizontal scroll                |
| scrollEnd             | `EventObject`                          | When document stops scrolling       |
| scrollReachedEnd      | `atBottom, scrollTop, scrollDirection` | When scroll reaches end of document |
| scrollReachedTop      | `atTop, scrollTop, scrollDirection`    | When scroll reaches top             |
| scrollDirectionChange | `EventObject`                          | When scroll direction changes       |
| resize                | `EventObject`                          | On window resize                    |
| resizeEnd             | `EventObject`                          | When window stops resizing          |

## EventObject

| key             | type     | value                                                   |
| --------------- | -------- | ------------------------------------------------------- |
| scrollTop       | `number` | Pixels from top                                         |
| scrollLeft      | `number` | Pixels from left                                        |
| scrollDirection | `string` | `"up"` or `"down"`                                      |
| atTop           | `bool`   | true if scroll position is 0 or less\*                  |
| atBottom        | `bool`   | true if scroll position is full scroll height or more\* |
| scrollHeight    | `number` | Full scroll height of the document                      |
| scrollDelta     | `number` | Difference in scroll since last tick                    |
| scrollXDelta    | `number` | Difference in horizontal scroll since last tick         |
| vh              | `number` | Viewport height in pixels                               |
| vw              | `number` | Viewport width in pixels                                |
| orientation     | `string` | `"landscape"` or `"portrait"`                           |

_\* This is to prevent false answers in browsers with elastic scroll, like Safari_

## Subscribing

`startScrollSpy` returns a `subscribe` function when called. Use that to add your listeners.

```js
const subscribe = startScrollSpy();
```

You can also import the subscribe method directly.

```js
import { subscribe } from '@earthpeople/scroll-spy`
```

You can listen to multiple event types in the same listener, but be aware that some event types only returns a select collection of values.

```js
subscribe("scroll resize", ({ orientation }) => {
  console.log(orientation);
});
```

## Unsubscribing

The `subscribe` method returns a new function when called. Use that function to unsubscribe.

```js
const unsubscribe = subscribe("scrollReachedEnd", ({ scrollTop }) => {
  alert(`Wow! You scrolled ${scrollTop} pixels and reached the end`);

  // No need to listen to this event anymore
  unsubscribe();
});
```

You can also unsubscribe to all events or remove all listeners on a specific event

```js
import { startScrollSpy, unsubscribeAll } from '@earthpeople/scroll-spy'

// add a few listeners
...

// unsubscribe from just the resize events
unsubscribeAll('resize')

// unsubscribe from ALL events
unsubscribeAll()


```

## ES5

If you want to use a pre compiled es5-module, import from `@earthpeople/scroll-spy/es5` instead.
