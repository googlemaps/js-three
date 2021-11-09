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

import { LatLng, initialize } from "@googlemaps/jest-mocks";
import {
  latLngToMeters,
  latLngToVector3,
  latLngToVector3Relative,
} from "./util";

beforeEach(() => {
  initialize();
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
  [new LatLng({ lng: 0, lat: 0 }), { x: 0, y: 0 }],
])("latLngToMeters is correct", (latLng, expected) => {
  const { x, y } = latLngToMeters(latLng);
  expect(x).toBeCloseTo(expected.x);
  expect(y).toBeCloseTo(expected.y);
});

test.each([
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
    { lng: 0, lat: -1 },
    { x: 0, y: -111200.74693490694 },
  ],
])("latLngToVector3 is correct", (latLng, projected) => {
  const vector = latLngToVector3(latLng);
  expect(vector.x).toBeCloseTo(projected.x);
  expect(vector.y).toBeCloseTo(0);
  expect(vector.z).toBeCloseTo(-projected.y);
});

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
      x: -111195.10117748393,
      y: 111200.74693490694,
    },
  },
  // 2 northeast of reference
  {
    latLng: { lat: 0, lng: 2 },
    reference: { lat: -1, lng: 1 },
    relative: {
      x: 111195.10117748393,
      y: 111200.74693490694,
    },
  },
  // 3 southeast of reference
  {
    latLng: { lat: -2, lng: 2 },
    reference: { lat: -1, lng: 1 },
    relative: {
      x: 111195.10117748393,
      y: -111234.63180200469,
    },
  },
  // 4 southwest of reference
  {
    latLng: { lat: -2, lng: 0 },
    reference: { lat: -1, lng: 1 },
    relative: {
      x: -111195.10117748393,
      y: -111234.63180200469,
    },
  },
  {
    latLng: { lat: 48.86116799396176, lng: 2.3241970462324497 }, // x: 258728.43168982657, y: 6251337.255028437
    reference: { lat: 48.86267605556572, lng: 2.3190953037457054 }, // x: 258160.50831404378, y: 6251592.434839309
    relative: {
      x: 567.288771994994,
      y: -254.89467016328126,
    },
  },
])(
  "latLngToVector3Relative is correct: %# %j",
  ({ latLng, reference, relative }) => {
    const vector = latLngToVector3Relative(latLng, reference);
    expect(vector.x).toBeCloseTo(relative.x);
    expect(vector.y).toBeCloseTo(0);
    expect(vector.z).toBeCloseTo(-relative.y);
  }
);
