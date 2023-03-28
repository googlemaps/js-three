# Google Maps ThreeJS Overlay View and Utilities

[![npm](https://img.shields.io/npm/v/@googlemaps/three)](https://www.npmjs.com/package/@googlemaps/three)
![Build](https://github.com/googlemaps/js-three/workflows/Test/badge.svg)
![Release](https://github.com/googlemaps/js-three/workflows/Release/badge.svg)
[![codecov](https://codecov.io/gh/googlemaps/js-three/branch/main/graph/badge.svg)](https://codecov.io/gh/googlemaps/js-three)
![GitHub contributors](https://img.shields.io/github/contributors/googlemaps/js-three?color=green)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![](https://github.com/jpoehnelt/in-solidarity-bot/raw/main/static//badge-flat.png)](https://github.com/apps/in-solidarity)
[![Discord](https://img.shields.io/discord/676948200904589322?color=6A7EC2&logo=discord&logoColor=ffffff)](https://discord.gg/jRteCzP)

## Description

Add [three.js](https://threejs.org) objects to Google Maps Platform JS. The
library provides a `ThreeJSOverlayView` class extending `google.maps.WebGLOverlayView`
and utility functions for converting geo-coordinates (latitude/longitude) to
vectors in the coordinate system used by three.js.

## Install

Available via npm as the package [@googlemaps/three](https://www.npmjs.com/package/@googlemaps/three).

```
npm i @googlemaps/three
```

Alternatively you can load the package directly to the html document using
unpkg or other CDNs. In this case, make sure to load three.js before loading
this library:

```
<script src="https://unpkg.com/three/build/three.min.js"></script>
<script src="https://unpkg.com/@googlemaps/three/dist/index.min.js"></script>
```

When adding via unpkg, the package can be accessed as
`google.maps.plugins.three`. A version can be specified by using
`https://unpkg.com/@googlemaps/three@VERSION/dist/...`.

The third option to use it is via ES-Module imports, similar to how the
three.js examples work. For this, you first need to specify an
[importmap](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap)
(example using unpkg.com, but it works the same way with any other CDN
or self-hosted files):

```html
<script type="importmap">
  {
    "imports": {
      "three": "https://unpkg.com/three/build/three.module.js",
      "@googlemaps/three": "https://unpkg.com/@googlemaps/three/dist/index.esm.js"
    }
  }
</script>
```

In order to support browsers that don't yet implement importmap, you can
use the [es-module-shims package](https://github.com/guybedford/es-module-shims).

After that, you can use three.js and the ThreeJSOverlayView like you would when
using a bundler.

```html
<script type="module">
  import * as THREE from "three";
  import { ThreeJSOverlayView } from "@googlemaps/three";

  // ...
</script>
```

## Documentation

Checkout the reference [documentation](https://googlemaps.github.io/js-three/index.html).

### Coordinates, Projection and Anchor-Points

The coordinate system within the three.js scene (so-called 'world
coordinates') is a right-handed coordinate system in z-up orientation.
The y-axis is pointing true north, and the x-axis is pointing east. The
units are meters. So the point `new Vector3(0, 50, 10)` is 10 meters
above ground and 50 meters east of the specified anchor point.

This anchor-point and orientation can be set in the constructor, or by using the
`setAnchor()` and `setUpAxis()`-methods (be aware that all object-positions in
your scene depend on the anchor-point and orientation, so they have to be
recomputed when either of them is changed):

```typescript
import { ThreeJSOverlayView } from "@googlemaps/three";

const overlay = new ThreeJSOverlayView({
  anchor: { lat: 37.7793, lng: -122.4192, altitude: 0 },
  upAxis: "Y",
});

overlay.setAnchor({ lat: 35.680432, lng: 139.769013, altitude: 0 });
overlay.setUpAxis("Z");
// can also be specified as Vector3:
overlay.setUpAxis(new Vector3(0, 0, 1));
```

> The default up-axis used in this library is the z-axis (+x is east
> and +y is north), which is different from the y-up orientation normally
> used in three.

All computations on the GPU related to the position use float32 numbers,
which limits the possible precision to about 7 decimal digits. Because
of this, we cannot use a global reference system and still have the
precision to show details in the meters to centimeters range.

This is where the anchor point is important. The anchor specifies the
geo-coordinates (lat/lng/altitude) where the origin of the world-space
coordinate system is, and you should always define it close to where the
objects are placed in the scene - unless of course you are only working with
large-scale (city-sized) objects distributed globally.

Another reason why setting the anchor close to the objects in the scene
is generally a good idea: In the mercator map-projection used in Google Maps,
the scaling of meters is only accurate in regions close to the equator. This
can be compensated for by applying a scale factor that depends on the
latitude of the anchor. This scale factor is factored into the coordinate
calculations in WebGlOverlayView based on the latitude of the anchor.

#### Converting coordinates

When you need more than just a single georeferenced object in your scene,
you need to compute the world-space position for those coordinates. The
ThreeJSOverlayView class provides a helper function for this conversion that
takes the current `anchor` and `upAxis` into account:

```typescript
const coordinates = { lat: 12.34, lng: 56.78 };
const position: Vector3 = overlay.latLngAltitudeToVector3(coordinates);

// alternative: pass the Vector3 to write the position
// to as the second parameter, so to set the position of a mesh:
overlay.latLngAltitudeToVector3(coordinates, mesh.position);
```

### Raycasting and Interactions

If you want to add interactivity to any three.js content, you typically
have to implement raycasting. We took care of that for you, and the
ThreeJSOverlayView provides a method `overlay.raycast()` for this. To make
use of it, you first have to keep track of mouse movements on the map:

```js
import { Vector2 } from "three";

// ...

const mapDiv = map.getDiv();
const mousePosition = new Vector2();

map.addListener("mousemove", (ev) => {
  const { domEvent } = ev;
  const { left, top, width, height } = mapDiv.getBoundingClientRect();

  const x = domEvent.clientX - left;
  const y = domEvent.clientY - top;

  mousePosition.x = 2 * (x / width) - 1;
  mousePosition.y = 1 - 2 * (y / height);

  // since the actual raycasting is performed when the next frame is
  // rendered, we have to make sure that it will be called for the next frame.
  overlay.requestRedraw();
});
```

With the mouse position being always up to date, you can then use the
`raycast()` function in the `onBeforeDraw` callback.
In this example, we change the color of the object under the cursor:

```js
const DEFAULT_COLOR = 0xffffff;
const HIGHLIGHT_COLOR = 0xff0000;

let highlightedObject = null;

overlay.onBeforeDraw = () => {
  const intersections = overlay.raycast(mousePosition);
  if (highlightedObject) {
    highlightedObject.material.color.setHex(DEFAULT_COLOR);
  }

  if (intersections.length === 0) return;

  highlightedObject = intersections[0].object;
  highlightedObject.material.color.setHex(HIGHLIGHT_COLOR);
};
```

The full examples can be found in [`./examples/raycasting.ts`](./examples/raycasting.ts).

## Example

The following example provides a skeleton for adding objects to the map with this library.

```js
import * as THREE from "three";
import { ThreeJSOverlayView, latLngToVector3 } from "@googlemaps/three";

// when loading via UMD, remove the imports and use this instead:
// const { ThreeJSOverlayView, latLngToVector3 } = google.maps.plugins.three;

const map = new google.maps.Map(document.getElementById("map"), mapOptions);
const overlay = new ThreeJSOverlayView({
  map,
  upAxis: "Y",
  anchor: mapOptions.center,
});

// create a box mesh
const box = new THREE.Mesh(
  new THREE.BoxGeometry(10, 50, 10),
  new THREE.MeshMatcapMaterial()
);
// move the box up so the origin of the box is at the bottom
box.geometry.translateY(25);

// set position at center of map
box.position.copy(overlay.latLngAltitudeToVector3(mapOptions.center));

// add box mesh to the scene
overlay.scene.add(box);

// rotate the box using requestAnimationFrame
const animate = () => {
  box.rotateY(THREE.MathUtils.degToRad(0.1));

  requestAnimationFrame(animate);
};

// start animation loop
requestAnimationFrame(animate);
```

This adds a box to the map.

<img src="https://storage.googleapis.com/geo-devrel-public-buckets/box.png" alt="threejs box on map" width="400"/>

## Demos

View the package in action:

- [Basic Example](https://googlemaps.github.io/js-three/public/basic/)
- [Anchor Example](https://googlemaps.github.io/js-three/public/anchor/)
- [Orientation Example](https://googlemaps.github.io/js-three/public/orientation/)
