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

import { initialize } from "@googlemaps/jest-mocks";
import { latLngToXY, latLngToVector3Relative } from "./util";

beforeEach(() => {
  initialize();

  // fixme: google.maps.LatLngAltitude is missing in the jest-mocks package,
  //   remove this when that's no longer the case.
  google.maps.LatLngAltitude = class LatLngAltitude
    implements google.maps.LatLngAltitude
  {
    public altitude = 0;
    public lat = 0;
    public lng = 0;

    constructor(
      value:
        | google.maps.LatLng
        | google.maps.LatLngLiteral
        | google.maps.LatLngAltitude
        | google.maps.LatLngAltitudeLiteral,
      noClampNoWrap = false
    ) {
      if (value instanceof google.maps.LatLng) {
        this.lat = value.lat();
        this.lng = value.lng();
      } else {
        this.lat = value.lat;
        this.lng = value.lng;
        this.altitude = (value as google.maps.LatLngAltitude).altitude || 0;
      }
    }

    public equals(other: google.maps.LatLngAltitude | null): boolean {
      return (
        this.altitude === other.altitude &&
        this.lat === other.lat &&
        this.lng === other.lng
      );
    }

    public toJSON(): google.maps.LatLngAltitudeLiteral {
      return { lat: this.lat, lng: this.lng, altitude: this.altitude };
    }
  };
});

test.each([
  [
    { lng: 0, lat: 0 },
    { x: 0, y: 0 },
  ],
  [
    { lng: -90, lat: 45 },
    { x: -10007559.105973555, y: 5615239.936637378 },
  ],
  [
    { lng: 90, lat: -45 },
    { x: 10007559.105973555, y: -5615239.936637378 },
  ],
  [
    { lng: 90, lat: 45 },
    { x: 10007559.105973555, y: 5615239.936637378 },
  ],
  [
    { lng: -90, lat: -45 },
    { x: -10007559.105973555, y: -5615239.936637378 },
  ],
  [
    { lng: 151.2093, lat: -33.8688 },
    { x: 16813733.4125, y: -4006716.49009 },
  ],
])(
  "latLngToXY is correct",
  (latLng: google.maps.LatLngLiteral, expected: { x: number; y: number }) => {
    const [x, y] = latLngToXY(latLng);
    expect(x).toBeCloseTo(expected.x);
    expect(y).toBeCloseTo(expected.y);
  }
);

test.each([
  // 0 same
  {
    latLng: { lat: 0, lng: 0 },
    reference: { lat: 0, lng: 0 },
    relative: { x: 0, y: 0 },
  },
  // 1 northwest of reference
  {
    latLng: { lat: 0, lng: 0 },
    reference: { lat: -1, lng: 1 },
    relative: {
      x: -111178.17,
      y: 111183.81,
    },
  },
  // 2 northeast of reference
  {
    latLng: { lat: 0, lng: 2 },
    reference: { lat: -1, lng: 1 },
    relative: {
      x: 111178.17,
      y: 111183.81,
    },
  },
  // 3 southeast of reference
  {
    latLng: { lat: -2, lng: 2 },
    reference: { lat: -1, lng: 1 },
    relative: {
      x: 111178.17,
      y: -111217.69,
    },
  },
  // 4 southwest of reference
  {
    latLng: { lat: -2, lng: 0 },
    reference: { lat: -1, lng: 1 },
    relative: {
      x: -111178.17,
      y: -111217.69,
    },
  },
  {
    latLng: { lat: 48.861168, lng: 2.324197 },
    reference: { lat: 48.862676, lng: 2.319095 },
    relative: {
      x: 373.22,
      y: -167.68,
    },
  },
])(
  "latLngToVector3Relative is correct: %# %j",
  ({ latLng, reference, relative }) => {
    const vector = latLngToVector3Relative(
      { ...latLng, altitude: 0 },
      { ...reference, altitude: 0 }
    );
    expect(vector.x).toBeCloseTo(relative.x, 2);
    expect(vector.y).toBeCloseTo(relative.y, 2);
    expect(vector.z).toBeCloseTo(0, 2);
  }
);
