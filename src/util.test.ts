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
])("latLngToVector3 is correct", (latLng, projected) => {
  const vector = latLngToVector3(latLng);
  expect(vector.x).toBeCloseTo(projected.x);
  expect(vector.y).toBeCloseTo(projected.y);
  expect(vector.z).toBeCloseTo(0);
});

test("latLngToVector3Relative is correct", () => {
  const relative = latLngToVector3Relative(
    { lat: 0, lng: 0 },
    { lat: 1, lng: 1 }
  );

  expect(relative.x).toBeCloseTo(-111195.10117748393);
  expect(relative.y).toBeCloseTo(-111200.74693490766);
  expect(relative.z).toBeCloseTo(0);
});
