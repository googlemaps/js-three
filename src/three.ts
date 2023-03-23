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
  DirectionalLight,
  Euler,
  HemisphereLight,
  Intersection,
  MathUtils,
  Matrix4,
  Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Quaternion,
  Raycaster,
  RaycasterParameters,
  Scene,
  sRGBEncoding,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { latLngToVector3Relative, toLatLngAltitudeLiteral } from "./util";

import type { LatLngTypes } from "./util";

const DEFAULT_UP = new Vector3(0, 0, 1);

export interface RaycastOptions {
  /**
   * Set to true to also test children of the specified objects for
   * intersections.
   *
   * @default false
   */
  recursive?: boolean;

  /**
   * Update the inverse-projection-matrix before casting the ray (set this
   * to false if you need to run multiple raycasts for the same frame).
   *
   * @default true
   */
  updateMatrix?: boolean;

  /**
   * Additional parameters to pass to the three.js raycaster.
   *
   * @see https://threejs.org/docs/#api/en/core/Raycaster.params
   */
  raycasterParameters?: RaycasterParameters;
}

export interface ThreeJSOverlayViewOptions {
  /**
   * The anchor for the scene.
   *
   * @default {lat: 0, lng: 0, altitude: 0}
   */
  anchor?: LatLngTypes;

  /**
   * The axis pointing up in the scene. Can be specified as "Z", "Y" or a
   * Vector3, in which case the normalized vector will become the up-axis.
   *
   * @default "Z"
   */
  upAxis?: "Z" | "Y" | Vector3;

  /**
   * The map the overlay will be added to.
   * Can be set at initialization or by calling `setMap(map)`.
   */
  map?: google.maps.Map;

  /**
   * The scene object to render in the overlay. If no scene is specified, a
   * new scene is created and can be accessed via `overlay.scene`.
   */
  scene?: Scene;

  /**
   * The animation mode controls when the overlay will redraw, either
   * continuously (`always`) or on demand (`ondemand`). When using the
   * on demand mode, the overlay will re-render whenever the map renders
   * (camera movements) or when `requestRedraw()` is called.
   *
   * To achieve animations in this mode, you can either use an outside
   * animation-loop that calls `requestRedraw()` as long as needed or call
   * `requestRedraw()` from within the `onBeforeRender` function to
   *
   * @default "ondemand"
   */
  animationMode?: "always" | "ondemand";

  /**
   * Add default lighting to the scene.
   * @default true
   */
  addDefaultLighting?: boolean;
}

/* eslint-disable @typescript-eslint/no-empty-function */

/**
 * Add a [three.js](https://threejs.org) scene as a [Google Maps WebGLOverlayView](http://goo.gle/WebGLOverlayView-ref).
 */
export class ThreeJSOverlayView implements google.maps.WebGLOverlayView {
  /** {@inheritDoc ThreeJSOverlayViewOptions.scene} */
  public readonly scene: Scene;

  /** {@inheritDoc ThreeJSOverlayViewOptions.animationMode} */
  public animationMode: "always" | "ondemand" = "ondemand";

  /** {@inheritDoc ThreeJSOverlayViewOptions.anchor} */
  protected anchor: google.maps.LatLngAltitudeLiteral;
  protected readonly camera: PerspectiveCamera;
  protected readonly rotationArray: Float32Array = new Float32Array(3);
  protected readonly rotationInverse: Quaternion = new Quaternion();
  protected readonly projectionMatrixInverse = new Matrix4();

  protected readonly overlay: google.maps.WebGLOverlayView;
  protected renderer: WebGLRenderer;
  protected raycaster: Raycaster = new Raycaster();

