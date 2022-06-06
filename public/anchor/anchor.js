import { L as Loader, S as Scene, A as AxesHelper, T as THREE } from './vendor-09ff1950.js';

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
const MAP_ID = "7b9a897acd0a63a4";
const LOADER_OPTIONS = {
    apiKey: "AIzaSyD8xiaVPWB02OeQkJOenLiJzdeUHzlhu00",
    version: "beta",
    libraries: [],
};

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
/**
 * Add a [three.js](https://threejs.org) scene as a [Google Maps WebGLOverlayView](http://goo.gle/WebGLOverlayView-ref).
 *
 * **Note**: The scene will be rotated to a default up axis of (0, 1, 0) matching that of three.js.
 * *
 */
class ThreeJSOverlayView {
    constructor({ anchor = { lat: 0, lng: 0, altitude: 0 }, rotation = new Float32Array([0, 0, 0]), scale = new Float32Array([1, 1, 1]), scene, THREE, map, }) {
        this.overlay = new google.maps.WebGLOverlayView();
        this.renderer = null;
        this.camera = null;
        this.anchor = anchor;
        this.rotation = rotation;
        this.scale = scale;
        this.THREE = THREE;
        this.scene = scene !== null && scene !== void 0 ? scene : new this.THREE.Scene();
        // rotate scene consistent with y up in THREE
        this.scene.rotation.x = Math.PI / 2;
        this.overlay.onAdd = this.onAdd.bind(this);
        this.overlay.onRemove = this.onRemove.bind(this);
        this.overlay.onContextLost = this.onContextLost.bind(this);
        this.overlay.onContextRestored = this.onContextRestored.bind(this);
        this.overlay.onDraw = this.onDraw.bind(this);
        this.camera = new this.THREE.PerspectiveCamera();
        if (map) {
            this.setMap(map);
        }
    }
    onStateUpdate(options) {
        this.overlay.onStateUpdate(options);
    }
    requestStateUpdate() {
        this.overlay.requestStateUpdate();
    }
    onAdd() { }
    onRemove() { }
    getMap() {
        return this.overlay.getMap();
    }
    requestRedraw() {
        this.overlay.requestRedraw();
    }
    setMap(map) {
        this.overlay.setMap(map);
    }
    addListener(eventName, handler) {
        return this.overlay.addListener(eventName, handler);
    }
    bindTo(key, target, targetKey, noNotify) {
        this.overlay.bindTo(key, target, targetKey, noNotify);
    }
    get(key) {
        return this.overlay.get(key);
    }
    notify(key) {
        this.overlay.notify(key);
    }
    set(key, value) {
        this.overlay.set(key, value);
    }
    setValues(values) {
        this.overlay.setValues(values);
    }
    unbind(key) {
        this.overlay.unbind(key);
    }
    unbindAll() {
        this.overlay.unbindAll();
    }
    onContextRestored({ gl }) {
        this.renderer = new this.THREE.WebGLRenderer(Object.assign({ canvas: gl.canvas, context: gl }, gl.getContextAttributes()));
        this.renderer.autoClear = false;
        this.renderer.autoClearDepth = false;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = this.THREE.PCFSoftShadowMap;
        // LinearEncoding is default for historical reasons
        // https://discourse.threejs.org/t/linearencoding-vs-srgbencoding/23243
        this.renderer.outputEncoding = this.THREE.sRGBEncoding;
        const { width, height } = gl.canvas;
        this.renderer.setViewport(0, 0, width, height);
    }
    onContextLost() {
        if (!this.renderer) {
            return;
        }
        this.renderer.dispose();
        this.renderer = null;
    }
    onDraw({ gl, transformer }) {
        this.camera.projectionMatrix.fromArray(transformer.fromLatLngAltitude(this.anchor, this.rotation, this.scale));
        gl.disable(gl.SCISSOR_TEST);
        this.requestRedraw();
        this.renderer.render(this.scene, this.camera);
        // reset state using renderer.resetState() and not renderer.state.reset()
        this.renderer.resetState();
    }
}

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
const EARTH_RADIUS = 6371010;
const WORLD_SIZE = Math.PI * EARTH_RADIUS;

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
const mapOptions = {
    center: {
        lat: 45,
        lng: 0,
    },
    mapId: MAP_ID,
    zoom: 5,
    heading: -45,
    tilt: 45,
};
new Loader(LOADER_OPTIONS).load().then(() => {
    const map = new google.maps.Map(document.getElementById("map"), mapOptions);
    const scene = new Scene();
    scene.add(new AxesHelper(WORLD_SIZE));
    // add ThreeJS Overlay view anchored to center of map
    new ThreeJSOverlayView({
        anchor: Object.assign(Object.assign({}, mapOptions.center), { altitude: 0 }),
        scene,
        map,
        THREE,
    });
});
