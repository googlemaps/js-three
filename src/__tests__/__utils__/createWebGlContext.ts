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

/**
 * Creates a mocked WebGL 1.0 context (based on the one provided by
 * the jest-webgl-canvas-mock package) three.js can work with.
 */
export function createWebGlContext() {
  const gl = new WebGLRenderingContext();
  const glParameters = {
    [gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS]: 8,
    [gl.VERSION]: "WebGL 1.0 (OpenGL ES 2.0 Chromium)",
    [gl.SCISSOR_BOX]: [0, 0, 100, 100],
    [gl.VIEWPORT]: [0, 0, 100, 100],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const glExtensions: Record<string, any> = {
    EXT_blend_minmax: {},
  };

  jest.spyOn(gl, "getContextAttributes").mockReturnValue({});
  jest.spyOn(gl, "getParameter").mockImplementation((key) => glParameters[key]);
  jest.spyOn(gl, "getShaderPrecisionFormat").mockImplementation(() => ({
    rangeMin: 127,
    rangeMax: 127,
    precision: 23,
  }));

  const getExtensionOrig = gl.getExtension;
  jest.spyOn(gl, "getExtension").mockImplementation((id) => {
    return glExtensions[id] || getExtensionOrig(id);
  });

  const canvas = document.createElement("canvas");
  canvas.width = 200;
  canvas.height = 100;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (gl as any).canvas = canvas;

  return gl;
}
