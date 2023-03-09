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

import { MathUtils, Vector3 } from "three";

export type LatLngTypes =
  | google.maps.LatLngLiteral
  | google.maps.LatLng
  | google.maps.LatLngAltitudeLiteral
  | google.maps.LatLngAltitude;

// shorthands for math-functions, makes equations more readable
const { atan, cos, exp, log, tan, PI } = Math;
const { degToRad, radToDeg } = MathUtils;

export const EARTH_RADIUS = 6371010.0;
export const WORLD_SIZE = Math.PI * EARTH_RADIUS;

/**
 * Converts any of the supported position formats into the
 * google.maps.LatLngAltitudeLiteral format used for the calculations.
 * @param point
 */
export function toLatLngAltitudeLiteral(
  point: LatLngTypes
): google.maps.LatLngAltitudeLiteral {
  if (
    window.google &&
    google.maps &&
    (point instanceof google.maps.LatLng ||
      point instanceof google.maps.LatLngAltitude)
  ) {
    return { altitude: 0, ...point.toJSON() };
  }

  return { altitude: 0, ...(point as google.maps.LatLngLiteral) };
}

/**
 * Converts latitude and longitude to world space coordinates relative
 * to a reference location with y up.
 */
export function latLngToVector3Relative(
  point: google.maps.LatLngAltitudeLiteral,
  reference: google.maps.LatLngAltitudeLiteral,
  target = new Vector3()
) {
  const [px, py] = latLngToXY(point);
  const [rx, ry] = latLngToXY(reference);

  target.set(px - rx, py - ry, 0);

  // apply the spherical mercator scale-factor for the reference latitude
  target.multiplyScalar(cos(degToRad(reference.lat)));

  target.z = point.altitude - reference.altitude;

  return target;
}

/**
 * Converts WGS84 latitude and longitude to (uncorrected) WebMercator meters.
 * (WGS84 --> WebMercator (EPSG:3857))
 */
export function latLngToXY(position: google.maps.LatLngLiteral): number[] {
  return [
    EARTH_RADIUS * degToRad(position.lng),
    EARTH_RADIUS * log(tan(0.25 * PI + 0.5 * degToRad(position.lat))),
  ];
}

/**
 * Converts WebMercator meters to WGS84 latitude/longitude.
 * (WebMercator (EPSG:3857) --> WGS84)
 */
export function xyToLatLng(p: number[]): google.maps.LatLngLiteral {
  const [x, y] = p;

  return {
    lat: radToDeg(PI * 0.5 - 2.0 * atan(exp(-y / EARTH_RADIUS))),
    lng: radToDeg(x) / EARTH_RADIUS,
  };
}
