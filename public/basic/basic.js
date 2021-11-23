import { S as Scene, P as PerspectiveCamera, W as WebGLRenderer, a as PCFSoftShadowMap, s as sRGBEncoding, V as Vector3, M as MathUtils, L as Loader, b as Mesh, B as BoxGeometry, c as MeshNormalMaterial } from './vendor-0c57447d.js';

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
 * Add a [three.js](https://threejs.org) scene as a [Google Maps WebglOverlayView](http://goo.gle/webgloverlayview-ref).
 *
 * **Note**: The scene will be rotated to a default up axis of (0, 1, 0) matching that of three.js.
 * *
 */
class ThreeJSOverlayView {
    constructor({ anchor = { lat: 0, lng: 0, altitude: 0 }, rotation = new Float32Array([0, 0, 0]), scale = new Float32Array([1, 1, 1]), scene = new Scene(), map, }) {
        this.overlay = new google.maps.WebglOverlayView();
        this.renderer = null;
        this.camera = null;
        this.anchor = anchor;
        this.rotation = rotation;
        this.scale = scale;
        this.scene = scene;
        // rotate scene consistent with y up in THREE
        this.scene.rotation.x = Math.PI / 2;
        this.overlay.onAdd = this.onAdd.bind(this);
        this.overlay.onRemove = this.onRemove.bind(this);
        this.overlay.onContextLost = this.onContextLost.bind(this);
        this.overlay.onContextRestored = this.onContextRestored.bind(this);
        this.overlay.onDraw = this.onDraw.bind(this);
        this.camera = new PerspectiveCamera();
        if (map) {
            this.setMap(map);
        }
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
    onContextRestored(gl) {
        this.renderer = new WebGLRenderer(Object.assign({ canvas: gl.canvas, context: gl }, gl.getContextAttributes()));
        this.renderer.autoClear = false;
        this.renderer.autoClearDepth = false;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = PCFSoftShadowMap;
        // LinearEncoding is default for historical reasons
        // https://discourse.threejs.org/t/linearencoding-vs-srgbencoding/23243
        this.renderer.outputEncoding = sRGBEncoding;
        const { width, height, clientWidth } = gl.canvas;
        this.renderer.setPixelRatio(width / clientWidth);
        this.renderer.setSize(width, height, false);
    }
    onContextLost() {
        if (!this.renderer) {
            return;
        }
        this.renderer.dispose();
        this.renderer = null;
    }
    onDraw(gl, transformer) {
        const { lat, lng, altitude } = this.anchor;
        this.camera.projectionMatrix.fromArray(transformer.fromLatLngAltitude({ lat, lng }, altitude, this.rotation, this.scale));
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
function toLatLngLiteral(latLng) {
    if (window.google && google.maps && latLng instanceof google.maps.LatLng) {
        return latLng.toJSON();
    }
    return latLng;
}
/**
 * Converts latitude and longitude to meters.
 */
function latLngToMeters(latLng) {
    latLng = toLatLngLiteral(latLng);
    const x = EARTH_RADIUS * MathUtils.degToRad(latLng.lng);
    const y = 0 -
        EARTH_RADIUS *
            Math.log(Math.tan(0.5 * (Math.PI * 0.5 - MathUtils.degToRad(latLng.lat))));
    return { x, y };
}
/**
 * Converts latitude and longitude to world space coordinates with y up.
 */
function latLngToVector3(point, target = new Vector3()) {
    const { x, y } = latLngToMeters(point);
    return target.set(x, 0, -y);
}

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
        lng: -122.34378755092621,
        lat: 47.607465080615476,
    },
    mapId: MAP_ID,
    zoom: 15,
    heading: 45,
    tilt: 67,
};
new Loader(LOADER_OPTIONS).load().then(() => {
    // instantiate the map
    const map = new google.maps.Map(document.getElementById("map"), mapOptions);
    // instantiate a ThreeJS Scene
    const scene = new Scene();
    // Create a box mesh
    const box = new Mesh(new BoxGeometry(10, 50, 10), new MeshNormalMaterial());
    // set position at center of map
    box.position.copy(latLngToVector3(mapOptions.center));
    // set position vertically
    box.position.setY(25);
    // add box mesh to the scene
    scene.add(box);
    // instantiate the ThreeJS Overlay with the scene and map
    new ThreeJSOverlayView({
        scene,
        map,
    });
    // rotate the box using requestAnimationFrame
    const animate = () => {
        box.rotateY(MathUtils.degToRad(0.1));
        requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
});