  constructor(options: ThreeJSOverlayViewOptions = {}) {
    const {
      anchor = { lat: 0, lng: 0, altitude: 0 },
      upAxis = "Z",
      scene,
      map,
      animationMode = "ondemand",
      addDefaultLighting = true,
    } = options;

    this.overlay = new google.maps.WebGLOverlayView();
    this.renderer = null;
    this.camera = null;
    this.animationMode = animationMode;

    this.setAnchor(anchor);
    this.setUpAxis(upAxis);

    this.scene = scene ?? new Scene();
    if (addDefaultLighting) this.initSceneLights();

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
   * Sets the anchor-point.
   * @param anchor
   */
  public setAnchor(anchor: LatLngTypes) {
    this.anchor = toLatLngAltitudeLiteral(anchor);
  }

  /**
   * Sets the axis to use as "up" in the scene.
   * @param axis
   */
  public setUpAxis(axis: "Y" | "Z" | Vector3): void {
    const upVector = new Vector3(0, 0, 1);
    if (typeof axis !== "string") {
      upVector.copy(axis);
    } else {
      if (axis.toLowerCase() === "y") {
        upVector.set(0, 1, 0);
      } else if (axis.toLowerCase() !== "z") {
        console.warn(`invalid value '${axis}' specified as upAxis`);
      }
    }

    upVector.normalize();

    const q = new Quaternion();
    q.setFromUnitVectors(upVector, DEFAULT_UP);

    // inverse rotation is needed in latLngAltitudeToVector3()
    this.rotationInverse.copy(q).invert();

    // copy to rotationArray for transformer.fromLatLngAltitude()
    const euler = new Euler().setFromQuaternion(q, "XYZ");
    this.rotationArray[0] = MathUtils.radToDeg(euler.x);
    this.rotationArray[1] = MathUtils.radToDeg(euler.y);
    this.rotationArray[2] = MathUtils.radToDeg(euler.z);
  }

  /**
   * Runs raycasting for the specified screen-coordinates against all objects
   * in the scene.
   *
   * @param p normalized screenspace coordinates of the
   *   mouse-cursor. x/y are in range [-1, 1], y is pointing up.
   * @param options raycasting options. In this case the `recursive` option
   *   has no effect as it is always recursive.
   * @return the list of intersections
   */
  public raycast(p: Vector2, options?: RaycastOptions): Intersection[];

  /**
   * Runs raycasting for the specified screen-coordinates against the specified
   * list of objects.
   *
   * Note for typescript users: the returned Intersection objects can only be
   * properly typed for non-recursive lookups (this is handled by the internal
   * signature below).
   *
   * @param p normalized screenspace coordinates of the
   *   mouse-cursor. x/y are in range [-1, 1], y is pointing up.
   * @param objects list of objects to test
   * @param options raycasting options.
   */
  public raycast(
    p: Vector2,
    objects: Object3D[],
    options?: RaycastOptions & { recursive: true }
  ): Intersection[];

  // additional signature to enable typings in returned objects when possible
  public raycast<T extends Object3D>(
    p: Vector2,
    objects: T[],
    options?:
      | Omit<RaycastOptions, "recursive">
      | (RaycastOptions & { recursive: false })
  ): Intersection<T>[];

  // implemetation
  public raycast(
    p: Vector2,
    optionsOrObjects?: Object3D[] | RaycastOptions,
    options: RaycastOptions = {}
  ): Intersection[] {
    let objects: Object3D[];
    if (Array.isArray(optionsOrObjects)) {
      objects = optionsOrObjects || null;
    } else {
      objects = [this.scene];
      options = { ...optionsOrObjects, recursive: true };
    }

    const {
      updateMatrix = true,
      recursive = false,
      raycasterParameters,
    } = options;

    // when `raycast()` is called from within the `onBeforeRender()` callback,
    // the mvp-matrix for this frame has already been computed and stored in
    // `this.camera.projectionMatrix`.
    // The mvp-matrix transforms world-space meters to clip-space
    // coordinates. The inverse matrix created here does the exact opposite
    // and converts clip-space coordinates to world-space.
    if (updateMatrix) {
      this.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();
    }

    // create two points (with different depth) from the mouse-position and
    // convert them into world-space coordinates to set up the ray.
    this.raycaster.ray.origin
      .set(p.x, p.y, 0)
      .applyMatrix4(this.projectionMatrixInverse);

    this.raycaster.ray.direction
      .set(p.x, p.y, 0.5)
      .applyMatrix4(this.projectionMatrixInverse)
      .sub(this.raycaster.ray.origin)
      .normalize();

    // back up the raycaster parameters
    const oldRaycasterParams = this.raycaster.params;
    if (raycasterParameters) {
      this.raycaster.params = raycasterParameters;
    }

    const results = this.raycaster.intersectObjects(objects, recursive);

    // reset raycaster params to whatever they were before
    this.raycaster.params = oldRaycasterParams;

    return results;
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
      transformer.fromLatLngAltitude(this.anchor, this.rotationArray)
    );

    gl.disable(gl.SCISSOR_TEST);

    this.onBeforeDraw();

    this.renderer.render(this.scene, this.camera);
    this.renderer.resetState();

    if (this.animationMode === "always") this.requestRedraw();
  }

  /**
   * Convert coordinates from WGS84 Latitude Longitude to world-space
   * coordinates while taking the origin and orientation into account.
   */
  public latLngAltitudeToVector3(
    position: LatLngTypes,
    target = new Vector3()
  ) {
    latLngToVector3Relative(
      toLatLngAltitudeLiteral(position),
      this.anchor,
      target
    );

    target.applyQuaternion(this.rotationInverse);

    return target;
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
   * objects that are bound to the object's property as well as the object
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

  /**
   * Creates lights (directional and hemisphere light) to illuminate the model
   * (roughly approximates the lighting of buildings in maps)
   */
  private initSceneLights() {
    const hemiLight = new HemisphereLight(0xffffff, 0x444444, 1);
    hemiLight.position.set(0, -0.2, 1).normalize();

    const dirLight = new DirectionalLight(0xffffff);
    dirLight.position.set(0, 10, 100);

    this.scene.add(hemiLight, dirLight);
  }
}
