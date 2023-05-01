import { V as Vector3, M as MathUtils, Q as Quaternion, a as Matrix4, R as Raycaster, S as Scene, P as PerspectiveCamera, E as Euler, W as WebGLRenderer, b as PCFSoftShadowMap, s as sRGBEncoding, H as HemisphereLight, D as DirectionalLight, L as Loader, B as BoxGeometry, c as Mesh, d as MeshMatcapMaterial } from './vendor-da6f57c5.js';

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
// shorthands for math-functions, makes equations more readable
const { atan, cos, exp, log, tan, PI } = Math;
const { degToRad, radToDeg } = MathUtils;
const EARTH_RADIUS = 6371010.0;
/**
 * Converts any of the supported position formats into the
 * google.maps.LatLngAltitudeLiteral format used for the calculations.
 * @param point
 */
function toLatLngAltitudeLiteral(point) {
    if (window.google &&
        google.maps &&
        (point instanceof google.maps.LatLng ||
            point instanceof google.maps.LatLngAltitude)) {
        return { altitude: 0, ...point.toJSON() };
    }
    return { altitude: 0, ...point };
}
/**
 * Converts latitude and longitude to world space coordinates relative
 * to a reference location with y up.
 */
function latLngToVector3Relative(point, reference, target = new Vector3()) {
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
function latLngToXY(position) {
    return [
        EARTH_RADIUS * degToRad(position.lng),
        EARTH_RADIUS * log(tan(0.25 * PI + 0.5 * degToRad(position.lat))),
    ];
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
const DEFAULT_UP = new Vector3(0, 0, 1);
/* eslint-disable @typescript-eslint/no-empty-function */
/**
 * Add a [three.js](https://threejs.org) scene as a [Google Maps WebGLOverlayView](http://goo.gle/WebGLOverlayView-ref).
 */
class ThreeJSOverlayView {
    constructor(options = {}) {
        /** {@inheritDoc ThreeJSOverlayViewOptions.animationMode} */
        this.animationMode = "ondemand";
        this.rotationArray = new Float32Array(3);
        this.rotationInverse = new Quaternion();
        this.projectionMatrixInverse = new Matrix4();
        this.raycaster = new Raycaster();
        const { anchor = { lat: 0, lng: 0, altitude: 0 }, upAxis = "Z", scene, map, animationMode = "ondemand", addDefaultLighting = true, } = options;
        this.overlay = new google.maps.WebGLOverlayView();
        this.renderer = null;
        this.camera = null;
        this.animationMode = animationMode;
        this.setAnchor(anchor);
        this.setUpAxis(upAxis);
        this.scene = scene ?? new Scene();
        if (addDefaultLighting)
            this.initSceneLights();
        this.overlay.onAdd = this.onAdd.bind(this);
        this.overlay.onRemove = this.onRemove.bind(this);
        this.overlay.onContextLost = this.onContextLost.bind(this);
        this.overlay.onContextRestored = this.onContextRestored.bind(this);
        this.overlay.onStateUpdate = this.onStateUpdate.bind(this);
        this.overlay.onDraw = this.onDraw.bind(this);
        this.camera = new PerspectiveCamera();
        if (map) {
            this.setMap(map);
        }
    }
    /**
     * Sets the anchor-point.
     * @param anchor
     */
    setAnchor(anchor) {
        this.anchor = toLatLngAltitudeLiteral(anchor);
    }
    /**
     * Sets the axis to use as "up" in the scene.
     * @param axis
     */
    setUpAxis(axis) {
        const upVector = new Vector3(0, 0, 1);
        if (typeof axis !== "string") {
            upVector.copy(axis);
        }
        else {
            if (axis.toLowerCase() === "y") {
                upVector.set(0, 1, 0);
            }
            else if (axis.toLowerCase() !== "z") {
                console.warn(`invalid value '${axis}' specified as upAxis`);
            }
        }
        upVector.normalize();
        const q = new Quaternion();
        q.setFromUnitVectors(upVector, DEFAULT_UP);
        // inverse rotation is needed in latLngAltitudeToVector3()
        this.rotationInverse.copy(q).invert();
        // copy to rotationArray for transformer.fromLatLngAltitude()
        const euler = new Euler().setFromQuaternion(q, "XYZ");
        this.rotationArray[0] = MathUtils.radToDeg(euler.x);
        this.rotationArray[1] = MathUtils.radToDeg(euler.y);
        this.rotationArray[2] = MathUtils.radToDeg(euler.z);
    }
    // implemetation
    raycast(p, optionsOrObjects, options = {}) {
        let objects;
        if (Array.isArray(optionsOrObjects)) {
            objects = optionsOrObjects || null;
        }
        else {
            objects = [this.scene];
            options = { ...optionsOrObjects, recursive: true };
        }
        const { updateMatrix = true, recursive = false, raycasterParameters, } = options;
        // when `raycast()` is called from within the `onBeforeRender()` callback,
        // the mvp-matrix for this frame has already been computed and stored in
        // `this.camera.projectionMatrix`.
        // The mvp-matrix transforms world-space meters to clip-space
        // coordinates. The inverse matrix created here does the exact opposite
        // and converts clip-space coordinates to world-space.
        if (updateMatrix) {
            this.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();
        }
        // create two points (with different depth) from the mouse-position and
        // convert them into world-space coordinates to set up the ray.
        this.raycaster.ray.origin
            .set(p.x, p.y, 0)
            .applyMatrix4(this.projectionMatrixInverse);
        this.raycaster.ray.direction
            .set(p.x, p.y, 0.5)
            .applyMatrix4(this.projectionMatrixInverse)
            .sub(this.raycaster.ray.origin)
            .normalize();
        // back up the raycaster parameters
        const oldRaycasterParams = this.raycaster.params;
        if (raycasterParameters) {
            this.raycaster.params = raycasterParameters;
        }
        const results = this.raycaster.intersectObjects(objects, recursive);
        // reset raycaster params to whatever they were before
        this.raycaster.params = oldRaycasterParams;
        return results;
    }
    /**
     * Overwrite this method to handle any GL state updates outside the
     * render animation frame.
     * @param options
     */
    onStateUpdate(options) { }
    /**
     * Overwrite this method to fetch or create intermediate data structures
     * before the overlay is drawn that don’t require immediate access to the
     * WebGL rendering context.
     */
    onAdd() { }
    /**
     * Overwrite this method to update your scene just before a new frame is
     * drawn.
     */
    onBeforeDraw() { }
    /**
     * This method is called when the overlay is removed from the map with
     * `overlay.setMap(null)`, and is where you can remove all intermediate
     * objects created in onAdd.
     */
    onRemove() { }
    /**
     * Triggers the map to update GL state.
     */
    requestStateUpdate() {
        this.overlay.requestStateUpdate();
    }
    /**
     * Triggers the map to redraw a frame.
     */
    requestRedraw() {
        this.overlay.requestRedraw();
    }
    /**
     * Returns the map the overlay is added to.
     */
    getMap() {
        return this.overlay.getMap();
    }
    /**
     * Adds the overlay to the map.
     * @param map The map to access the div, model and view state.
     */
    setMap(map) {
        this.overlay.setMap(map);
    }
    /**
     * Adds the given listener function to the given event name. Returns an
     * identifier for this listener that can be used with
     * <code>google.maps.event.removeListener</code>.
     */
    addListener(eventName, handler) {
        return this.overlay.addListener(eventName, handler);
    }
    /**
     * This method is called once the rendering context is available. Use it to
     * initialize or bind any WebGL state such as shaders or buffer objects.
     * @param options that allow developers to restore the GL context.
     */
    onContextRestored({ gl }) {
        this.renderer = new WebGLRenderer({
            canvas: gl.canvas,
            context: gl,
            ...gl.getContextAttributes(),
        });
        this.renderer.autoClear = false;
        this.renderer.autoClearDepth = false;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = PCFSoftShadowMap;
        // LinearEncoding is default for historical reasons
        // https://discourse.threejs.org/t/linearencoding-vs-srgbencoding/23243
        this.renderer.outputEncoding = sRGBEncoding;
        const { width, height } = gl.canvas;
        this.renderer.setViewport(0, 0, width, height);
    }
    /**
     * This method is called when the rendering context is lost for any reason,
     * and is where you should clean up any pre-existing GL state, since it is
     * no longer needed.
     */
    onContextLost() {
        if (!this.renderer) {
            return;
        }
        this.renderer.dispose();
        this.renderer = null;
    }
    /**
     * Implement this method to draw WebGL content directly on the map. Note
     * that if the overlay needs a new frame drawn then call {@link
     * ThreeJSOverlayView.requestRedraw}.
     * @param options that allow developers to render content to an associated
     *     Google basemap.
     */
    onDraw({ gl, transformer }) {
        this.camera.projectionMatrix.fromArray(transformer.fromLatLngAltitude(this.anchor, this.rotationArray));
        gl.disable(gl.SCISSOR_TEST);
        this.onBeforeDraw();
        this.renderer.render(this.scene, this.camera);
        this.renderer.resetState();
        if (this.animationMode === "always")
            this.requestRedraw();
    }
    /**
     * Convert coordinates from WGS84 Latitude Longitude to world-space
     * coordinates while taking the origin and orientation into account.
     */
    latLngAltitudeToVector3(position, target = new Vector3()) {
        latLngToVector3Relative(toLatLngAltitudeLiteral(position), this.anchor, target);
        target.applyQuaternion(this.rotationInverse);
        return target;
    }
    // MVCObject interface forwarded to the overlay
    /**
     * Binds a View to a Model.
     */
    bindTo(key, target, targetKey, noNotify) {
        this.overlay.bindTo(key, target, targetKey, noNotify);
    }
    /**
     * Gets a value.
     */
    get(key) {
        return this.overlay.get(key);
    }
    /**
     * Notify all observers of a change on this property. This notifies both
     * objects that are bound to the object's property as well as the object
     * that it is bound to.
     */
    notify(key) {
        this.overlay.notify(key);
    }
    /**
     * Sets a value.
     */
    set(key, value) {
        this.overlay.set(key, value);
    }
    /**
     * Sets a collection of key-value pairs.
     */
    setValues(values) {
        this.overlay.setValues(values);
    }
    /**
     * Removes a binding. Unbinding will set the unbound property to the current
     * value. The object will not be notified, as the value has not changed.
     */
    unbind(key) {
        this.overlay.unbind(key);
    }
    /**
     * Removes all bindings.
     */
    unbindAll() {
        this.overlay.unbindAll();
    }
    /**
     * Creates lights (directional and hemisphere light) to illuminate the model
     * (roughly approximates the lighting of buildings in maps)
     */
    initSceneLights() {
        const hemiLight = new HemisphereLight(0xffffff, 0x444444, 1);
        hemiLight.position.set(0, -0.2, 1).normalize();
        const dirLight = new DirectionalLight(0xffffff);
        dirLight.position.set(0, 10, 100);
        this.scene.add(hemiLight, dirLight);
    }
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
        lng: 0,
        lat: 0,
    },
    mapId: MAP_ID,
    zoom: 4,
    tilt: 67,
};
new Loader(LOADER_OPTIONS).load().then(() => {
    // create the map and overlay
    const map = new google.maps.Map(document.getElementById("map"), mapOptions);
    const overlay = new ThreeJSOverlayView({ map });
    [
        { lat: 45, lng: -90 },
        { lat: 45, lng: 90 },
        { lat: -45, lng: -90 },
        { lat: -45, lng: 90 },
    ].forEach((latLng) => {
        // create a box mesh with origin on the ground, in z-up orientation
        const geometry = new BoxGeometry(10, 50, 10)
            .translate(0, 25, 0)
            .rotateX(Math.PI / 2);
        const box = new Mesh(geometry, new MeshMatcapMaterial());
        // make it huge
        box.scale.multiplyScalar(10000);
        // set position at center of map
        overlay.latLngAltitudeToVector3(latLng, box.position);
        // add box mesh to the scene
        overlay.scene.add(box);
    });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVtaXNwaGVyZXMuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2V4YW1wbGVzL2NvbmZpZy50cyIsIi4uLy4uL3NyYy91dGlsLnRzIiwiLi4vLi4vc3JjL3RocmVlLnRzIiwiLi4vLi4vZXhhbXBsZXMvaGVtaXNwaGVyZXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgMjAyMSBHb29nbGUgTExDXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgeyBMb2FkZXJPcHRpb25zIH0gZnJvbSBcIkBnb29nbGVtYXBzL2pzLWFwaS1sb2FkZXJcIjtcblxuZXhwb3J0IGNvbnN0IE1BUF9JRCA9IFwiN2I5YTg5N2FjZDBhNjNhNFwiO1xuXG5leHBvcnQgY29uc3QgTE9BREVSX09QVElPTlM6IExvYWRlck9wdGlvbnMgPSB7XG4gIGFwaUtleTogXCJBSXphU3lEOHhpYVZQV0IwMk9lUWtKT2VuTGlKemRlVUh6bGh1MDBcIixcbiAgdmVyc2lvbjogXCJiZXRhXCIsXG4gIGxpYnJhcmllczogW10sXG59O1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgMjAyMSBHb29nbGUgTExDLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHsgTWF0aFV0aWxzLCBWZWN0b3IzIH0gZnJvbSBcInRocmVlXCI7XG5cbmV4cG9ydCB0eXBlIExhdExuZ1R5cGVzID1cbiAgfCBnb29nbGUubWFwcy5MYXRMbmdMaXRlcmFsXG4gIHwgZ29vZ2xlLm1hcHMuTGF0TG5nXG4gIHwgZ29vZ2xlLm1hcHMuTGF0TG5nQWx0aXR1ZGVMaXRlcmFsXG4gIHwgZ29vZ2xlLm1hcHMuTGF0TG5nQWx0aXR1ZGU7XG5cbi8vIHNob3J0aGFuZHMgZm9yIG1hdGgtZnVuY3Rpb25zLCBtYWtlcyBlcXVhdGlvbnMgbW9yZSByZWFkYWJsZVxuY29uc3QgeyBhdGFuLCBjb3MsIGV4cCwgbG9nLCB0YW4sIFBJIH0gPSBNYXRoO1xuY29uc3QgeyBkZWdUb1JhZCwgcmFkVG9EZWcgfSA9IE1hdGhVdGlscztcblxuZXhwb3J0IGNvbnN0IEVBUlRIX1JBRElVUyA9IDYzNzEwMTAuMDtcbmV4cG9ydCBjb25zdCBXT1JMRF9TSVpFID0gTWF0aC5QSSAqIEVBUlRIX1JBRElVUztcblxuLyoqXG4gKiBDb252ZXJ0cyBhbnkgb2YgdGhlIHN1cHBvcnRlZCBwb3NpdGlvbiBmb3JtYXRzIGludG8gdGhlXG4gKiBnb29nbGUubWFwcy5MYXRMbmdBbHRpdHVkZUxpdGVyYWwgZm9ybWF0IHVzZWQgZm9yIHRoZSBjYWxjdWxhdGlvbnMuXG4gKiBAcGFyYW0gcG9pbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvTGF0TG5nQWx0aXR1ZGVMaXRlcmFsKFxuICBwb2ludDogTGF0TG5nVHlwZXNcbik6IGdvb2dsZS5tYXBzLkxhdExuZ0FsdGl0dWRlTGl0ZXJhbCB7XG4gIGlmIChcbiAgICB3aW5kb3cuZ29vZ2xlICYmXG4gICAgZ29vZ2xlLm1hcHMgJiZcbiAgICAocG9pbnQgaW5zdGFuY2VvZiBnb29nbGUubWFwcy5MYXRMbmcgfHxcbiAgICAgIHBvaW50IGluc3RhbmNlb2YgZ29vZ2xlLm1hcHMuTGF0TG5nQWx0aXR1ZGUpXG4gICkge1xuICAgIHJldHVybiB7IGFsdGl0dWRlOiAwLCAuLi5wb2ludC50b0pTT04oKSB9O1xuICB9XG5cbiAgcmV0dXJuIHsgYWx0aXR1ZGU6IDAsIC4uLihwb2ludCBhcyBnb29nbGUubWFwcy5MYXRMbmdMaXRlcmFsKSB9O1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGxhdGl0dWRlIGFuZCBsb25naXR1ZGUgdG8gd29ybGQgc3BhY2UgY29vcmRpbmF0ZXMgcmVsYXRpdmVcbiAqIHRvIGEgcmVmZXJlbmNlIGxvY2F0aW9uIHdpdGggeSB1cC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxhdExuZ1RvVmVjdG9yM1JlbGF0aXZlKFxuICBwb2ludDogZ29vZ2xlLm1hcHMuTGF0TG5nQWx0aXR1ZGVMaXRlcmFsLFxuICByZWZlcmVuY2U6IGdvb2dsZS5tYXBzLkxhdExuZ0FsdGl0dWRlTGl0ZXJhbCxcbiAgdGFyZ2V0ID0gbmV3IFZlY3RvcjMoKVxuKSB7XG4gIGNvbnN0IFtweCwgcHldID0gbGF0TG5nVG9YWShwb2ludCk7XG4gIGNvbnN0IFtyeCwgcnldID0gbGF0TG5nVG9YWShyZWZlcmVuY2UpO1xuXG4gIHRhcmdldC5zZXQocHggLSByeCwgcHkgLSByeSwgMCk7XG5cbiAgLy8gYXBwbHkgdGhlIHNwaGVyaWNhbCBtZXJjYXRvciBzY2FsZS1mYWN0b3IgZm9yIHRoZSByZWZlcmVuY2UgbGF0aXR1ZGVcbiAgdGFyZ2V0Lm11bHRpcGx5U2NhbGFyKGNvcyhkZWdUb1JhZChyZWZlcmVuY2UubGF0KSkpO1xuXG4gIHRhcmdldC56ID0gcG9pbnQuYWx0aXR1ZGUgLSByZWZlcmVuY2UuYWx0aXR1ZGU7XG5cbiAgcmV0dXJuIHRhcmdldDtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBXR1M4NCBsYXRpdHVkZSBhbmQgbG9uZ2l0dWRlIHRvICh1bmNvcnJlY3RlZCkgV2ViTWVyY2F0b3IgbWV0ZXJzLlxuICogKFdHUzg0IC0tPiBXZWJNZXJjYXRvciAoRVBTRzozODU3KSlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxhdExuZ1RvWFkocG9zaXRpb246IGdvb2dsZS5tYXBzLkxhdExuZ0xpdGVyYWwpOiBudW1iZXJbXSB7XG4gIHJldHVybiBbXG4gICAgRUFSVEhfUkFESVVTICogZGVnVG9SYWQocG9zaXRpb24ubG5nKSxcbiAgICBFQVJUSF9SQURJVVMgKiBsb2codGFuKDAuMjUgKiBQSSArIDAuNSAqIGRlZ1RvUmFkKHBvc2l0aW9uLmxhdCkpKSxcbiAgXTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBXZWJNZXJjYXRvciBtZXRlcnMgdG8gV0dTODQgbGF0aXR1ZGUvbG9uZ2l0dWRlLlxuICogKFdlYk1lcmNhdG9yIChFUFNHOjM4NTcpIC0tPiBXR1M4NClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHh5VG9MYXRMbmcocDogbnVtYmVyW10pOiBnb29nbGUubWFwcy5MYXRMbmdMaXRlcmFsIHtcbiAgY29uc3QgW3gsIHldID0gcDtcblxuICByZXR1cm4ge1xuICAgIGxhdDogcmFkVG9EZWcoUEkgKiAwLjUgLSAyLjAgKiBhdGFuKGV4cCgteSAvIEVBUlRIX1JBRElVUykpKSxcbiAgICBsbmc6IHJhZFRvRGVnKHgpIC8gRUFSVEhfUkFESVVTLFxuICB9O1xufVxuIiwiLyoqXG4gKiBDb3B5cmlnaHQgMjAyMSBHb29nbGUgTExDXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQge1xuICBEaXJlY3Rpb25hbExpZ2h0LFxuICBFdWxlcixcbiAgSGVtaXNwaGVyZUxpZ2h0LFxuICBJbnRlcnNlY3Rpb24sXG4gIE1hdGhVdGlscyxcbiAgTWF0cml4NCxcbiAgT2JqZWN0M0QsXG4gIFBDRlNvZnRTaGFkb3dNYXAsXG4gIFBlcnNwZWN0aXZlQ2FtZXJhLFxuICBRdWF0ZXJuaW9uLFxuICBSYXljYXN0ZXIsXG4gIFJheWNhc3RlclBhcmFtZXRlcnMsXG4gIFNjZW5lLFxuICBzUkdCRW5jb2RpbmcsXG4gIFZlY3RvcjIsXG4gIFZlY3RvcjMsXG4gIFdlYkdMUmVuZGVyZXIsXG59IGZyb20gXCJ0aHJlZVwiO1xuaW1wb3J0IHsgbGF0TG5nVG9WZWN0b3IzUmVsYXRpdmUsIHRvTGF0TG5nQWx0aXR1ZGVMaXRlcmFsIH0gZnJvbSBcIi4vdXRpbFwiO1xuXG5pbXBvcnQgdHlwZSB7IExhdExuZ1R5cGVzIH0gZnJvbSBcIi4vdXRpbFwiO1xuXG5jb25zdCBERUZBVUxUX1VQID0gbmV3IFZlY3RvcjMoMCwgMCwgMSk7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmF5Y2FzdE9wdGlvbnMge1xuICAvKipcbiAgICogU2V0IHRvIHRydWUgdG8gYWxzbyB0ZXN0IGNoaWxkcmVuIG9mIHRoZSBzcGVjaWZpZWQgb2JqZWN0cyBmb3JcbiAgICogaW50ZXJzZWN0aW9ucy5cbiAgICpcbiAgICogQGRlZmF1bHQgZmFsc2VcbiAgICovXG4gIHJlY3Vyc2l2ZT86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgaW52ZXJzZS1wcm9qZWN0aW9uLW1hdHJpeCBiZWZvcmUgY2FzdGluZyB0aGUgcmF5IChzZXQgdGhpc1xuICAgKiB0byBmYWxzZSBpZiB5b3UgbmVlZCB0byBydW4gbXVsdGlwbGUgcmF5Y2FzdHMgZm9yIHRoZSBzYW1lIGZyYW1lKS5cbiAgICpcbiAgICogQGRlZmF1bHQgdHJ1ZVxuICAgKi9cbiAgdXBkYXRlTWF0cml4PzogYm9vbGVhbjtcblxuICAvKipcbiAgICogQWRkaXRpb25hbCBwYXJhbWV0ZXJzIHRvIHBhc3MgdG8gdGhlIHRocmVlLmpzIHJheWNhc3Rlci5cbiAgICpcbiAgICogQHNlZSBodHRwczovL3RocmVlanMub3JnL2RvY3MvI2FwaS9lbi9jb3JlL1JheWNhc3Rlci5wYXJhbXNcbiAgICovXG4gIHJheWNhc3RlclBhcmFtZXRlcnM/OiBSYXljYXN0ZXJQYXJhbWV0ZXJzO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRocmVlSlNPdmVybGF5Vmlld09wdGlvbnMge1xuICAvKipcbiAgICogVGhlIGFuY2hvciBmb3IgdGhlIHNjZW5lLlxuICAgKlxuICAgKiBAZGVmYXVsdCB7bGF0OiAwLCBsbmc6IDAsIGFsdGl0dWRlOiAwfVxuICAgKi9cbiAgYW5jaG9yPzogTGF0TG5nVHlwZXM7XG5cbiAgLyoqXG4gICAqIFRoZSBheGlzIHBvaW50aW5nIHVwIGluIHRoZSBzY2VuZS4gQ2FuIGJlIHNwZWNpZmllZCBhcyBcIlpcIiwgXCJZXCIgb3IgYVxuICAgKiBWZWN0b3IzLCBpbiB3aGljaCBjYXNlIHRoZSBub3JtYWxpemVkIHZlY3RvciB3aWxsIGJlY29tZSB0aGUgdXAtYXhpcy5cbiAgICpcbiAgICogQGRlZmF1bHQgXCJaXCJcbiAgICovXG4gIHVwQXhpcz86IFwiWlwiIHwgXCJZXCIgfCBWZWN0b3IzO1xuXG4gIC8qKlxuICAgKiBUaGUgbWFwIHRoZSBvdmVybGF5IHdpbGwgYmUgYWRkZWQgdG8uXG4gICAqIENhbiBiZSBzZXQgYXQgaW5pdGlhbGl6YXRpb24gb3IgYnkgY2FsbGluZyBgc2V0TWFwKG1hcClgLlxuICAgKi9cbiAgbWFwPzogZ29vZ2xlLm1hcHMuTWFwO1xuXG4gIC8qKlxuICAgKiBUaGUgc2NlbmUgb2JqZWN0IHRvIHJlbmRlciBpbiB0aGUgb3ZlcmxheS4gSWYgbm8gc2NlbmUgaXMgc3BlY2lmaWVkLCBhXG4gICAqIG5ldyBzY2VuZSBpcyBjcmVhdGVkIGFuZCBjYW4gYmUgYWNjZXNzZWQgdmlhIGBvdmVybGF5LnNjZW5lYC5cbiAgICovXG4gIHNjZW5lPzogU2NlbmU7XG5cbiAgLyoqXG4gICAqIFRoZSBhbmltYXRpb24gbW9kZSBjb250cm9scyB3aGVuIHRoZSBvdmVybGF5IHdpbGwgcmVkcmF3LCBlaXRoZXJcbiAgICogY29udGludW91c2x5IChgYWx3YXlzYCkgb3Igb24gZGVtYW5kIChgb25kZW1hbmRgKS4gV2hlbiB1c2luZyB0aGVcbiAgICogb24gZGVtYW5kIG1vZGUsIHRoZSBvdmVybGF5IHdpbGwgcmUtcmVuZGVyIHdoZW5ldmVyIHRoZSBtYXAgcmVuZGVyc1xuICAgKiAoY2FtZXJhIG1vdmVtZW50cykgb3Igd2hlbiBgcmVxdWVzdFJlZHJhdygpYCBpcyBjYWxsZWQuXG4gICAqXG4gICAqIFRvIGFjaGlldmUgYW5pbWF0aW9ucyBpbiB0aGlzIG1vZGUsIHlvdSBjYW4gZWl0aGVyIHVzZSBhbiBvdXRzaWRlXG4gICAqIGFuaW1hdGlvbi1sb29wIHRoYXQgY2FsbHMgYHJlcXVlc3RSZWRyYXcoKWAgYXMgbG9uZyBhcyBuZWVkZWQgb3IgY2FsbFxuICAgKiBgcmVxdWVzdFJlZHJhdygpYCBmcm9tIHdpdGhpbiB0aGUgYG9uQmVmb3JlUmVuZGVyYCBmdW5jdGlvbiB0b1xuICAgKlxuICAgKiBAZGVmYXVsdCBcIm9uZGVtYW5kXCJcbiAgICovXG4gIGFuaW1hdGlvbk1vZGU/OiBcImFsd2F5c1wiIHwgXCJvbmRlbWFuZFwiO1xuXG4gIC8qKlxuICAgKiBBZGQgZGVmYXVsdCBsaWdodGluZyB0byB0aGUgc2NlbmUuXG4gICAqIEBkZWZhdWx0IHRydWVcbiAgICovXG4gIGFkZERlZmF1bHRMaWdodGluZz86IGJvb2xlYW47XG59XG5cbi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uby1lbXB0eS1mdW5jdGlvbiAqL1xuXG4vKipcbiAqIEFkZCBhIFt0aHJlZS5qc10oaHR0cHM6Ly90aHJlZWpzLm9yZykgc2NlbmUgYXMgYSBbR29vZ2xlIE1hcHMgV2ViR0xPdmVybGF5Vmlld10oaHR0cDovL2dvby5nbGUvV2ViR0xPdmVybGF5Vmlldy1yZWYpLlxuICovXG5leHBvcnQgY2xhc3MgVGhyZWVKU092ZXJsYXlWaWV3IGltcGxlbWVudHMgZ29vZ2xlLm1hcHMuV2ViR0xPdmVybGF5VmlldyB7XG4gIC8qKiB7QGluaGVyaXREb2MgVGhyZWVKU092ZXJsYXlWaWV3T3B0aW9ucy5zY2VuZX0gKi9cbiAgcHVibGljIHJlYWRvbmx5IHNjZW5lOiBTY2VuZTtcblxuICAvKioge0Bpbmhlcml0RG9jIFRocmVlSlNPdmVybGF5Vmlld09wdGlvbnMuYW5pbWF0aW9uTW9kZX0gKi9cbiAgcHVibGljIGFuaW1hdGlvbk1vZGU6IFwiYWx3YXlzXCIgfCBcIm9uZGVtYW5kXCIgPSBcIm9uZGVtYW5kXCI7XG5cbiAgLyoqIHtAaW5oZXJpdERvYyBUaHJlZUpTT3ZlcmxheVZpZXdPcHRpb25zLmFuY2hvcn0gKi9cbiAgcHJvdGVjdGVkIGFuY2hvcjogZ29vZ2xlLm1hcHMuTGF0TG5nQWx0aXR1ZGVMaXRlcmFsO1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgY2FtZXJhOiBQZXJzcGVjdGl2ZUNhbWVyYTtcbiAgcHJvdGVjdGVkIHJlYWRvbmx5IHJvdGF0aW9uQXJyYXk6IEZsb2F0MzJBcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG4gIHByb3RlY3RlZCByZWFkb25seSByb3RhdGlvbkludmVyc2U6IFF1YXRlcm5pb24gPSBuZXcgUXVhdGVybmlvbigpO1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgcHJvamVjdGlvbk1hdHJpeEludmVyc2UgPSBuZXcgTWF0cml4NCgpO1xuXG4gIHByb3RlY3RlZCByZWFkb25seSBvdmVybGF5OiBnb29nbGUubWFwcy5XZWJHTE92ZXJsYXlWaWV3O1xuICBwcm90ZWN0ZWQgcmVuZGVyZXI6IFdlYkdMUmVuZGVyZXI7XG4gIHByb3RlY3RlZCByYXljYXN0ZXI6IFJheWNhc3RlciA9IG5ldyBSYXljYXN0ZXIoKTtcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBUaHJlZUpTT3ZlcmxheVZpZXdPcHRpb25zID0ge30pIHtcbiAgICBjb25zdCB7XG4gICAgICBhbmNob3IgPSB7IGxhdDogMCwgbG5nOiAwLCBhbHRpdHVkZTogMCB9LFxuICAgICAgdXBBeGlzID0gXCJaXCIsXG4gICAgICBzY2VuZSxcbiAgICAgIG1hcCxcbiAgICAgIGFuaW1hdGlvbk1vZGUgPSBcIm9uZGVtYW5kXCIsXG4gICAgICBhZGREZWZhdWx0TGlnaHRpbmcgPSB0cnVlLFxuICAgIH0gPSBvcHRpb25zO1xuXG4gICAgdGhpcy5vdmVybGF5ID0gbmV3IGdvb2dsZS5tYXBzLldlYkdMT3ZlcmxheVZpZXcoKTtcbiAgICB0aGlzLnJlbmRlcmVyID0gbnVsbDtcbiAgICB0aGlzLmNhbWVyYSA9IG51bGw7XG4gICAgdGhpcy5hbmltYXRpb25Nb2RlID0gYW5pbWF0aW9uTW9kZTtcblxuICAgIHRoaXMuc2V0QW5jaG9yKGFuY2hvcik7XG4gICAgdGhpcy5zZXRVcEF4aXModXBBeGlzKTtcblxuICAgIHRoaXMuc2NlbmUgPSBzY2VuZSA/PyBuZXcgU2NlbmUoKTtcbiAgICBpZiAoYWRkRGVmYXVsdExpZ2h0aW5nKSB0aGlzLmluaXRTY2VuZUxpZ2h0cygpO1xuXG4gICAgdGhpcy5vdmVybGF5Lm9uQWRkID0gdGhpcy5vbkFkZC5iaW5kKHRoaXMpO1xuICAgIHRoaXMub3ZlcmxheS5vblJlbW92ZSA9IHRoaXMub25SZW1vdmUuYmluZCh0aGlzKTtcbiAgICB0aGlzLm92ZXJsYXkub25Db250ZXh0TG9zdCA9IHRoaXMub25Db250ZXh0TG9zdC5iaW5kKHRoaXMpO1xuICAgIHRoaXMub3ZlcmxheS5vbkNvbnRleHRSZXN0b3JlZCA9IHRoaXMub25Db250ZXh0UmVzdG9yZWQuYmluZCh0aGlzKTtcbiAgICB0aGlzLm92ZXJsYXkub25TdGF0ZVVwZGF0ZSA9IHRoaXMub25TdGF0ZVVwZGF0ZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMub3ZlcmxheS5vbkRyYXcgPSB0aGlzLm9uRHJhdy5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5jYW1lcmEgPSBuZXcgUGVyc3BlY3RpdmVDYW1lcmEoKTtcblxuICAgIGlmIChtYXApIHtcbiAgICAgIHRoaXMuc2V0TWFwKG1hcCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGFuY2hvci1wb2ludC5cbiAgICogQHBhcmFtIGFuY2hvclxuICAgKi9cbiAgcHVibGljIHNldEFuY2hvcihhbmNob3I6IExhdExuZ1R5cGVzKSB7XG4gICAgdGhpcy5hbmNob3IgPSB0b0xhdExuZ0FsdGl0dWRlTGl0ZXJhbChhbmNob3IpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGF4aXMgdG8gdXNlIGFzIFwidXBcIiBpbiB0aGUgc2NlbmUuXG4gICAqIEBwYXJhbSBheGlzXG4gICAqL1xuICBwdWJsaWMgc2V0VXBBeGlzKGF4aXM6IFwiWVwiIHwgXCJaXCIgfCBWZWN0b3IzKTogdm9pZCB7XG4gICAgY29uc3QgdXBWZWN0b3IgPSBuZXcgVmVjdG9yMygwLCAwLCAxKTtcbiAgICBpZiAodHlwZW9mIGF4aXMgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHVwVmVjdG9yLmNvcHkoYXhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChheGlzLnRvTG93ZXJDYXNlKCkgPT09IFwieVwiKSB7XG4gICAgICAgIHVwVmVjdG9yLnNldCgwLCAxLCAwKTtcbiAgICAgIH0gZWxzZSBpZiAoYXhpcy50b0xvd2VyQ2FzZSgpICE9PSBcInpcIikge1xuICAgICAgICBjb25zb2xlLndhcm4oYGludmFsaWQgdmFsdWUgJyR7YXhpc30nIHNwZWNpZmllZCBhcyB1cEF4aXNgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB1cFZlY3Rvci5ub3JtYWxpemUoKTtcblxuICAgIGNvbnN0IHEgPSBuZXcgUXVhdGVybmlvbigpO1xuICAgIHEuc2V0RnJvbVVuaXRWZWN0b3JzKHVwVmVjdG9yLCBERUZBVUxUX1VQKTtcblxuICAgIC8vIGludmVyc2Ugcm90YXRpb24gaXMgbmVlZGVkIGluIGxhdExuZ0FsdGl0dWRlVG9WZWN0b3IzKClcbiAgICB0aGlzLnJvdGF0aW9uSW52ZXJzZS5jb3B5KHEpLmludmVydCgpO1xuXG4gICAgLy8gY29weSB0byByb3RhdGlvbkFycmF5IGZvciB0cmFuc2Zvcm1lci5mcm9tTGF0TG5nQWx0aXR1ZGUoKVxuICAgIGNvbnN0IGV1bGVyID0gbmV3IEV1bGVyKCkuc2V0RnJvbVF1YXRlcm5pb24ocSwgXCJYWVpcIik7XG4gICAgdGhpcy5yb3RhdGlvbkFycmF5WzBdID0gTWF0aFV0aWxzLnJhZFRvRGVnKGV1bGVyLngpO1xuICAgIHRoaXMucm90YXRpb25BcnJheVsxXSA9IE1hdGhVdGlscy5yYWRUb0RlZyhldWxlci55KTtcbiAgICB0aGlzLnJvdGF0aW9uQXJyYXlbMl0gPSBNYXRoVXRpbHMucmFkVG9EZWcoZXVsZXIueik7XG4gIH1cblxuICAvKipcbiAgICogUnVucyByYXljYXN0aW5nIGZvciB0aGUgc3BlY2lmaWVkIHNjcmVlbi1jb29yZGluYXRlcyBhZ2FpbnN0IGFsbCBvYmplY3RzXG4gICAqIGluIHRoZSBzY2VuZS5cbiAgICpcbiAgICogQHBhcmFtIHAgbm9ybWFsaXplZCBzY3JlZW5zcGFjZSBjb29yZGluYXRlcyBvZiB0aGVcbiAgICogICBtb3VzZS1jdXJzb3IuIHgveSBhcmUgaW4gcmFuZ2UgWy0xLCAxXSwgeSBpcyBwb2ludGluZyB1cC5cbiAgICogQHBhcmFtIG9wdGlvbnMgcmF5Y2FzdGluZyBvcHRpb25zLiBJbiB0aGlzIGNhc2UgdGhlIGByZWN1cnNpdmVgIG9wdGlvblxuICAgKiAgIGhhcyBubyBlZmZlY3QgYXMgaXQgaXMgYWx3YXlzIHJlY3Vyc2l2ZS5cbiAgICogQHJldHVybiB0aGUgbGlzdCBvZiBpbnRlcnNlY3Rpb25zXG4gICAqL1xuICBwdWJsaWMgcmF5Y2FzdChwOiBWZWN0b3IyLCBvcHRpb25zPzogUmF5Y2FzdE9wdGlvbnMpOiBJbnRlcnNlY3Rpb25bXTtcblxuICAvKipcbiAgICogUnVucyByYXljYXN0aW5nIGZvciB0aGUgc3BlY2lmaWVkIHNjcmVlbi1jb29yZGluYXRlcyBhZ2FpbnN0IHRoZSBzcGVjaWZpZWRcbiAgICogbGlzdCBvZiBvYmplY3RzLlxuICAgKlxuICAgKiBOb3RlIGZvciB0eXBlc2NyaXB0IHVzZXJzOiB0aGUgcmV0dXJuZWQgSW50ZXJzZWN0aW9uIG9iamVjdHMgY2FuIG9ubHkgYmVcbiAgICogcHJvcGVybHkgdHlwZWQgZm9yIG5vbi1yZWN1cnNpdmUgbG9va3VwcyAodGhpcyBpcyBoYW5kbGVkIGJ5IHRoZSBpbnRlcm5hbFxuICAgKiBzaWduYXR1cmUgYmVsb3cpLlxuICAgKlxuICAgKiBAcGFyYW0gcCBub3JtYWxpemVkIHNjcmVlbnNwYWNlIGNvb3JkaW5hdGVzIG9mIHRoZVxuICAgKiAgIG1vdXNlLWN1cnNvci4geC95IGFyZSBpbiByYW5nZSBbLTEsIDFdLCB5IGlzIHBvaW50aW5nIHVwLlxuICAgKiBAcGFyYW0gb2JqZWN0cyBsaXN0IG9mIG9iamVjdHMgdG8gdGVzdFxuICAgKiBAcGFyYW0gb3B0aW9ucyByYXljYXN0aW5nIG9wdGlvbnMuXG4gICAqL1xuICBwdWJsaWMgcmF5Y2FzdChcbiAgICBwOiBWZWN0b3IyLFxuICAgIG9iamVjdHM6IE9iamVjdDNEW10sXG4gICAgb3B0aW9ucz86IFJheWNhc3RPcHRpb25zICYgeyByZWN1cnNpdmU6IHRydWUgfVxuICApOiBJbnRlcnNlY3Rpb25bXTtcblxuICAvLyBhZGRpdGlvbmFsIHNpZ25hdHVyZSB0byBlbmFibGUgdHlwaW5ncyBpbiByZXR1cm5lZCBvYmplY3RzIHdoZW4gcG9zc2libGVcbiAgcHVibGljIHJheWNhc3Q8VCBleHRlbmRzIE9iamVjdDNEPihcbiAgICBwOiBWZWN0b3IyLFxuICAgIG9iamVjdHM6IFRbXSxcbiAgICBvcHRpb25zPzpcbiAgICAgIHwgT21pdDxSYXljYXN0T3B0aW9ucywgXCJyZWN1cnNpdmVcIj5cbiAgICAgIHwgKFJheWNhc3RPcHRpb25zICYgeyByZWN1cnNpdmU6IGZhbHNlIH0pXG4gICk6IEludGVyc2VjdGlvbjxUPltdO1xuXG4gIC8vIGltcGxlbWV0YXRpb25cbiAgcHVibGljIHJheWNhc3QoXG4gICAgcDogVmVjdG9yMixcbiAgICBvcHRpb25zT3JPYmplY3RzPzogT2JqZWN0M0RbXSB8IFJheWNhc3RPcHRpb25zLFxuICAgIG9wdGlvbnM6IFJheWNhc3RPcHRpb25zID0ge31cbiAgKTogSW50ZXJzZWN0aW9uW10ge1xuICAgIGxldCBvYmplY3RzOiBPYmplY3QzRFtdO1xuICAgIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnNPck9iamVjdHMpKSB7XG4gICAgICBvYmplY3RzID0gb3B0aW9uc09yT2JqZWN0cyB8fCBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICBvYmplY3RzID0gW3RoaXMuc2NlbmVdO1xuICAgICAgb3B0aW9ucyA9IHsgLi4ub3B0aW9uc09yT2JqZWN0cywgcmVjdXJzaXZlOiB0cnVlIH07XG4gICAgfVxuXG4gICAgY29uc3Qge1xuICAgICAgdXBkYXRlTWF0cml4ID0gdHJ1ZSxcbiAgICAgIHJlY3Vyc2l2ZSA9IGZhbHNlLFxuICAgICAgcmF5Y2FzdGVyUGFyYW1ldGVycyxcbiAgICB9ID0gb3B0aW9ucztcblxuICAgIC8vIHdoZW4gYHJheWNhc3QoKWAgaXMgY2FsbGVkIGZyb20gd2l0aGluIHRoZSBgb25CZWZvcmVSZW5kZXIoKWAgY2FsbGJhY2ssXG4gICAgLy8gdGhlIG12cC1tYXRyaXggZm9yIHRoaXMgZnJhbWUgaGFzIGFscmVhZHkgYmVlbiBjb21wdXRlZCBhbmQgc3RvcmVkIGluXG4gICAgLy8gYHRoaXMuY2FtZXJhLnByb2plY3Rpb25NYXRyaXhgLlxuICAgIC8vIFRoZSBtdnAtbWF0cml4IHRyYW5zZm9ybXMgd29ybGQtc3BhY2UgbWV0ZXJzIHRvIGNsaXAtc3BhY2VcbiAgICAvLyBjb29yZGluYXRlcy4gVGhlIGludmVyc2UgbWF0cml4IGNyZWF0ZWQgaGVyZSBkb2VzIHRoZSBleGFjdCBvcHBvc2l0ZVxuICAgIC8vIGFuZCBjb252ZXJ0cyBjbGlwLXNwYWNlIGNvb3JkaW5hdGVzIHRvIHdvcmxkLXNwYWNlLlxuICAgIGlmICh1cGRhdGVNYXRyaXgpIHtcbiAgICAgIHRoaXMucHJvamVjdGlvbk1hdHJpeEludmVyc2UuY29weSh0aGlzLmNhbWVyYS5wcm9qZWN0aW9uTWF0cml4KS5pbnZlcnQoKTtcbiAgICB9XG5cbiAgICAvLyBjcmVhdGUgdHdvIHBvaW50cyAod2l0aCBkaWZmZXJlbnQgZGVwdGgpIGZyb20gdGhlIG1vdXNlLXBvc2l0aW9uIGFuZFxuICAgIC8vIGNvbnZlcnQgdGhlbSBpbnRvIHdvcmxkLXNwYWNlIGNvb3JkaW5hdGVzIHRvIHNldCB1cCB0aGUgcmF5LlxuICAgIHRoaXMucmF5Y2FzdGVyLnJheS5vcmlnaW5cbiAgICAgIC5zZXQocC54LCBwLnksIDApXG4gICAgICAuYXBwbHlNYXRyaXg0KHRoaXMucHJvamVjdGlvbk1hdHJpeEludmVyc2UpO1xuXG4gICAgdGhpcy5yYXljYXN0ZXIucmF5LmRpcmVjdGlvblxuICAgICAgLnNldChwLngsIHAueSwgMC41KVxuICAgICAgLmFwcGx5TWF0cml4NCh0aGlzLnByb2plY3Rpb25NYXRyaXhJbnZlcnNlKVxuICAgICAgLnN1Yih0aGlzLnJheWNhc3Rlci5yYXkub3JpZ2luKVxuICAgICAgLm5vcm1hbGl6ZSgpO1xuXG4gICAgLy8gYmFjayB1cCB0aGUgcmF5Y2FzdGVyIHBhcmFtZXRlcnNcbiAgICBjb25zdCBvbGRSYXljYXN0ZXJQYXJhbXMgPSB0aGlzLnJheWNhc3Rlci5wYXJhbXM7XG4gICAgaWYgKHJheWNhc3RlclBhcmFtZXRlcnMpIHtcbiAgICAgIHRoaXMucmF5Y2FzdGVyLnBhcmFtcyA9IHJheWNhc3RlclBhcmFtZXRlcnM7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0cyA9IHRoaXMucmF5Y2FzdGVyLmludGVyc2VjdE9iamVjdHMob2JqZWN0cywgcmVjdXJzaXZlKTtcblxuICAgIC8vIHJlc2V0IHJheWNhc3RlciBwYXJhbXMgdG8gd2hhdGV2ZXIgdGhleSB3ZXJlIGJlZm9yZVxuICAgIHRoaXMucmF5Y2FzdGVyLnBhcmFtcyA9IG9sZFJheWNhc3RlclBhcmFtcztcblxuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG5cbiAgLyoqXG4gICAqIE92ZXJ3cml0ZSB0aGlzIG1ldGhvZCB0byBoYW5kbGUgYW55IEdMIHN0YXRlIHVwZGF0ZXMgb3V0c2lkZSB0aGVcbiAgICogcmVuZGVyIGFuaW1hdGlvbiBmcmFtZS5cbiAgICogQHBhcmFtIG9wdGlvbnNcbiAgICovXG4gIHB1YmxpYyBvblN0YXRlVXBkYXRlKG9wdGlvbnM6IGdvb2dsZS5tYXBzLldlYkdMU3RhdGVPcHRpb25zKTogdm9pZCB7fVxuXG4gIC8qKlxuICAgKiBPdmVyd3JpdGUgdGhpcyBtZXRob2QgdG8gZmV0Y2ggb3IgY3JlYXRlIGludGVybWVkaWF0ZSBkYXRhIHN0cnVjdHVyZXNcbiAgICogYmVmb3JlIHRoZSBvdmVybGF5IGlzIGRyYXduIHRoYXQgZG9u4oCZdCByZXF1aXJlIGltbWVkaWF0ZSBhY2Nlc3MgdG8gdGhlXG4gICAqIFdlYkdMIHJlbmRlcmluZyBjb250ZXh0LlxuICAgKi9cbiAgcHVibGljIG9uQWRkKCk6IHZvaWQge31cblxuICAvKipcbiAgICogT3ZlcndyaXRlIHRoaXMgbWV0aG9kIHRvIHVwZGF0ZSB5b3VyIHNjZW5lIGp1c3QgYmVmb3JlIGEgbmV3IGZyYW1lIGlzXG4gICAqIGRyYXduLlxuICAgKi9cbiAgcHVibGljIG9uQmVmb3JlRHJhdygpOiB2b2lkIHt9XG5cbiAgLyoqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGNhbGxlZCB3aGVuIHRoZSBvdmVybGF5IGlzIHJlbW92ZWQgZnJvbSB0aGUgbWFwIHdpdGhcbiAgICogYG92ZXJsYXkuc2V0TWFwKG51bGwpYCwgYW5kIGlzIHdoZXJlIHlvdSBjYW4gcmVtb3ZlIGFsbCBpbnRlcm1lZGlhdGVcbiAgICogb2JqZWN0cyBjcmVhdGVkIGluIG9uQWRkLlxuICAgKi9cbiAgcHVibGljIG9uUmVtb3ZlKCk6IHZvaWQge31cblxuICAvKipcbiAgICogVHJpZ2dlcnMgdGhlIG1hcCB0byB1cGRhdGUgR0wgc3RhdGUuXG4gICAqL1xuICBwdWJsaWMgcmVxdWVzdFN0YXRlVXBkYXRlKCk6IHZvaWQge1xuICAgIHRoaXMub3ZlcmxheS5yZXF1ZXN0U3RhdGVVcGRhdGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmlnZ2VycyB0aGUgbWFwIHRvIHJlZHJhdyBhIGZyYW1lLlxuICAgKi9cbiAgcHVibGljIHJlcXVlc3RSZWRyYXcoKTogdm9pZCB7XG4gICAgdGhpcy5vdmVybGF5LnJlcXVlc3RSZWRyYXcoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBtYXAgdGhlIG92ZXJsYXkgaXMgYWRkZWQgdG8uXG4gICAqL1xuICBwdWJsaWMgZ2V0TWFwKCk6IGdvb2dsZS5tYXBzLk1hcCB7XG4gICAgcmV0dXJuIHRoaXMub3ZlcmxheS5nZXRNYXAoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRoZSBvdmVybGF5IHRvIHRoZSBtYXAuXG4gICAqIEBwYXJhbSBtYXAgVGhlIG1hcCB0byBhY2Nlc3MgdGhlIGRpdiwgbW9kZWwgYW5kIHZpZXcgc3RhdGUuXG4gICAqL1xuICBwdWJsaWMgc2V0TWFwKG1hcDogZ29vZ2xlLm1hcHMuTWFwKTogdm9pZCB7XG4gICAgdGhpcy5vdmVybGF5LnNldE1hcChtYXApO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdGhlIGdpdmVuIGxpc3RlbmVyIGZ1bmN0aW9uIHRvIHRoZSBnaXZlbiBldmVudCBuYW1lLiBSZXR1cm5zIGFuXG4gICAqIGlkZW50aWZpZXIgZm9yIHRoaXMgbGlzdGVuZXIgdGhhdCBjYW4gYmUgdXNlZCB3aXRoXG4gICAqIDxjb2RlPmdvb2dsZS5tYXBzLmV2ZW50LnJlbW92ZUxpc3RlbmVyPC9jb2RlPi5cbiAgICovXG4gIHB1YmxpYyBhZGRMaXN0ZW5lcihcbiAgICBldmVudE5hbWU6IHN0cmluZyxcbiAgICBoYW5kbGVyOiAoLi4uYXJnczogdW5rbm93bltdKSA9PiB2b2lkXG4gICk6IGdvb2dsZS5tYXBzLk1hcHNFdmVudExpc3RlbmVyIHtcbiAgICByZXR1cm4gdGhpcy5vdmVybGF5LmFkZExpc3RlbmVyKGV2ZW50TmFtZSwgaGFuZGxlcik7XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBtZXRob2QgaXMgY2FsbGVkIG9uY2UgdGhlIHJlbmRlcmluZyBjb250ZXh0IGlzIGF2YWlsYWJsZS4gVXNlIGl0IHRvXG4gICAqIGluaXRpYWxpemUgb3IgYmluZCBhbnkgV2ViR0wgc3RhdGUgc3VjaCBhcyBzaGFkZXJzIG9yIGJ1ZmZlciBvYmplY3RzLlxuICAgKiBAcGFyYW0gb3B0aW9ucyB0aGF0IGFsbG93IGRldmVsb3BlcnMgdG8gcmVzdG9yZSB0aGUgR0wgY29udGV4dC5cbiAgICovXG4gIHB1YmxpYyBvbkNvbnRleHRSZXN0b3JlZCh7IGdsIH06IGdvb2dsZS5tYXBzLldlYkdMU3RhdGVPcHRpb25zKSB7XG4gICAgdGhpcy5yZW5kZXJlciA9IG5ldyBXZWJHTFJlbmRlcmVyKHtcbiAgICAgIGNhbnZhczogZ2wuY2FudmFzLFxuICAgICAgY29udGV4dDogZ2wsXG4gICAgICAuLi5nbC5nZXRDb250ZXh0QXR0cmlidXRlcygpLFxuICAgIH0pO1xuICAgIHRoaXMucmVuZGVyZXIuYXV0b0NsZWFyID0gZmFsc2U7XG4gICAgdGhpcy5yZW5kZXJlci5hdXRvQ2xlYXJEZXB0aCA9IGZhbHNlO1xuICAgIHRoaXMucmVuZGVyZXIuc2hhZG93TWFwLmVuYWJsZWQgPSB0cnVlO1xuICAgIHRoaXMucmVuZGVyZXIuc2hhZG93TWFwLnR5cGUgPSBQQ0ZTb2Z0U2hhZG93TWFwO1xuXG4gICAgLy8gTGluZWFyRW5jb2RpbmcgaXMgZGVmYXVsdCBmb3IgaGlzdG9yaWNhbCByZWFzb25zXG4gICAgLy8gaHR0cHM6Ly9kaXNjb3Vyc2UudGhyZWVqcy5vcmcvdC9saW5lYXJlbmNvZGluZy12cy1zcmdiZW5jb2RpbmcvMjMyNDNcbiAgICB0aGlzLnJlbmRlcmVyLm91dHB1dEVuY29kaW5nID0gc1JHQkVuY29kaW5nO1xuXG4gICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0IH0gPSBnbC5jYW52YXM7XG4gICAgdGhpcy5yZW5kZXJlci5zZXRWaWV3cG9ydCgwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIG1ldGhvZCBpcyBjYWxsZWQgd2hlbiB0aGUgcmVuZGVyaW5nIGNvbnRleHQgaXMgbG9zdCBmb3IgYW55IHJlYXNvbixcbiAgICogYW5kIGlzIHdoZXJlIHlvdSBzaG91bGQgY2xlYW4gdXAgYW55IHByZS1leGlzdGluZyBHTCBzdGF0ZSwgc2luY2UgaXQgaXNcbiAgICogbm8gbG9uZ2VyIG5lZWRlZC5cbiAgICovXG4gIHB1YmxpYyBvbkNvbnRleHRMb3N0KCkge1xuICAgIGlmICghdGhpcy5yZW5kZXJlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMucmVuZGVyZXIuZGlzcG9zZSgpO1xuICAgIHRoaXMucmVuZGVyZXIgPSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEltcGxlbWVudCB0aGlzIG1ldGhvZCB0byBkcmF3IFdlYkdMIGNvbnRlbnQgZGlyZWN0bHkgb24gdGhlIG1hcC4gTm90ZVxuICAgKiB0aGF0IGlmIHRoZSBvdmVybGF5IG5lZWRzIGEgbmV3IGZyYW1lIGRyYXduIHRoZW4gY2FsbCB7QGxpbmtcbiAgICogVGhyZWVKU092ZXJsYXlWaWV3LnJlcXVlc3RSZWRyYXd9LlxuICAgKiBAcGFyYW0gb3B0aW9ucyB0aGF0IGFsbG93IGRldmVsb3BlcnMgdG8gcmVuZGVyIGNvbnRlbnQgdG8gYW4gYXNzb2NpYXRlZFxuICAgKiAgICAgR29vZ2xlIGJhc2VtYXAuXG4gICAqL1xuICBwdWJsaWMgb25EcmF3KHsgZ2wsIHRyYW5zZm9ybWVyIH06IGdvb2dsZS5tYXBzLldlYkdMRHJhd09wdGlvbnMpOiB2b2lkIHtcbiAgICB0aGlzLmNhbWVyYS5wcm9qZWN0aW9uTWF0cml4LmZyb21BcnJheShcbiAgICAgIHRyYW5zZm9ybWVyLmZyb21MYXRMbmdBbHRpdHVkZSh0aGlzLmFuY2hvciwgdGhpcy5yb3RhdGlvbkFycmF5KVxuICAgICk7XG5cbiAgICBnbC5kaXNhYmxlKGdsLlNDSVNTT1JfVEVTVCk7XG5cbiAgICB0aGlzLm9uQmVmb3JlRHJhdygpO1xuXG4gICAgdGhpcy5yZW5kZXJlci5yZW5kZXIodGhpcy5zY2VuZSwgdGhpcy5jYW1lcmEpO1xuICAgIHRoaXMucmVuZGVyZXIucmVzZXRTdGF0ZSgpO1xuXG4gICAgaWYgKHRoaXMuYW5pbWF0aW9uTW9kZSA9PT0gXCJhbHdheXNcIikgdGhpcy5yZXF1ZXN0UmVkcmF3KCk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydCBjb29yZGluYXRlcyBmcm9tIFdHUzg0IExhdGl0dWRlIExvbmdpdHVkZSB0byB3b3JsZC1zcGFjZVxuICAgKiBjb29yZGluYXRlcyB3aGlsZSB0YWtpbmcgdGhlIG9yaWdpbiBhbmQgb3JpZW50YXRpb24gaW50byBhY2NvdW50LlxuICAgKi9cbiAgcHVibGljIGxhdExuZ0FsdGl0dWRlVG9WZWN0b3IzKFxuICAgIHBvc2l0aW9uOiBMYXRMbmdUeXBlcyxcbiAgICB0YXJnZXQgPSBuZXcgVmVjdG9yMygpXG4gICkge1xuICAgIGxhdExuZ1RvVmVjdG9yM1JlbGF0aXZlKFxuICAgICAgdG9MYXRMbmdBbHRpdHVkZUxpdGVyYWwocG9zaXRpb24pLFxuICAgICAgdGhpcy5hbmNob3IsXG4gICAgICB0YXJnZXRcbiAgICApO1xuXG4gICAgdGFyZ2V0LmFwcGx5UXVhdGVybmlvbih0aGlzLnJvdGF0aW9uSW52ZXJzZSk7XG5cbiAgICByZXR1cm4gdGFyZ2V0O1xuICB9XG5cbiAgLy8gTVZDT2JqZWN0IGludGVyZmFjZSBmb3J3YXJkZWQgdG8gdGhlIG92ZXJsYXlcblxuICAvKipcbiAgICogQmluZHMgYSBWaWV3IHRvIGEgTW9kZWwuXG4gICAqL1xuICBwdWJsaWMgYmluZFRvKFxuICAgIGtleTogc3RyaW5nLFxuICAgIHRhcmdldDogZ29vZ2xlLm1hcHMuTVZDT2JqZWN0LFxuICAgIHRhcmdldEtleT86IHN0cmluZyxcbiAgICBub05vdGlmeT86IGJvb2xlYW5cbiAgKTogdm9pZCB7XG4gICAgdGhpcy5vdmVybGF5LmJpbmRUbyhrZXksIHRhcmdldCwgdGFyZ2V0S2V5LCBub05vdGlmeSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIHZhbHVlLlxuICAgKi9cbiAgcHVibGljIGdldChrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLm92ZXJsYXkuZ2V0KGtleSk7XG4gIH1cblxuICAvKipcbiAgICogTm90aWZ5IGFsbCBvYnNlcnZlcnMgb2YgYSBjaGFuZ2Ugb24gdGhpcyBwcm9wZXJ0eS4gVGhpcyBub3RpZmllcyBib3RoXG4gICAqIG9iamVjdHMgdGhhdCBhcmUgYm91bmQgdG8gdGhlIG9iamVjdCdzIHByb3BlcnR5IGFzIHdlbGwgYXMgdGhlIG9iamVjdFxuICAgKiB0aGF0IGl0IGlzIGJvdW5kIHRvLlxuICAgKi9cbiAgcHVibGljIG5vdGlmeShrZXk6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMub3ZlcmxheS5ub3RpZnkoa2V5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGEgdmFsdWUuXG4gICAqL1xuICBwdWJsaWMgc2V0KGtleTogc3RyaW5nLCB2YWx1ZTogdW5rbm93bik6IHZvaWQge1xuICAgIHRoaXMub3ZlcmxheS5zZXQoa2V5LCB2YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIGNvbGxlY3Rpb24gb2Yga2V5LXZhbHVlIHBhaXJzLlxuICAgKi9cbiAgcHVibGljIHNldFZhbHVlcyh2YWx1ZXM/OiBvYmplY3QpOiB2b2lkIHtcbiAgICB0aGlzLm92ZXJsYXkuc2V0VmFsdWVzKHZhbHVlcyk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhIGJpbmRpbmcuIFVuYmluZGluZyB3aWxsIHNldCB0aGUgdW5ib3VuZCBwcm9wZXJ0eSB0byB0aGUgY3VycmVudFxuICAgKiB2YWx1ZS4gVGhlIG9iamVjdCB3aWxsIG5vdCBiZSBub3RpZmllZCwgYXMgdGhlIHZhbHVlIGhhcyBub3QgY2hhbmdlZC5cbiAgICovXG4gIHB1YmxpYyB1bmJpbmQoa2V5OiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLm92ZXJsYXkudW5iaW5kKGtleSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhbGwgYmluZGluZ3MuXG4gICAqL1xuICBwdWJsaWMgdW5iaW5kQWxsKCk6IHZvaWQge1xuICAgIHRoaXMub3ZlcmxheS51bmJpbmRBbGwoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGxpZ2h0cyAoZGlyZWN0aW9uYWwgYW5kIGhlbWlzcGhlcmUgbGlnaHQpIHRvIGlsbHVtaW5hdGUgdGhlIG1vZGVsXG4gICAqIChyb3VnaGx5IGFwcHJveGltYXRlcyB0aGUgbGlnaHRpbmcgb2YgYnVpbGRpbmdzIGluIG1hcHMpXG4gICAqL1xuICBwcml2YXRlIGluaXRTY2VuZUxpZ2h0cygpIHtcbiAgICBjb25zdCBoZW1pTGlnaHQgPSBuZXcgSGVtaXNwaGVyZUxpZ2h0KDB4ZmZmZmZmLCAweDQ0NDQ0NCwgMSk7XG4gICAgaGVtaUxpZ2h0LnBvc2l0aW9uLnNldCgwLCAtMC4yLCAxKS5ub3JtYWxpemUoKTtcblxuICAgIGNvbnN0IGRpckxpZ2h0ID0gbmV3IERpcmVjdGlvbmFsTGlnaHQoMHhmZmZmZmYpO1xuICAgIGRpckxpZ2h0LnBvc2l0aW9uLnNldCgwLCAxMCwgMTAwKTtcblxuICAgIHRoaXMuc2NlbmUuYWRkKGhlbWlMaWdodCwgZGlyTGlnaHQpO1xuICB9XG59XG4iLCIvKipcbiAqIENvcHlyaWdodCAyMDIxIEdvb2dsZSBMTENcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7IExPQURFUl9PUFRJT05TLCBNQVBfSUQgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCB7IFRocmVlSlNPdmVybGF5VmlldyB9IGZyb20gXCIuLi9zcmNcIjtcblxuaW1wb3J0IHsgTG9hZGVyIH0gZnJvbSBcIkBnb29nbGVtYXBzL2pzLWFwaS1sb2FkZXJcIjtcbmltcG9ydCB7IEJveEdlb21ldHJ5LCBNZXNoLCBNZXNoTWF0Y2FwTWF0ZXJpYWwgfSBmcm9tIFwidGhyZWVcIjtcblxuY29uc3QgbWFwT3B0aW9ucyA9IHtcbiAgY2VudGVyOiB7XG4gICAgbG5nOiAwLFxuICAgIGxhdDogMCxcbiAgfSxcbiAgbWFwSWQ6IE1BUF9JRCxcbiAgem9vbTogNCxcbiAgdGlsdDogNjcsXG59O1xuXG5uZXcgTG9hZGVyKExPQURFUl9PUFRJT05TKS5sb2FkKCkudGhlbigoKSA9PiB7XG4gIC8vIGNyZWF0ZSB0aGUgbWFwIGFuZCBvdmVybGF5XG4gIGNvbnN0IG1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtYXBcIiksIG1hcE9wdGlvbnMpO1xuICBjb25zdCBvdmVybGF5ID0gbmV3IFRocmVlSlNPdmVybGF5Vmlldyh7IG1hcCB9KTtcblxuICBbXG4gICAgeyBsYXQ6IDQ1LCBsbmc6IC05MCB9LFxuICAgIHsgbGF0OiA0NSwgbG5nOiA5MCB9LFxuICAgIHsgbGF0OiAtNDUsIGxuZzogLTkwIH0sXG4gICAgeyBsYXQ6IC00NSwgbG5nOiA5MCB9LFxuICBdLmZvckVhY2goKGxhdExuZzogZ29vZ2xlLm1hcHMuTGF0TG5nTGl0ZXJhbCkgPT4ge1xuICAgIC8vIGNyZWF0ZSBhIGJveCBtZXNoIHdpdGggb3JpZ2luIG9uIHRoZSBncm91bmQsIGluIHotdXAgb3JpZW50YXRpb25cbiAgICBjb25zdCBnZW9tZXRyeSA9IG5ldyBCb3hHZW9tZXRyeSgxMCwgNTAsIDEwKVxuICAgICAgLnRyYW5zbGF0ZSgwLCAyNSwgMClcbiAgICAgIC5yb3RhdGVYKE1hdGguUEkgLyAyKTtcblxuICAgIGNvbnN0IGJveCA9IG5ldyBNZXNoKGdlb21ldHJ5LCBuZXcgTWVzaE1hdGNhcE1hdGVyaWFsKCkpO1xuXG4gICAgLy8gbWFrZSBpdCBodWdlXG4gICAgYm94LnNjYWxlLm11bHRpcGx5U2NhbGFyKDEwMDAwKTtcblxuICAgIC8vIHNldCBwb3NpdGlvbiBhdCBjZW50ZXIgb2YgbWFwXG4gICAgb3ZlcmxheS5sYXRMbmdBbHRpdHVkZVRvVmVjdG9yMyhsYXRMbmcsIGJveC5wb3NpdGlvbik7XG5cbiAgICAvLyBhZGQgYm94IG1lc2ggdG8gdGhlIHNjZW5lXG4gICAgb3ZlcmxheS5zY2VuZS5hZGQoYm94KTtcbiAgfSk7XG59KTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7Ozs7Ozs7OztBQWNHO0FBSUksTUFBTSxNQUFNLEdBQUcsa0JBQWtCLENBQUM7QUFFbEMsTUFBTSxjQUFjLEdBQWtCO0FBQzNDLElBQUEsTUFB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
