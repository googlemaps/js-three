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

export const EARTH_RADIUS = 6371010;
export const WORLD_SIZE = Math.PI * EARTH_RADIUS;

function toLatLngLiteral(
  latLng: google.maps.LatLngLiteral | google.maps.LatLng
): google.maps.LatLngLiteral {
  if (window.google && google.maps && latLng instanceof google.maps.LatLng) {
    return latLng.toJSON();
  }
  return latLng as google.maps.LatLngLiteral;
}

/**
 * Converts latitude and longitude to meters.
 */
export function latLngToMeters(
  latLng: google.maps.LatLngLiteral | google.maps.LatLng
): {
  x: number;
  y: number;
} {
  latLng = toLatLngLiteral(latLng);

  const x = EARTH_RADIUS * MathUtils.degToRad(latLng.lng);
  const y =
    0 -
    EARTH_RADIUS *
      Math.log(
        Math.tan(0.5 * (Math.PI * 0.5 - MathUtils.degToRad(latLng.lat)))
      );
  return { x, y };
}

/**
 * Converts latitude and longitude to world space coordinates with y up.
 */
export function latLngToVector3(
  point: google.maps.LatLngLiteral | google.maps.LatLng,
  target = new Vector3()
) {
  const { x, y } = latLngToMeters(point);

  return target.set(x, 0, -y);
}

/**
 * Converts latitude and longitude to world space coordinates relative
 * to a reference location with y up.
 */
export function latLngToVector3Relative(
  point: google.maps.LatLngLiteral | google.maps.LatLng,
  reference: google.maps.LatLngLiteral | google.maps.LatLng,
  target = new Vector3()
) {
  const p = latLngToVector3(point);
  const r = latLngToVector3(reference);

  target.setX(Math.abs(r.x - p.x) * Math.sign(p.x - r.x));
  target.setY(Math.abs(r.y - p.y) * Math.sign(p.y - r.y));
  target.setZ(Math.abs(r.z - p.z) * Math.sign(p.z - r.z));

  return target;
}
