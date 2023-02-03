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

Add [three.js](https://threejs.org) objects to Google Maps Platform JS. The library provides a `ThreeJSOverlayView` class extending `google.maps.WebGLOverlayView` and utility functions such as `latLngToMeters`, `latLngToVector3`, and `latLngToVector3Relative`, for converting latitude and longitude to vectors in the mercator coordinate space.

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

Checkout the the reference [documentation](https://googlemaps.github.io/js-three/index.html).

> Note: All methods and objects in this library follow a default up axis of (0, 1, 0), y up, matching that of three.js.

<img src="https://storage.googleapis.com/geo-devrel-public-buckets/orientation.jpg" alt="orientation of axes" width="400"/>

> Note: You must pass a reference to THREE in the constructor of the `ThreeJSOverlayView` class. It may be beneficial to pass a subset of THREE to better enable tree shaking.

## Example

The following example provides a skeleton for adding objects to the map with this library.

```js
import * as THREE from "three";

const map = new google.maps.Map(document.getElementById("map"), mapOptions);
// instantiate a ThreeJS Scene
const scene = new THREE.Scene();

// Create a box mesh
const box = new THREE.Mesh(
  new THREE.BoxGeometry(10, 50, 10),
  new THREE.MeshNormalMaterial()
);

// set position at center of map
box.position.copy(latLngToVector3(mapOptions.center));
// set position vertically
box.position.setY(25);

// add box mesh to the scene
scene.add(box);

// instantiate the ThreeJS Overlay with the scene and map
new ThreeJSOverlayView({
  scene,
  map,
});

// rotate the box using requestAnimationFrame
const animate = () => {
  box.rotateY(MathUtils.degToRad(0.1));

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
