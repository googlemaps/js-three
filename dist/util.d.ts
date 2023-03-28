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
export type LatLngTypes = google.maps.LatLngLiteral | google.maps.LatLng | google.maps.LatLngAltitudeLiteral | google.maps.LatLngAltitude;
export declare const EARTH_RADIUS = 6371010;
export declare const WORLD_SIZE: number;
/**
 * Converts any of the supported position formats into the
 * google.maps.LatLngAltitudeLiteral format used for the calculations.
 * @param point
 */
export declare function toLatLngAltitudeLiteral(point: LatLngTypes): google.maps.LatLngAltitudeLiteral;
/**
 * Converts latitude and longitude to world space coordinates relative
 * to a reference location with y up.
 */
export declare function latLngToVector3Relative(point: google.maps.LatLngAltitudeLiteral, reference: google.maps.LatLngAltitudeLiteral, target?: Vector3): Vector3;
/**
 * Converts WGS84 latitude and longitude to (uncorrected) WebMercator meters.
 * (WGS84 --> WebMercator (EPSG:3857))
 */
export declare function latLngToXY(position: google.maps.LatLngLiteral): number[];
/**
 * Converts WebMercator meters to WGS84 latitude/longitude.
 * (WebMercator (EPSG:3857) --> WGS84)
 */
export declare function xyToLatLng(p: number[]): google.maps.LatLngLiteral;
