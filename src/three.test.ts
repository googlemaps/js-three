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

import { ThreeJSOverlayView } from "./three";
import {
  BoxGeometry,
  Group,
  Light,
  Mesh,
  PerspectiveCamera,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";

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

test("onContext lost disposes of renderer", () => {
  const overlay = new ThreeJSOverlayView();

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
  const overlay = new ThreeJSOverlayView();
  overlay.getMap();

  expect(overlay["overlay"].getMap).toHaveBeenCalledWith();
});

test("requestRedraw is called on overlay", () => {
  const overlay = new ThreeJSOverlayView();
  overlay.requestRedraw();

  expect(overlay["overlay"].requestRedraw).toHaveBeenCalledWith();
});

test("addListener is called on overlay", () => {
  const overlay = new ThreeJSOverlayView();
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const handler = () => {};
  const eventName = "foo";

  expect(overlay.addListener(eventName, handler)).toBeDefined();
  expect(overlay["overlay"].addListener).toHaveBeenCalledWith(
    eventName,
    handler
  );
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
