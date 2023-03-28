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
/// <reference types="google.maps" />
import { Intersection, Matrix4, Object3D, PerspectiveCamera, Quaternion, Raycaster, RaycasterParameters, Scene, Vector2, Vector3, WebGLRenderer } from "three";
import type { LatLngTypes } from "./util";
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
/**
 * Add a [three.js](https://threejs.org) scene as a [Google Maps WebGLOverlayView](http://goo.gle/WebGLOverlayView-ref).
 */
export declare class ThreeJSOverlayView implements google.maps.WebGLOverlayView {
    /** {@inheritDoc ThreeJSOverlayViewOptions.scene} */
    readonly scene: Scene;
    /** {@inheritDoc ThreeJSOverlayViewOptions.animationMode} */
    animationMode: "always" | "ondemand";
    /** {@inheritDoc ThreeJSOverlayViewOptions.anchor} */
    protected anchor: google.maps.LatLngAltitudeLiteral;
    protected readonly camera: PerspectiveCamera;
    protected readonly rotationArray: Float32Array;
    protected readonly rotationInverse: Quaternion;
    protected readonly projectionMatrixInverse: Matrix4;
    protected readonly overlay: google.maps.WebGLOverlayView;
    protected renderer: WebGLRenderer;
    protected raycaster: Raycaster;
    constructor(options?: ThreeJSOverlayViewOptions);
    /**
     * Sets the anchor-point.
     * @param anchor
     */
    setAnchor(anchor: LatLngTypes): void;
    /**
     * Sets the axis to use as "up" in the scene.
     * @param axis
     */
    setUpAxis(axis: "Y" | "Z" | Vector3): void;
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
    raycast(p: Vector2, options?: RaycastOptions): Intersection[];
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
    raycast(p: Vector2, objects: Object3D[], options?: RaycastOptions & {
        recursive: true;
    }): Intersection[];
    raycast<T extends Object3D>(p: Vector2, objects: T[], options?: Omit<RaycastOptions, "recursive"> | (RaycastOptions & {
        recursive: false;
    })): Intersection<T>[];
    /**
     * Overwrite this method to handle any GL state updates outside the
     * render animation frame.
     * @param options
     */
    onStateUpdate(options: google.maps.WebGLStateOptions): void;
    /**
     * Overwrite this method to fetch or create intermediate data structures
     * before the overlay is drawn that don’t require immediate access to the
     * WebGL rendering context.
     */
    onAdd(): void;
    /**
     * Overwrite this method to update your scene just before a new frame is
     * drawn.
     */
    onBeforeDraw(): void;
    /**
     * This method is called when the overlay is removed from the map with
     * `overlay.setMap(null)`, and is where you can remove all intermediate
     * objects created in onAdd.
     */
    onRemove(): void;
    /**
     * Triggers the map to update GL state.
     */
    requestStateUpdate(): void;
    /**
     * Triggers the map to redraw a frame.
     */
    requestRedraw(): void;
    /**
     * Returns the map the overlay is added to.
     */
    getMap(): google.maps.Map;
    /**
     * Adds the overlay to the map.
     * @param map The map to access the div, model and view state.
     */
    setMap(map: google.maps.Map): void;
    /**
     * Adds the given listener function to the given event name. Returns an
     * identifier for this listener that can be used with
     * <code>google.maps.event.removeListener</code>.
     */
    addListener(eventName: string, handler: (...args: unknown[]) => void): google.maps.MapsEventListener;
    /**
     * This method is called once the rendering context is available. Use it to
     * initialize or bind any WebGL state such as shaders or buffer objects.
     * @param options that allow developers to restore the GL context.
     */
    onContextRestored({ gl }: google.maps.WebGLStateOptions): void;
    /**
     * This method is called when the rendering context is lost for any reason,
     * and is where you should clean up any pre-existing GL state, since it is
     * no longer needed.
     */
    onContextLost(): void;
    /**
     * Implement this method to draw WebGL content directly on the map. Note
     * that if the overlay needs a new frame drawn then call {@link
     * ThreeJSOverlayView.requestRedraw}.
     * @param options that allow developers to render content to an associated
     *     Google basemap.
     */
    onDraw({ gl, transformer }: google.maps.WebGLDrawOptions): void;
    /**
     * Convert coordinates from WGS84 Latitude Longitude to world-space
     * coordinates while taking the origin and orientation into account.
     */
    latLngAltitudeToVector3(position: LatLngTypes, target?: Vector3): Vector3;
    /**
     * Binds a View to a Model.
     */
    bindTo(key: string, target: google.maps.MVCObject, targetKey?: string, noNotify?: boolean): void;
    /**
     * Gets a value.
     */
    get(key: string): any;
    /**
     * Notify all observers of a change on this property. This notifies both
     * objects that are bound to the object's property as well as the object
     * that it is bound to.
     */
    notify(key: string): void;
    /**
     * Sets a value.
     */
    set(key: string, value: unknown): void;
    /**
     * Sets a collection of key-value pairs.
     */
    setValues(values?: object): void;
    /**
     * Removes a binding. Unbinding will set the unbound property to the current
     * value. The object will not be notified, as the value has not changed.
     */
    unbind(key: string): void;
    /**
     * Removes all bindings.
     */
    unbindAll(): void;
    /**
     * Creates lights (directional and hemisphere light) to illuminate the model
     * (roughly approximates the lighting of buildings in maps)
     */
    private initSceneLights;
}
