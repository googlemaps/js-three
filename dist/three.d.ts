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
import { Scene } from "three";
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
 *
 * **Note**: The scene will be rotated to a default up axis of (0, 1, 0) matching that of three.js.
 * *
 */
export declare class ThreeJSOverlayView implements google.maps.WebglOverlayView {
    /**
     * See [[ThreeJSOverlayViewOptions.anchor]]
     */
    readonly anchor: LatLngAltitudeLiteral;
    /**
     * See [[ThreeJSOverlayViewOptions.scene]]
     */
    readonly scene: Scene;
    private camera;
    private renderer;
    private scale;
    private rotation;
    private overlay;
    constructor({ anchor, rotation, scale, scene, map, }: ThreeJSOverlayViewOptions);
    onAdd(): void;
    onRemove(): void;
    getMap(): google.maps.Map;
    requestRedraw(): void;
    setMap(map: google.maps.Map): void;
    addListener(eventName: string, handler: Function): google.maps.MapsEventListener;
    bindTo(key: string, target: google.maps.MVCObject, targetKey?: string, noNotify?: boolean): void;
    get(key: string): any;
    notify(key: string): void;
    set(key: string, value: any): void;
    setValues(values?: object): void;
    unbind(key: string): void;
    unbindAll(): void;
    onContextRestored(gl: WebGLRenderingContext): void;
    onContextLost(): void;
    onDraw(gl: WebGLRenderingContext, transformer: google.maps.CoordinateTransformer): void;
}
