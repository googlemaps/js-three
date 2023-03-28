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
import { BoxGeometry, MathUtils, Mesh, MeshMatcapMaterial } from "three";

const mapOptions = {
  center: {
    lng: -122.343787,
    lat: 47.607465,
  },
  mapId: MAP_ID,
  zoom: 15,
  heading: 45,
  tilt: 67,
};

new Loader(LOADER_OPTIONS).load().then(() => {
  // create the map and ThreeJS Overlay
  const map = new google.maps.Map(document.getElementById("map"), mapOptions);
  const overlay = new ThreeJSOverlayView({ map });

  // Create a box mesh
  const box = new Mesh(
    new BoxGeometry(100, 200, 500),
    new MeshMatcapMaterial()
  );

  // set position at center of map
  const pos = overlay.latLngAltitudeToVector3(mapOptions.center);
  box.position.copy(pos);

  // set position vertically
  box.position.z = 25;

  // add box mesh to the scene
  overlay.scene.add(box);

  // rotate the box using requestAnimationFrame
  const animate = () => {
    box.rotateZ(MathUtils.degToRad(0.1));

    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
});
