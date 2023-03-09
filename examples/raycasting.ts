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

import { LOADER_OPTIONS } from "./config";
import { ThreeJSOverlayView } from "../src";

import { Loader } from "@googlemaps/js-api-loader";
import {
  AxesHelper,
  CylinderGeometry,
  GridHelper,
  MathUtils,
  Mesh,
  MeshMatcapMaterial,
  Vector2,
} from "three";

// the corners of the field in the Levi’s Stadium in Santa Clara
const coordinates = [
  { lng: -121.9702904, lat: 37.4034362 },
  { lng: -121.9698018, lat: 37.4027095 },
  { lng: -121.9693109, lat: 37.402918 },
  { lng: -121.969804, lat: 37.4036465 },
];
const center = { lng: -121.9698032, lat: 37.4031777, altitude: 0 };

const DEFAULT_COLOR = 0xffffff;
const HIGHLIGHT_COLOR = 0xff0000;

const mapOptions = {
  center,
  mapId: "7057886e21226ff7",
  zoom: 18,
  tilt: 67.5,
  disableDefaultUI: true,
  backgroundColor: "transparent",
  gestureHandling: "greedy",
};

new Loader(LOADER_OPTIONS).load().then(() => {
  // create the map and overlay
  const map = new google.maps.Map(document.getElementById("map"), mapOptions);
  const overlay = new ThreeJSOverlayView({ map, anchor: center, upAxis: "Y" });

  const mapDiv = map.getDiv();
  const mousePosition = new Vector2();

  map.addListener("mousemove", (ev: google.maps.MapMouseEvent) => {
    const domEvent = ev.domEvent as MouseEvent;
    const { left, top, width, height } = mapDiv.getBoundingClientRect();

    const x = domEvent.clientX - left;
    const y = domEvent.clientY - top;

    mousePosition.x = 2 * (x / width) - 1;
    mousePosition.y = 1 - 2 * (y / height);

    // since the actual raycasting is performed when the next frame is
    // rendered, we have to make sure that it will be called for the next frame.
    overlay.requestRedraw();
  });

  // grid- and axes helpers to help with the orientation
  const grid = new GridHelper(1);

  grid.rotation.y = MathUtils.degToRad(28.1);
  grid.scale.set(48.8, 0, 91.44);
  overlay.scene.add(grid);
  overlay.scene.add(new AxesHelper(20));

  const meshes = coordinates.map((p) => {
    const mesh = new Mesh(
      new CylinderGeometry(2, 1, 20, 24, 1),
      new MeshMatcapMaterial()
    );
    mesh.geometry.translate(0, mesh.geometry.parameters.height / 2, 0);
    overlay.latLngAltitudeToVector3(p, mesh.position);

    overlay.scene.add(mesh);

    return mesh;
  });

  let highlightedObject: (typeof meshes)[number] | null = null;

  overlay.onBeforeDraw = () => {
    const intersections = overlay.raycast(mousePosition, meshes);
    if (highlightedObject) {
      // when there's a previously highlighted object, reset the highlighting
      highlightedObject.material.color.setHex(DEFAULT_COLOR);
    }

    if (intersections.length === 0) {
      // reset default cursor when no object is under the cursor
      map.setOptions({ draggableCursor: null });
      highlightedObject = null;
      return;
    }

    // change the color of the object and update the map-cursor to indicate
    // the object is clickable.
    highlightedObject = intersections[0].object;
    highlightedObject.material.color.setHex(HIGHLIGHT_COLOR);
    map.setOptions({ draggableCursor: "pointer" });
  };
});
