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
/// <reference types="google.maps" />
import { Vector3 } from "three";
export declare const EARTH_RADIUS = 6371010;
export declare const WORLD_SIZE: number;
/**
 * Converts latitude and longitude to meters.
 */
export declare function latLngToMeters(latLng: google.maps.LatLngLiteral | google.maps.LatLng): {
    x: number;
    y: number;
};
/**
 * Converts latitude and longitude to world space coordinates with y up.
 */
export declare function latLngToVector3(point: google.maps.LatLngLiteral | google.maps.LatLng, target?: Vector3): Vector3;
/**
 * Converts latitude and longitude to world space coordinates relative
 * to a reference location with y up.
 */
export declare function latLngToVector3Relative(point: google.maps.LatLngLiteral | google.maps.LatLng, reference: google.maps.LatLngLiteral | google.maps.LatLng, target?: Vector3): Vector3;
