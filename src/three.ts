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
  sRGBEncoding,
  WebGLRenderer,
} from "three";

export interface ThreeJSOverlayViewOptions {
  /** The anchor for the scene. Defaults to {lat: 0, lng: 0, altitude: 0}. */
  anchor?: google.maps.LatLngAltitudeLiteral;
  /** The rotations applied in the camera transformation matrix. Defaults to [0, 0, 0]. */
  rotation?: Float32Array;
  /** The scale applied in the camera transformation matrix. Defaults to [1, 1, 1].*/
  scale?: Float32Array;
  /** The map can be set at initialization or by calling `setMap(map)`. */
  map?: google.maps.Map;
  /** The scene can be provided. Defaults to `new Scene()`. */
  scene?: Scene;
}

/* eslint-disable @typescript-eslint/no-empty-function */

/**
 * Add a [three.js](https://threejs.org) scene as a [Google Maps WebGLOverlayView](http://goo.gle/WebGLOverlayView-ref).
 *
 * **Note**: The scene will be rotated to a default up axis of (0, 1, 0) matching that of three.js.
 * *
 */
export class ThreeJSOverlayView implements google.maps.WebGLOverlayView {
  /**
   * See [[ThreeJSOverlayViewOptions.anchor]]
   */
  public readonly anchor: google.maps.LatLngAltitudeLiteral;
  /**
   * See [[ThreeJSOverlayViewOptions.scene]]
   */
  public readonly scene: Scene;

  protected readonly camera: PerspectiveCamera;
  protected readonly scale: Float32Array;
  protected readonly rotation: Float32Array;
  protected readonly overlay: google.maps.WebGLOverlayView;
  protected renderer: WebGLRenderer;

  constructor(options: ThreeJSOverlayViewOptions = {}) {
    const {
      anchor = { lat: 0, lng: 0, altitude: 0 },
      rotation = new Float32Array([0, 0, 0]),
      scale = new Float32Array([1, 1, 1]),
      scene,
      map,
    } = options;

    this.overlay = new google.maps.WebGLOverlayView();
    this.renderer = null;
    this.camera = null;
    this.anchor = anchor;
    this.rotation = rotation;
    this.scale = scale;
    this.scene = scene ?? new Scene();

    // rotate scene consistent with y up in THREE
    this.scene.rotation.x = Math.PI / 2;

    this.overlay.onAdd = this.onAdd.bind(this);
    this.overlay.onRemove = this.onRemove.bind(this);
    this.overlay.onContextLost = this.onContextLost.bind(this);
    this.overlay.onContextRestored = this.onContextRestored.bind(this);
    this.overlay.onStateUpdate = this.onStateUpdate.bind(this);
    this.overlay.onDraw = this.onDraw.bind(this);

    this.camera = new PerspectiveCamera();

    if (map) {
      this.setMap(map);
    }
  }

  /**
   * Overwrite this method to handle any GL state updates outside the
   * render animation frame.
   * @param options
   */
  public onStateUpdate(options: google.maps.WebGLStateOptions): void {}

  /**
   * Overwrite this method to fetch or create intermediate data structures
   * before the overlay is drawn that don’t require immediate access to the
   * WebGL rendering context.
   */
  public onAdd(): void {}

  /**
   * Overwrite this method to update your scene just before a new frame is
   * drawn.
   */
  public onBeforeDraw(): void {}

  /**
   * This method is called when the overlay is removed from the map with
   * `overlay.setMap(null)`, and is where you can remove all intermediate
   * objects created in onAdd.
   */
  public onRemove(): void {}

  /**
   * Triggers the map to update GL state.
   */
  public requestStateUpdate(): void {
    this.overlay.requestStateUpdate();
  }

  /**
   * Triggers the map to redraw a frame.
   */
  public requestRedraw(): void {
    this.overlay.requestRedraw();
  }

  /**
   * Returns the map the overlay is added to.
   */
  public getMap(): google.maps.Map {
    return this.overlay.getMap();
  }

  /**
   * Adds the overlay to the map.
   * @param map The map to access the div, model and view state.
   */
  public setMap(map: google.maps.Map): void {
    this.overlay.setMap(map);
  }

  /**
   * Adds the given listener function to the given event name. Returns an
   * identifier for this listener that can be used with
   * <code>google.maps.event.removeListener</code>.
   */
  public addListener(
    eventName: string,
    handler: (...args: unknown[]) => void
  ): google.maps.MapsEventListener {
    return this.overlay.addListener(eventName, handler);
  }

  /**
   * This method is called once the rendering context is available. Use it to
   * initialize or bind any WebGL state such as shaders or buffer objects.
   * @param options that allow developers to restore the GL context.
   */
  public onContextRestored({ gl }: google.maps.WebGLStateOptions) {
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

    const { width, height } = gl.canvas;
    this.renderer.setViewport(0, 0, width, height);
  }

  /**
   * This method is called when the rendering context is lost for any reason,
   * and is where you should clean up any pre-existing GL state, since it is
   * no longer needed.
   */
  public onContextLost() {
    if (!this.renderer) {
      return;
    }

    this.renderer.dispose();
    this.renderer = null;
  }

  /**
   * Implement this method to draw WebGL content directly on the map. Note
   * that if the overlay needs a new frame drawn then call {@link
   * ThreeJSOverlayView.requestRedraw}.
   * @param options that allow developers to render content to an associated
   *     Google basemap.
   */
  public onDraw({ gl, transformer }: google.maps.WebGLDrawOptions): void {
    this.camera.projectionMatrix.fromArray(
      transformer.fromLatLngAltitude(this.anchor, this.rotation, this.scale)
    );

    gl.disable(gl.SCISSOR_TEST);

    this.onBeforeDraw();
    this.renderer.render(this.scene, this.camera);
    // reset state using renderer.resetState() and not renderer.state.reset()
    this.renderer.resetState();

    this.requestRedraw();
  }

  // MVCObject interface forwarded to the overlay

  /**
   * Binds a View to a Model.
   */
  public bindTo(
    key: string,
    target: google.maps.MVCObject,
    targetKey?: string,
    noNotify?: boolean
  ): void {
    this.overlay.bindTo(key, target, targetKey, noNotify);
  }

  /**
   * Gets a value.
   */
  public get(key: string) {
    return this.overlay.get(key);
  }

  /**
   * Notify all observers of a change on this property. This notifies both
   * objects that are bound to the object&#39;s property as well as the object
   * that it is bound to.
   */
  public notify(key: string): void {
    this.overlay.notify(key);
  }

  /**
   * Sets a value.
   */
  public set(key: string, value: unknown): void {
    this.overlay.set(key, value);
  }

  /**
   * Sets a collection of key-value pairs.
   */
  public setValues(values?: object): void {
    this.overlay.setValues(values);
  }

  /**
   * Removes a binding. Unbinding will set the unbound property to the current
   * value. The object will not be notified, as the value has not changed.
   */
  public unbind(key: string): void {
    this.overlay.unbind(key);
  }

  /**
   * Removes all bindings.
   */
  public unbindAll(): void {
    this.overlay.unbindAll();
  }
}
