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

/* eslint-disable @typescript-eslint/explicit-member-accessibility */

// prevent "WARNING: Multiple instances of Three.js being imported.” when
// importing three.js
Object.defineProperty(window, "__THREE__", {
  get: () => null,
  set: () => null,
  configurable: false,
});

import { ThreeJSOverlayView, ThreeJSOverlayViewOptions } from "../three";
import * as util from "../util";

import {
  BoxGeometry,
  Camera,
  Group,
  Light,
  Matrix4,
  Mesh,
  Object3D,
  PerspectiveCamera,
  Scene,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
} from "three";

import "jest-extended";
import { initialize, Map } from "@googlemaps/jest-mocks";
import { createWebGlContext } from "./__utils__/createWebGlContext";

// setup mocked dependencies
jest.mock("../util");

beforeEach(() => {
  initialize();
  google.maps.WebGLOverlayView = jest.fn().mockImplementation(() => {
    return new (class extends google.maps.MVCObject {
      getMap = jest.fn();
      setMap = jest.fn();
      requestRedraw = jest.fn();
      requestStateUpdate = jest.fn();
      addListener = jest.fn().mockImplementation(() => {
        return { remove: jest.fn() } as google.maps.MapsEventListener;
      });
    })();
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("basic functions", () => {
  test("instantiates with defaults", () => {
    const overlay = new ThreeJSOverlayView();

    expect(overlay["overlay"]).toBeDefined();
    expect(overlay["camera"]).toBeInstanceOf(PerspectiveCamera);

    expect(overlay.scene).toBeInstanceOf(Scene);

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
    const overlay = new ThreeJSOverlayView();
    overlay.setMap(map);

    expect(overlay["overlay"].setMap).toHaveBeenCalledWith(map);
  });

  test("getMap is called on overlay", () => {
    const overlay = new ThreeJSOverlayView();
    overlay.getMap();

    expect(overlay["overlay"].getMap).toHaveBeenCalledWith();
  });

  test("addListener is called on overlay", () => {
    const overlay = new ThreeJSOverlayView();
    const handler = jest.fn();
    const eventName = "foo";

    expect(overlay.addListener(eventName, handler)).toBeDefined();
    expect(overlay["overlay"].addListener).toHaveBeenCalledWith(
      eventName,
      handler
    );
  });
});

describe("MVCObject interface", () => {
  let overlay: ThreeJSOverlayView;
  let webglOverlay: google.maps.WebGLOverlayView;

  beforeEach(() => {
    overlay = new ThreeJSOverlayView();
    webglOverlay = overlay["overlay"];
  });

  test.each([
    ["bindTo", "eventName", () => void 0, "targetKey", true],
    ["get", "key"],
    ["notify", "key"],
    ["set", "key", "value"],
    ["setValues", { key: "value" }],
    ["unbind", "key"],
    ["unbindAll"],
  ] as const)(
    "method '%s' is forwarded to overlay",
    (method: keyof google.maps.MVCObject, ...args) => {
      overlay[method].call(overlay, ...args);
      expect(webglOverlay[method]).toHaveBeenCalledWith(...args);
    }
  );
});

describe("WebGLOverlayView interface", () => {
  let overlay: ThreeJSOverlayView;
  let gl: WebGLRenderingContext;
  let transformer: google.maps.CoordinateTransformer;
  const projMatrixArray = new Float64Array([
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  ]);

  beforeEach(() => {
    overlay = new ThreeJSOverlayView();
    gl = createWebGlContext();

    transformer = {
      fromLatLngAltitude: jest.fn(() => projMatrixArray),
      getCameraParams: jest.fn(),
    };
  });

  test("onContextRestored creates the renderer", () => {
    overlay.onContextRestored({ gl });
    const renderer: WebGLRenderer = overlay["renderer"];
    expect(renderer).toBeDefined();

    const viewport = renderer.getViewport(new Vector4());
    expect(viewport.x).toEqual(0);
    expect(viewport.y).toEqual(0);
    expect(viewport.width).toEqual(gl.canvas.width);
    expect(viewport.height).toEqual(gl.canvas.height);
  });

  test("onDraw renders the scene and resets the state", () => {
    overlay.onContextRestored({ gl });
    const renderer: WebGLRenderer = overlay["renderer"];
    let scene: Object3D, camera: Camera;
    const renderSpy = jest
      .spyOn(renderer, "render")
      .mockImplementation((s, c) => {
        scene = s;
        camera = c;
      });
    const resetStateSpy = jest.spyOn(renderer, "resetState");

    overlay.onDraw({ gl, transformer });

    expect(renderSpy).toHaveBeenCalled();
    expect(scene).toBe(overlay.scene);
    expect(camera.projectionMatrix).toEqual(
      new Matrix4().fromArray(projMatrixArray)
    );
    expect(resetStateSpy).toHaveBeenCalledAfter(renderSpy);
  });

  test("onBeforeDraw gets called before render", () => {
    overlay.onContextRestored({ gl });
    const renderer: WebGLRenderer = overlay["renderer"];
    const renderSpy = jest
      .spyOn(renderer, "render")
      .mockImplementation(() => void 0);

    overlay.onBeforeDraw = jest.fn();
    overlay.onDraw({
      gl,
      transformer,
    });

    expect(overlay.onBeforeDraw).toHaveBeenCalled();
    expect(overlay.onBeforeDraw).toHaveBeenCalledBefore(renderSpy);
  });

  test("onContextLost disposes of renderer", () => {
    overlay.onContextRestored({ gl });

    const renderer: WebGLRenderer = overlay["renderer"];
    const disposeSpy = jest.spyOn(renderer, "dispose");
    overlay.onContextLost();

    expect(disposeSpy).toHaveBeenCalled();
    expect(overlay["renderer"]).toBeNull();
  });

  test("requestRedraw is forwarded to overlay", () => {
    overlay.requestRedraw();

    expect(overlay["overlay"].requestRedraw).toHaveBeenCalledWith();
  });

  test("requestStateUpdate is forwarded to overlay", () => {
    overlay.requestStateUpdate();

    expect(overlay["overlay"].requestStateUpdate).toHaveBeenCalledWith();
  });
});

describe("setUpAxis() / scene orientation", () => {
  const latLngAlt = { lat: 0, lng: 0, altitude: 10 };

  beforeEach(() => {
    const mockedUtil = util as jest.Mocked<typeof util>;
    mockedUtil.latLngToVector3Relative.mockImplementation(
      (p, r, target = new Vector3()) => {
        return target.set(1, 2, 3);
      }
    );
  });

  test.each([
    [undefined, { x: 1, y: 2, z: 3 }],
    ["Z", { x: 1, y: 2, z: 3 }],
    ["Y", { x: 1, y: 3, z: -2 }],
    [new Vector3(1, 0, 0), { x: 3, y: 2, z: -1 }],
  ])("upAxis: %s", (upAxis, expectedCoords) => {
    const overlay = new ThreeJSOverlayView({
      upAxis: upAxis as ThreeJSOverlayViewOptions["upAxis"],
    });

    const v3 = overlay.latLngAltitudeToVector3(latLngAlt);
    expect(v3.x).toBeCloseTo(expectedCoords.x, 8);
    expect(v3.y).toBeCloseTo(expectedCoords.y, 8);
    expect(v3.z).toBeCloseTo(expectedCoords.z, 8);
  });

  test("error for invalid upAxis values", () => {
    const mock = jest.spyOn(console, "warn").mockImplementation(() => void 0);
    const overlay = new ThreeJSOverlayView({
      upAxis: "a" as ThreeJSOverlayViewOptions["upAxis"],
    });

    expect(mock).toHaveBeenCalled();

    // check that the default z-up is used
    const v3 = overlay.latLngAltitudeToVector3(latLngAlt);

    expect(v3.x).toBeCloseTo(1, 8);
    expect(v3.y).toBeCloseTo(2, 8);
    expect(v3.z).toBeCloseTo(3, 8);
  });
});

describe("latLngAltitudeToVector3()", () => {
  let mockedUtil: jest.Mocked<typeof util>;
  beforeEach(() => {
    mockedUtil = jest.mocked(util);
    const { latLngToVector3Relative } = mockedUtil;

    latLngToVector3Relative.mockImplementation(
      (p, r, target = new Vector3()) => {
        return target.set(1, 2, 3);
      }
    );
  });

  test("calls util-functions", () => {
    const overlay = new ThreeJSOverlayView({
      anchor: { lat: 5, lng: 6, altitude: 7 },
    });
    const p = { lat: 0, lng: 0, altitude: 0 };
    const v3 = overlay.latLngAltitudeToVector3(p);

    expect(mockedUtil.latLngToVector3Relative).toHaveBeenCalled();
    expect(v3).toEqual(new Vector3(1, 2, 3));
  });

  test("writes value to target parameter", () => {
    const overlay = new ThreeJSOverlayView({
      anchor: { lat: 5, lng: 6, altitude: 7 },
    });
    const p = { lat: 0, lng: 0, altitude: 0 };
    const t = new Vector3();
    const v3 = overlay.latLngAltitudeToVector3(p, t);

    expect(mockedUtil.latLngToVector3Relative).toHaveBeenCalled();
    expect(v3).toBe(t);
    expect(t).toEqual(new Vector3(1, 2, 3));
  });
});

describe("addDefaultLighting()", () => {
  test("lights are added to the default scene", () => {
    const overlay = new ThreeJSOverlayView();

    const lights: Light[] = [];
    overlay.scene.traverse((o) => {
      if ((o as Light).isLight) lights.push(o as Light);
    });

    expect(lights).not.toHaveLength(0);
  });

  test("addDefaultLighting:false", () => {
    const overlay = new ThreeJSOverlayView({ addDefaultLighting: false });

    const lights: Light[] = [];
    overlay.scene.traverse((o) => {
      if ((o as Light).isLight) lights.push(o as Light);
    });

    expect(lights).toHaveLength(0);
  });
});

describe("raycast()", () => {
  let overlay: ThreeJSOverlayView;
  let camera: PerspectiveCamera;
  let box: Mesh<BoxGeometry, never>;

  // these values were taken from a running application and are known to work
  const projMatrix = [
    0.024288994132302996, -0.0001544860884193919, -0.00004410021260124961,
    -0.00004410021260124961, 6.275603421503094e-20, 0.017096574772793482,
    -0.002943529080808796, -0.002943529080808796, -0.00028262805230606344,
    -0.01327650198026164, -0.0037899629741724055, -0.0037899629741724055,
    -0.10144748239547549, 0.2775102128618734, 0.4125525158446316,
    1.079219172577191,
  ];
  const boxPosition = new Vector3(0.12366377626911729, 0, 52.06138372088319);
  const mouseHitPosition = new Vector2(-0.131, -0.464);

  beforeEach(() => {
    overlay = new ThreeJSOverlayView();

    // this could be done by providing a mocked CoordinateTransformer
    // to the onDraw function, but this is arguably easier (although
    // it's not ideal to access protected members)
    camera = overlay["camera"];
    camera.projectionMatrix.fromArray(projMatrix);

    box = new Mesh(new BoxGeometry());
    box.position.copy(boxPosition);
  });

  test("returns an empty array for an empty scene", () => {
    const res = overlay.raycast(new Vector2(0, 0));
    expect(res).toEqual([]);
  });

  test("returns correct results in a known to work setting", () => {
    overlay.scene.add(box);
    box.updateMatrixWorld(true);

    // check for no hit at [0,0]
    expect(overlay.raycast(new Vector2(0, 0))).toEqual([]);

    let res;

    // we know where the box would be rendered
    res = overlay.raycast(mouseHitPosition);
    expect(res).toHaveLength(1);
    expect(res[0].object).toBe(box);

    // check that it ignores {recursive:false} here and returns the same result
    const res2 = overlay.raycast(mouseHitPosition, { recursive: false });
    expect(res2).toEqual(res);

    // test calls with explicit object-list
    res = overlay.raycast(mouseHitPosition, [box], { recursive: false });
    expect(res).toEqual(res);

    const box2 = new Mesh(new BoxGeometry());
    res = overlay.raycast(mouseHitPosition, [box2]);
    expect(res).toEqual([]);

    // test recursion
    const g = new Group();
    g.add(box);
    res = overlay.raycast(mouseHitPosition, [g], { recursive: false });
    expect(res).toEqual([]);
  });

  test("sets and restores raycaster parameters", () => {
    const raycaster = overlay["raycaster"];

    const origParams = {};
    const customParams = {};
    let currParams = origParams;
    let intersectParams = null;

    const setParamsMock = jest.fn((v) => (currParams = v));
    const getParamsMock = jest.fn(() => origParams);

    jest.spyOn(raycaster, "intersectObjects").mockImplementation(() => {
      intersectParams = currParams;
      return [];
    });

    Object.defineProperty(raycaster, "params", {
      get: getParamsMock,
      set: setParamsMock,
    });

    overlay.scene.add(box);
    box.updateMatrixWorld(true);

    overlay.raycast(mouseHitPosition, { raycasterParameters: customParams });

    expect(setParamsMock).toHaveBeenCalledTimes(2);

    const [[arg1], [arg2]] = setParamsMock.mock.calls;
    expect(arg1).toBe(customParams);
    expect(arg2).toBe(origParams);
    expect(intersectParams).toBe(customParams);
  });
});
