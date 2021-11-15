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

import html, { makeHtmlAttributes } from "@rollup/plugin-html";

import commonjs from '@rollup/plugin-commonjs';
import fs from "fs";
import jsonNodeResolve from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import path from "path";
import typescript from "@rollup/plugin-typescript";

const template = ({ attributes, files, meta, publicPath, title }) => {
  const scripts = (files.js || [])
    .map(({ fileName }) => {
      const attrs = makeHtmlAttributes(attributes.script);
      return `<script src="${publicPath}${fileName}"${attrs}></script>`;
    })
    .join("\n");

  const links = (files.css || [])
    .map(({ fileName }) => {
      const attrs = makeHtmlAttributes(attributes.link);
      return `<link href="${publicPath}${fileName}" rel="stylesheet"${attrs}>`;
    })
    .join("\n");

  const metas = meta
    .map((input) => {
      const attrs = makeHtmlAttributes(input);
      return `<meta${attrs}>`;
    })
    .join("\n");

  return `
<!doctype html>
<html${makeHtmlAttributes(attributes.html)}>
  <head>
    ${metas}
    <title>${title}</title>
    <style>
      #map, html, body {
        height: 100%;
        width: 100%;
        margin: 0;
      }
    </style>
    ${links}
  </head>
  <body>
    <div id="map"></div>
    ${scripts}
  </body>
</html>`;
};

const typescriptOptions = {
  tsconfigOverride: {
    compilerOptions: { declaration: false, noEmit: true },
    include: ["src/**/*", "examples/**/*"],
  },
};

const examples = fs
  .readdirSync(path.join(__dirname, "examples"))
  .filter((f) => f !== "config.ts")
  .map((f) => f.slice(0, f.length - 3));

export default examples.map((name) => ({
  input: `examples/${name}.ts`,
  plugins: [
    typescript(typescriptOptions),
    commonjs(),
    nodeResolve(),
    jsonNodeResolve(),
  ],
  output: {
    dir: `public/${name}`,
    sourcemap: false,
    plugins: [
      html({
        fileName: `index.html`,
        title: `@googlemaps/three: ${name}`,
        template,
      }),
    ],
    manualChunks: (id) => {
      if (id.includes("node_modules")) {
        return "vendor";
      }
    },
  },
}));
