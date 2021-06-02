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

import { AxesHelper, Scene } from "three";
import { LOADER_OPTIONS, MAP_ID } from "./config";
import { ThreeJSOverlayView, WORLD_SIZE } from "../src";

import { Loader } from "@googlemaps/js-api-loader";

const mapOptions = {
  center: {
    lat: 0,
    lng: 0,
  },
  mapId: MAP_ID,
  zoom: 5,
  heading: -45,
  tilt: 45,
};

new Loader(LOADER_OPTIONS).load().then(() => {
  const map = new google.maps.Map(document.getElementById("map"), mapOptions);
  const scene = new Scene();

  scene.add(new AxesHelper(WORLD_SIZE));

  new ThreeJSOverlayView({
    scene,
    map,
  });
});
