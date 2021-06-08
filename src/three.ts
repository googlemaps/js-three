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
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  sRGBEncoding,
} from "three";

export interface LatLngAltitudeLiteral extends google.maps.LatLngLiteral {
  altitude: number;
}

export interface ThreeJSOverlayViewOptions {
  /** The anchor for the scene. Defaults to {lat: 0, lng: 0, altitude: 0}. */
  anchor?: LatLngAltitudeLiteral;
  /** The rotations applied in the camera transformation matrix. Defaults to [0, 0, 0]. */
  rotation?: Float32Array;
  /** The scale applied in the camera transformation matrix. Defaults to [1, 1, 1].*/
  scale?: Float32Array;
  /** The map can be set at initialization or by calling `setMap(map)`. */
  map?: google.maps.Map;
  /** The scene can be provided. Defaults to `new Scene()`. */
  scene?: Scene;
}

/**
 * Add a [three.js](https://threejs.org) scene as a [Google Maps WebglOverlayView](http://goo.gle/webgloverlayview-ref).
 */
export class ThreeJSOverlayView implements google.maps.WebglOverlayView {
  /**
   * See [[ThreeJSOverlayViewOptions.anchor]]
   */
  readonly anchor: LatLngAltitudeLiteral;
  /**
   * See [[ThreeJSOverlayViewOptions.scene]]
   */
  readonly scene: Scene;

  protected readonly camera: PerspectiveCamera;
  protected readonly scale: Float32Array;
  protected readonly rotation: Float32Array;
  protected readonly overlay: google.maps.WebglOverlayView;
  protected renderer: WebGLRenderer;

  constructor({
    anchor = { lat: 0, lng: 0, altitude: 0 },
    rotation = new Float32Array([0, 0, 0]),
    scale = new Float32Array([1, 1, 1]),
    scene = new Scene(),
    map,
  }: ThreeJSOverlayViewOptions) {
    this.overlay = new google.maps.WebglOverlayView();
    this.renderer = null;
    this.camera = null;
    this.anchor = anchor;
    this.rotation = rotation;
    this.scale = scale;
    this.scene = scene;

    this.overlay.onAdd = this.onAdd.bind(this);
    this.overlay.onRemove = this.onRemove.bind(this);
    this.overlay.onContextLost = this.onContextLost.bind(this);
    this.overlay.onContextRestored = this.onContextRestored.bind(this);
    this.overlay.onDraw = this.onDraw.bind(this);

    this.camera = new PerspectiveCamera();

    if (map) {
      this.setMap(map);
    }
  }

  onAdd(): void {}

  onRemove(): void {}

  getMap(): google.maps.Map {
    return this.overlay.getMap();
  }

  requestRedraw(): void {
    this.overlay.requestRedraw();
  }

  setMap(map: google.maps.Map): void {
    this.overlay.setMap(map);
  }

  addListener(
    eventName: string,
    handler: Function
  ): google.maps.MapsEventListener {
    return this.overlay.addListener(eventName, handler);
  }

  bindTo(
    key: string,
    target: google.maps.MVCObject,
    targetKey?: string,
    noNotify?: boolean
  ): void {
    this.overlay.bindTo(key, target, targetKey, noNotify);
  }

  get(key: string) {
    return this.overlay.get(key);
  }

  notify(key: string): void {
    this.overlay.notify(key);
  }

  set(key: string, value: any): void {
    this.overlay.set(key, value);
  }

  setValues(values?: object): void {
    this.overlay.setValues(values);
  }

  unbind(key: string): void {
    this.overlay.unbind(key);
  }

  unbindAll(): void {
    this.overlay.unbindAll();
  }

  onContextRestored(gl: WebGLRenderingContext) {
    this.renderer = new WebGLRenderer({
      canvas: gl.canvas,
      context: gl,
      ...gl.getContextAttributes(),
    });
    this.renderer.autoClear = false;
    this.renderer.autoClearDepth = false;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;

    // LinearEncoding is default for historical reasons
    // https://discourse.threejs.org/t/linearencoding-vs-srgbencoding/23243
    this.renderer.outputEncoding = sRGBEncoding;

    const { width, height, clientWidth } = gl.canvas as HTMLCanvasElement;

    this.renderer.setPixelRatio(width / clientWidth);
    this.renderer.setSize(width, height, false);
  }

  onContextLost() {}

  onDraw(
    gl: WebGLRenderingContext,
    transformer: google.maps.CoordinateTransformer
  ): void {
    const { lat, lng, altitude } = this.anchor;

    this.camera.projectionMatrix.fromArray(
      transformer.fromLatLngAltitude(
        { lat, lng },
        altitude,
        this.rotation,
        this.scale
      )
    );

    gl.disable(gl.SCISSOR_TEST);

    this.requestRedraw();
    this.renderer.render(this.scene, this.camera);

    // reset state using renderer.resetState() and not renderer.state.reset()
    this.renderer.resetState();
  }
}
