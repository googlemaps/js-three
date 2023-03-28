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

import { LOADER_OPTIONS, MAP_ID } from "./config";
import { ThreeJSOverlayView } from "../src";

import { Loader } from "@googlemaps/js-api-loader";
import { BoxGeometry, Mesh, MeshMatcapMaterial } from "three";

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
  // create the map and overlay
  const map = new google.maps.Map(document.getElementById("map"), mapOptions);
  const overlay = new ThreeJSOverlayView({ map });

  [
    { lat: 45, lng: -90 },
    { lat: 45, lng: 90 },
    { lat: -45, lng: -90 },
    { lat: -45, lng: 90 },
  ].forEach((latLng: google.maps.LatLngLiteral) => {
    // create a box mesh with origin on the ground, in z-up orientation
    const geometry = new BoxGeometry(10, 50, 10)
      .translate(0, 25, 0)
      .rotateX(Math.PI / 2);

    const box = new Mesh(geometry, new MeshMatcapMaterial());

    // make it huge
    box.scale.multiplyScalar(10000);

    // set position at center of map
    overlay.latLngAltitudeToVector3(latLng, box.position);

    // add box mesh to the scene
    overlay.scene.add(box);
  });
});
