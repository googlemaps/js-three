/**
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { BoxBufferGeometry, Mesh, MeshNormalMaterial, Scene } from "three";
import { LOADER_OPTIONS, MAP_ID } from "./config";
import { ThreeJSOverlayView, latLngToVector3 } from "../src";

import { Loader } from "@googlemaps/js-api-loader";

const mapOptions = {
  center: {
    lng: 0,
    lat: 0,
  },
  mapId: MAP_ID,
  zoom: 4,
  tilt: 67,
};

new Loader(LOADER_OPTIONS).load().then(() => {
  // instantiate the map
  const map = new google.maps.Map(document.getElementById("map"), mapOptions);
  // instantiate a ThreeJS Scene
  const scene = new Scene();

  [
    { lat: 45, lng: -90 },
    { lat: 45, lng: 90 },
    { lat: -45, lng: -90 },
    { lat: -45, lng: 90 },
  ].forEach((latLng: google.maps.LatLngLiteral) => {
    // Create a box mesh
    const box = new Mesh(
      new BoxBufferGeometry(10, 50, 10),
      new MeshNormalMaterial()
    );

    box.scale.multiplyScalar(10000);

    // set position at center of map
    box.position.copy(latLngToVector3(latLng));
    // set position vertically
    box.position.setY(25);

    // add box mesh to the scene
    scene.add(box);
  });

  // instantiate the ThreeJS Overlay with the scene and map
  const overlay = new ThreeJSOverlayView({
    scene,
    map,
  });
});
