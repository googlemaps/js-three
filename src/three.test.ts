/**
 * Copyright 2021 Google LLC. All Rights Reserved.
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

import { Map, initialize } from "@googlemaps/jest-mocks";
import { PerspectiveCamera, Scene, WebGLRenderer } from "three";

import { ThreeJSOverlayView } from "./three";

beforeEach(() => {
  initialize();
  google.maps.WebGLOverlayView = jest.fn().mockImplementation(() => {
    return {
      getMap: jest.fn(),
      setMap: jest.fn(),
      requestRedraw: jest.fn(),
      addListener: jest.fn().mockImplementation(() => {
        return {} as google.maps.MapsEventListener;
      }),
    };
  });
});

test("instantiates with defaults", () => {
  const overlay = new ThreeJSOverlayView({});

  expect(overlay["overlay"]).toBeDefined();
  expect(overlay["camera"]).toBeInstanceOf(PerspectiveCamera);

  expect(overlay.scene).toBeInstanceOf(Scene);
  expect(overlay.scene.rotation.x).toEqual(Math.PI / 2);

  // required hooks must be defined
  expect(overlay["overlay"].onAdd).toBeDefined();
  expect(overlay["overlay"].onRemove).toBeDefined();
  expect(overlay["overlay"].onContextLost).toBeDefined();
  expect(overlay["overlay"].onContextRestored).toBeDefined();
  expect(overlay["overlay"].onDraw).toBeDefined();
});

test("instantiates with map and calls setMap", () => {
  const map = new Map(
    document.createElement("div"),
    {}
  ) as unknown as google.maps.Map;

  const overlay = new ThreeJSOverlayView({
    map,
  });

  expect(overlay["overlay"].setMap).toHaveBeenCalledWith(map);
});

test("setMap is called on overlay", () => {
  const map = new Map(
    document.createElement("div"),
    {}
  ) as unknown as google.maps.Map;
  const overlay = new ThreeJSOverlayView({});
  overlay.setMap(map);

  expect(overlay["overlay"].setMap).toHaveBeenCalledWith(map);
});

test("onContext lost disposes of renderer", () => {
  const overlay = new ThreeJSOverlayView({});

  overlay.onContextLost(); // noop
  expect(overlay["renderer"]).toBeNull();

  const dispose = jest.fn();
  overlay["renderer"] = {
    dispose,
  } as unknown as WebGLRenderer;

  overlay.onContextLost();

  expect(dispose).toHaveBeenCalled();
  expect(overlay["renderer"]).toBeNull();
});

test("getMap is called on overlay", () => {
  const overlay = new ThreeJSOverlayView({});
  overlay.getMap();

  expect(overlay["overlay"].getMap).toHaveBeenCalledWith();
});

test("requestRedraw is called on overlay", () => {
  const overlay = new ThreeJSOverlayView({});
  overlay.requestRedraw();

  expect(overlay["overlay"].requestRedraw).toHaveBeenCalledWith();
});

test("addListener is called on overlay", () => {
  const overlay = new ThreeJSOverlayView({});
  const handler = () => {};
  const eventName = "foo";

  expect(overlay.addListener(eventName, handler)).toBeDefined();
  expect(overlay["overlay"].addListener).toHaveBeenCalledWith(
    eventName,
    handler
  );
});
