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

import {
  BoxBufferGeometry,
  MathUtils,
  Mesh,
  MeshNormalMaterial,
  Scene,
} from "three";
import { LOADER_OPTIONS, MAP_ID } from "./config";
import { ThreeJSOverlayView, latLngToVector3 } from "../src";

import { Loader } from "@googlemaps/js-api-loader";

const mapOptions = {
  center: {
    lng: -122.34378755092621,
    lat: 47.607465080615476,
  },
  mapId: MAP_ID,
  zoom: 15,
  heading: 45,
  tilt: 67,
};

new Loader(LOADER_OPTIONS).load().then(() => {
  // instantiate the map
  const map = new google.maps.Map(document.getElementById("map"), mapOptions);
  // instantiate a ThreeJS Scene
  const scene = new Scene();

  // Create a box mesh
  const box = new Mesh(
    new BoxBufferGeometry(10, 50, 10),
    new MeshNormalMaterial()
  );

  // set position at center of map
  box.position.copy(latLngToVector3(mapOptions.center));
  // set position vertically
  box.position.setY(25);

  // add box mesh to the scene
  scene.add(box);

  // instantiate the ThreeJS Overlay with the scene and map
  const overlay = new ThreeJSOverlayView({
    scene,
    map,
  });

  // rotate the box using requestAnimationFrame
  const animate = () => {
    box.rotateY(MathUtils.degToRad(0.1));

    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
});
