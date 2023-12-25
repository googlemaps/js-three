import { V as Vector3, M as MathUtils, Q as Quaternion, a as Matrix4, R as Raycaster, S as Scene, P as PerspectiveCamera, E as Euler, W as WebGLRenderer, b as PCFSoftShadowMap, c as REVISION, s as sRGBEncoding, H as HemisphereLight, D as DirectionalLight, L as Loader, B as BoxGeometry, d as Mesh, e as MeshMatcapMaterial } from './vendor-1itEDNj0.js';

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
    onStateUpdate() { }
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
        // Since r152, default outputColorSpace is SRGB
        // Deprecated outputEncoding kept for backwards compatibility
        if (Number(REVISION) < 152)
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVtaXNwaGVyZXMuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2V4YW1wbGVzL2NvbmZpZy50cyIsIi4uLy4uL3NyYy91dGlsLnRzIiwiLi4vLi4vc3JjL3RocmVlLnRzIiwiLi4vLi4vZXhhbXBsZXMvaGVtaXNwaGVyZXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgMjAyMSBHb29nbGUgTExDXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgeyBMb2FkZXJPcHRpb25zIH0gZnJvbSBcIkBnb29nbGVtYXBzL2pzLWFwaS1sb2FkZXJcIjtcblxuZXhwb3J0IGNvbnN0IE1BUF9JRCA9IFwiN2I5YTg5N2FjZDBhNjNhNFwiO1xuXG5leHBvcnQgY29uc3QgTE9BREVSX09QVElPTlM6IExvYWRlck9wdGlvbnMgPSB7XG4gIGFwaUtleTogXCJBSXphU3lEOHhpYVZQV0IwMk9lUWtKT2VuTGlKemRlVUh6bGh1MDBcIixcbiAgdmVyc2lvbjogXCJiZXRhXCIsXG4gIGxpYnJhcmllczogW10sXG59O1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgMjAyMSBHb29nbGUgTExDLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHsgTWF0aFV0aWxzLCBWZWN0b3IzIH0gZnJvbSBcInRocmVlXCI7XG5cbmV4cG9ydCB0eXBlIExhdExuZ1R5cGVzID1cbiAgfCBnb29nbGUubWFwcy5MYXRMbmdMaXRlcmFsXG4gIHwgZ29vZ2xlLm1hcHMuTGF0TG5nXG4gIHwgZ29vZ2xlLm1hcHMuTGF0TG5nQWx0aXR1ZGVMaXRlcmFsXG4gIHwgZ29vZ2xlLm1hcHMuTGF0TG5nQWx0aXR1ZGU7XG5cbi8vIHNob3J0aGFuZHMgZm9yIG1hdGgtZnVuY3Rpb25zLCBtYWtlcyBlcXVhdGlvbnMgbW9yZSByZWFkYWJsZVxuY29uc3QgeyBhdGFuLCBjb3MsIGV4cCwgbG9nLCB0YW4sIFBJIH0gPSBNYXRoO1xuY29uc3QgeyBkZWdUb1JhZCwgcmFkVG9EZWcgfSA9IE1hdGhVdGlscztcblxuZXhwb3J0IGNvbnN0IEVBUlRIX1JBRElVUyA9IDYzNzEwMTAuMDtcbmV4cG9ydCBjb25zdCBXT1JMRF9TSVpFID0gTWF0aC5QSSAqIEVBUlRIX1JBRElVUztcblxuLyoqXG4gKiBDb252ZXJ0cyBhbnkgb2YgdGhlIHN1cHBvcnRlZCBwb3NpdGlvbiBmb3JtYXRzIGludG8gdGhlXG4gKiBnb29nbGUubWFwcy5MYXRMbmdBbHRpdHVkZUxpdGVyYWwgZm9ybWF0IHVzZWQgZm9yIHRoZSBjYWxjdWxhdGlvbnMuXG4gKiBAcGFyYW0gcG9pbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvTGF0TG5nQWx0aXR1ZGVMaXRlcmFsKFxuICBwb2ludDogTGF0TG5nVHlwZXNcbik6IGdvb2dsZS5tYXBzLkxhdExuZ0FsdGl0dWRlTGl0ZXJhbCB7XG4gIGlmIChcbiAgICB3aW5kb3cuZ29vZ2xlICYmXG4gICAgZ29vZ2xlLm1hcHMgJiZcbiAgICAocG9pbnQgaW5zdGFuY2VvZiBnb29nbGUubWFwcy5MYXRMbmcgfHxcbiAgICAgIHBvaW50IGluc3RhbmNlb2YgZ29vZ2xlLm1hcHMuTGF0TG5nQWx0aXR1ZGUpXG4gICkge1xuICAgIHJldHVybiB7IGFsdGl0dWRlOiAwLCAuLi5wb2ludC50b0pTT04oKSB9O1xuICB9XG5cbiAgcmV0dXJuIHsgYWx0aXR1ZGU6IDAsIC4uLihwb2ludCBhcyBnb29nbGUubWFwcy5MYXRMbmdMaXRlcmFsKSB9O1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGxhdGl0dWRlIGFuZCBsb25naXR1ZGUgdG8gd29ybGQgc3BhY2UgY29vcmRpbmF0ZXMgcmVsYXRpdmVcbiAqIHRvIGEgcmVmZXJlbmNlIGxvY2F0aW9uIHdpdGggeSB1cC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxhdExuZ1RvVmVjdG9yM1JlbGF0aXZlKFxuICBwb2ludDogZ29vZ2xlLm1hcHMuTGF0TG5nQWx0aXR1ZGVMaXRlcmFsLFxuICByZWZlcmVuY2U6IGdvb2dsZS5tYXBzLkxhdExuZ0FsdGl0dWRlTGl0ZXJhbCxcbiAgdGFyZ2V0ID0gbmV3IFZlY3RvcjMoKVxuKSB7XG4gIGNvbnN0IFtweCwgcHldID0gbGF0TG5nVG9YWShwb2ludCk7XG4gIGNvbnN0IFtyeCwgcnldID0gbGF0TG5nVG9YWShyZWZlcmVuY2UpO1xuXG4gIHRhcmdldC5zZXQocHggLSByeCwgcHkgLSByeSwgMCk7XG5cbiAgLy8gYXBwbHkgdGhlIHNwaGVyaWNhbCBtZXJjYXRvciBzY2FsZS1mYWN0b3IgZm9yIHRoZSByZWZlcmVuY2UgbGF0aXR1ZGVcbiAgdGFyZ2V0Lm11bHRpcGx5U2NhbGFyKGNvcyhkZWdUb1JhZChyZWZlcmVuY2UubGF0KSkpO1xuXG4gIHRhcmdldC56ID0gcG9pbnQuYWx0aXR1ZGUgLSByZWZlcmVuY2UuYWx0aXR1ZGU7XG5cbiAgcmV0dXJuIHRhcmdldDtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBXR1M4NCBsYXRpdHVkZSBhbmQgbG9uZ2l0dWRlIHRvICh1bmNvcnJlY3RlZCkgV2ViTWVyY2F0b3IgbWV0ZXJzLlxuICogKFdHUzg0IC0tPiBXZWJNZXJjYXRvciAoRVBTRzozODU3KSlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxhdExuZ1RvWFkocG9zaXRpb246IGdvb2dsZS5tYXBzLkxhdExuZ0xpdGVyYWwpOiBudW1iZXJbXSB7XG4gIHJldHVybiBbXG4gICAgRUFSVEhfUkFESVVTICogZGVnVG9SYWQocG9zaXRpb24ubG5nKSxcbiAgICBFQVJUSF9SQURJVVMgKiBsb2codGFuKDAuMjUgKiBQSSArIDAuNSAqIGRlZ1RvUmFkKHBvc2l0aW9uLmxhdCkpKSxcbiAgXTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBXZWJNZXJjYXRvciBtZXRlcnMgdG8gV0dTODQgbGF0aXR1ZGUvbG9uZ2l0dWRlLlxuICogKFdlYk1lcmNhdG9yIChFUFNHOjM4NTcpIC0tPiBXR1M4NClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHh5VG9MYXRMbmcocDogbnVtYmVyW10pOiBnb29nbGUubWFwcy5MYXRMbmdMaXRlcmFsIHtcbiAgY29uc3QgW3gsIHldID0gcDtcblxuICByZXR1cm4ge1xuICAgIGxhdDogcmFkVG9EZWcoUEkgKiAwLjUgLSAyLjAgKiBhdGFuKGV4cCgteSAvIEVBUlRIX1JBRElVUykpKSxcbiAgICBsbmc6IHJhZFRvRGVnKHgpIC8gRUFSVEhfUkFESVVTLFxuICB9O1xufVxuIiwiLyoqXG4gKiBDb3B5cmlnaHQgMjAyMSBHb29nbGUgTExDXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQge1xuICBEaXJlY3Rpb25hbExpZ2h0LFxuICBFdWxlcixcbiAgSGVtaXNwaGVyZUxpZ2h0LFxuICBJbnRlcnNlY3Rpb24sXG4gIE1hdGhVdGlscyxcbiAgTWF0cml4NCxcbiAgT2JqZWN0M0QsXG4gIFBDRlNvZnRTaGFkb3dNYXAsXG4gIFBlcnNwZWN0aXZlQ2FtZXJhLFxuICBRdWF0ZXJuaW9uLFxuICBSYXljYXN0ZXIsXG4gIFJheWNhc3RlclBhcmFtZXRlcnMsXG4gIFJFVklTSU9OLFxuICBTY2VuZSxcbiAgc1JHQkVuY29kaW5nLFxuICBWZWN0b3IyLFxuICBWZWN0b3IzLFxuICBXZWJHTFJlbmRlcmVyLFxufSBmcm9tIFwidGhyZWVcIjtcbmltcG9ydCB7IGxhdExuZ1RvVmVjdG9yM1JlbGF0aXZlLCB0b0xhdExuZ0FsdGl0dWRlTGl0ZXJhbCB9IGZyb20gXCIuL3V0aWxcIjtcblxuaW1wb3J0IHR5cGUgeyBMYXRMbmdUeXBlcyB9IGZyb20gXCIuL3V0aWxcIjtcblxuY29uc3QgREVGQVVMVF9VUCA9IG5ldyBWZWN0b3IzKDAsIDAsIDEpO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJheWNhc3RPcHRpb25zIHtcbiAgLyoqXG4gICAqIFNldCB0byB0cnVlIHRvIGFsc28gdGVzdCBjaGlsZHJlbiBvZiB0aGUgc3BlY2lmaWVkIG9iamVjdHMgZm9yXG4gICAqIGludGVyc2VjdGlvbnMuXG4gICAqXG4gICAqIEBkZWZhdWx0IGZhbHNlXG4gICAqL1xuICByZWN1cnNpdmU/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIGludmVyc2UtcHJvamVjdGlvbi1tYXRyaXggYmVmb3JlIGNhc3RpbmcgdGhlIHJheSAoc2V0IHRoaXNcbiAgICogdG8gZmFsc2UgaWYgeW91IG5lZWQgdG8gcnVuIG11bHRpcGxlIHJheWNhc3RzIGZvciB0aGUgc2FtZSBmcmFtZSkuXG4gICAqXG4gICAqIEBkZWZhdWx0IHRydWVcbiAgICovXG4gIHVwZGF0ZU1hdHJpeD86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEFkZGl0aW9uYWwgcGFyYW1ldGVycyB0byBwYXNzIHRvIHRoZSB0aHJlZS5qcyByYXljYXN0ZXIuXG4gICAqXG4gICAqIEBzZWUgaHR0cHM6Ly90aHJlZWpzLm9yZy9kb2NzLyNhcGkvZW4vY29yZS9SYXljYXN0ZXIucGFyYW1zXG4gICAqL1xuICByYXljYXN0ZXJQYXJhbWV0ZXJzPzogUmF5Y2FzdGVyUGFyYW1ldGVycztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUaHJlZUpTT3ZlcmxheVZpZXdPcHRpb25zIHtcbiAgLyoqXG4gICAqIFRoZSBhbmNob3IgZm9yIHRoZSBzY2VuZS5cbiAgICpcbiAgICogQGRlZmF1bHQge2xhdDogMCwgbG5nOiAwLCBhbHRpdHVkZTogMH1cbiAgICovXG4gIGFuY2hvcj86IExhdExuZ1R5cGVzO1xuXG4gIC8qKlxuICAgKiBUaGUgYXhpcyBwb2ludGluZyB1cCBpbiB0aGUgc2NlbmUuIENhbiBiZSBzcGVjaWZpZWQgYXMgXCJaXCIsIFwiWVwiIG9yIGFcbiAgICogVmVjdG9yMywgaW4gd2hpY2ggY2FzZSB0aGUgbm9ybWFsaXplZCB2ZWN0b3Igd2lsbCBiZWNvbWUgdGhlIHVwLWF4aXMuXG4gICAqXG4gICAqIEBkZWZhdWx0IFwiWlwiXG4gICAqL1xuICB1cEF4aXM/OiBcIlpcIiB8IFwiWVwiIHwgVmVjdG9yMztcblxuICAvKipcbiAgICogVGhlIG1hcCB0aGUgb3ZlcmxheSB3aWxsIGJlIGFkZGVkIHRvLlxuICAgKiBDYW4gYmUgc2V0IGF0IGluaXRpYWxpemF0aW9uIG9yIGJ5IGNhbGxpbmcgYHNldE1hcChtYXApYC5cbiAgICovXG4gIG1hcD86IGdvb2dsZS5tYXBzLk1hcDtcblxuICAvKipcbiAgICogVGhlIHNjZW5lIG9iamVjdCB0byByZW5kZXIgaW4gdGhlIG92ZXJsYXkuIElmIG5vIHNjZW5lIGlzIHNwZWNpZmllZCwgYVxuICAgKiBuZXcgc2NlbmUgaXMgY3JlYXRlZCBhbmQgY2FuIGJlIGFjY2Vzc2VkIHZpYSBgb3ZlcmxheS5zY2VuZWAuXG4gICAqL1xuICBzY2VuZT86IFNjZW5lO1xuXG4gIC8qKlxuICAgKiBUaGUgYW5pbWF0aW9uIG1vZGUgY29udHJvbHMgd2hlbiB0aGUgb3ZlcmxheSB3aWxsIHJlZHJhdywgZWl0aGVyXG4gICAqIGNvbnRpbnVvdXNseSAoYGFsd2F5c2ApIG9yIG9uIGRlbWFuZCAoYG9uZGVtYW5kYCkuIFdoZW4gdXNpbmcgdGhlXG4gICAqIG9uIGRlbWFuZCBtb2RlLCB0aGUgb3ZlcmxheSB3aWxsIHJlLXJlbmRlciB3aGVuZXZlciB0aGUgbWFwIHJlbmRlcnNcbiAgICogKGNhbWVyYSBtb3ZlbWVudHMpIG9yIHdoZW4gYHJlcXVlc3RSZWRyYXcoKWAgaXMgY2FsbGVkLlxuICAgKlxuICAgKiBUbyBhY2hpZXZlIGFuaW1hdGlvbnMgaW4gdGhpcyBtb2RlLCB5b3UgY2FuIGVpdGhlciB1c2UgYW4gb3V0c2lkZVxuICAgKiBhbmltYXRpb24tbG9vcCB0aGF0IGNhbGxzIGByZXF1ZXN0UmVkcmF3KClgIGFzIGxvbmcgYXMgbmVlZGVkIG9yIGNhbGxcbiAgICogYHJlcXVlc3RSZWRyYXcoKWAgZnJvbSB3aXRoaW4gdGhlIGBvbkJlZm9yZVJlbmRlcmAgZnVuY3Rpb24gdG9cbiAgICpcbiAgICogQGRlZmF1bHQgXCJvbmRlbWFuZFwiXG4gICAqL1xuICBhbmltYXRpb25Nb2RlPzogXCJhbHdheXNcIiB8IFwib25kZW1hbmRcIjtcblxuICAvKipcbiAgICogQWRkIGRlZmF1bHQgbGlnaHRpbmcgdG8gdGhlIHNjZW5lLlxuICAgKiBAZGVmYXVsdCB0cnVlXG4gICAqL1xuICBhZGREZWZhdWx0TGlnaHRpbmc/OiBib29sZWFuO1xufVxuXG4vKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZW1wdHktZnVuY3Rpb24gKi9cblxuLyoqXG4gKiBBZGQgYSBbdGhyZWUuanNdKGh0dHBzOi8vdGhyZWVqcy5vcmcpIHNjZW5lIGFzIGEgW0dvb2dsZSBNYXBzIFdlYkdMT3ZlcmxheVZpZXddKGh0dHA6Ly9nb28uZ2xlL1dlYkdMT3ZlcmxheVZpZXctcmVmKS5cbiAqL1xuZXhwb3J0IGNsYXNzIFRocmVlSlNPdmVybGF5VmlldyBpbXBsZW1lbnRzIGdvb2dsZS5tYXBzLldlYkdMT3ZlcmxheVZpZXcge1xuICAvKioge0Bpbmhlcml0RG9jIFRocmVlSlNPdmVybGF5Vmlld09wdGlvbnMuc2NlbmV9ICovXG4gIHB1YmxpYyByZWFkb25seSBzY2VuZTogU2NlbmU7XG5cbiAgLyoqIHtAaW5oZXJpdERvYyBUaHJlZUpTT3ZlcmxheVZpZXdPcHRpb25zLmFuaW1hdGlvbk1vZGV9ICovXG4gIHB1YmxpYyBhbmltYXRpb25Nb2RlOiBcImFsd2F5c1wiIHwgXCJvbmRlbWFuZFwiID0gXCJvbmRlbWFuZFwiO1xuXG4gIC8qKiB7QGluaGVyaXREb2MgVGhyZWVKU092ZXJsYXlWaWV3T3B0aW9ucy5hbmNob3J9ICovXG4gIHByb3RlY3RlZCBhbmNob3I6IGdvb2dsZS5tYXBzLkxhdExuZ0FsdGl0dWRlTGl0ZXJhbDtcbiAgcHJvdGVjdGVkIHJlYWRvbmx5IGNhbWVyYTogUGVyc3BlY3RpdmVDYW1lcmE7XG4gIHByb3RlY3RlZCByZWFkb25seSByb3RhdGlvbkFycmF5OiBGbG9hdDMyQXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgcm90YXRpb25JbnZlcnNlOiBRdWF0ZXJuaW9uID0gbmV3IFF1YXRlcm5pb24oKTtcbiAgcHJvdGVjdGVkIHJlYWRvbmx5IHByb2plY3Rpb25NYXRyaXhJbnZlcnNlID0gbmV3IE1hdHJpeDQoKTtcblxuICBwcm90ZWN0ZWQgcmVhZG9ubHkgb3ZlcmxheTogZ29vZ2xlLm1hcHMuV2ViR0xPdmVybGF5VmlldztcbiAgcHJvdGVjdGVkIHJlbmRlcmVyOiBXZWJHTFJlbmRlcmVyO1xuICBwcm90ZWN0ZWQgcmF5Y2FzdGVyOiBSYXljYXN0ZXIgPSBuZXcgUmF5Y2FzdGVyKCk7XG5cbiAgY29uc3RydWN0b3Iob3B0aW9uczogVGhyZWVKU092ZXJsYXlWaWV3T3B0aW9ucyA9IHt9KSB7XG4gICAgY29uc3Qge1xuICAgICAgYW5jaG9yID0geyBsYXQ6IDAsIGxuZzogMCwgYWx0aXR1ZGU6IDAgfSxcbiAgICAgIHVwQXhpcyA9IFwiWlwiLFxuICAgICAgc2NlbmUsXG4gICAgICBtYXAsXG4gICAgICBhbmltYXRpb25Nb2RlID0gXCJvbmRlbWFuZFwiLFxuICAgICAgYWRkRGVmYXVsdExpZ2h0aW5nID0gdHJ1ZSxcbiAgICB9ID0gb3B0aW9ucztcblxuICAgIHRoaXMub3ZlcmxheSA9IG5ldyBnb29nbGUubWFwcy5XZWJHTE92ZXJsYXlWaWV3KCk7XG4gICAgdGhpcy5yZW5kZXJlciA9IG51bGw7XG4gICAgdGhpcy5jYW1lcmEgPSBudWxsO1xuICAgIHRoaXMuYW5pbWF0aW9uTW9kZSA9IGFuaW1hdGlvbk1vZGU7XG5cbiAgICB0aGlzLnNldEFuY2hvcihhbmNob3IpO1xuICAgIHRoaXMuc2V0VXBBeGlzKHVwQXhpcyk7XG5cbiAgICB0aGlzLnNjZW5lID0gc2NlbmUgPz8gbmV3IFNjZW5lKCk7XG4gICAgaWYgKGFkZERlZmF1bHRMaWdodGluZykgdGhpcy5pbml0U2NlbmVMaWdodHMoKTtcblxuICAgIHRoaXMub3ZlcmxheS5vbkFkZCA9IHRoaXMub25BZGQuYmluZCh0aGlzKTtcbiAgICB0aGlzLm92ZXJsYXkub25SZW1vdmUgPSB0aGlzLm9uUmVtb3ZlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vdmVybGF5Lm9uQ29udGV4dExvc3QgPSB0aGlzLm9uQ29udGV4dExvc3QuYmluZCh0aGlzKTtcbiAgICB0aGlzLm92ZXJsYXkub25Db250ZXh0UmVzdG9yZWQgPSB0aGlzLm9uQ29udGV4dFJlc3RvcmVkLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vdmVybGF5Lm9uU3RhdGVVcGRhdGUgPSB0aGlzLm9uU3RhdGVVcGRhdGUuYmluZCh0aGlzKTtcbiAgICB0aGlzLm92ZXJsYXkub25EcmF3ID0gdGhpcy5vbkRyYXcuYmluZCh0aGlzKTtcblxuICAgIHRoaXMuY2FtZXJhID0gbmV3IFBlcnNwZWN0aXZlQ2FtZXJhKCk7XG5cbiAgICBpZiAobWFwKSB7XG4gICAgICB0aGlzLnNldE1hcChtYXApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBhbmNob3ItcG9pbnQuXG4gICAqIEBwYXJhbSBhbmNob3JcbiAgICovXG4gIHB1YmxpYyBzZXRBbmNob3IoYW5jaG9yOiBMYXRMbmdUeXBlcykge1xuICAgIHRoaXMuYW5jaG9yID0gdG9MYXRMbmdBbHRpdHVkZUxpdGVyYWwoYW5jaG9yKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBheGlzIHRvIHVzZSBhcyBcInVwXCIgaW4gdGhlIHNjZW5lLlxuICAgKiBAcGFyYW0gYXhpc1xuICAgKi9cbiAgcHVibGljIHNldFVwQXhpcyhheGlzOiBcIllcIiB8IFwiWlwiIHwgVmVjdG9yMyk6IHZvaWQge1xuICAgIGNvbnN0IHVwVmVjdG9yID0gbmV3IFZlY3RvcjMoMCwgMCwgMSk7XG4gICAgaWYgKHR5cGVvZiBheGlzICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICB1cFZlY3Rvci5jb3B5KGF4aXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoYXhpcy50b0xvd2VyQ2FzZSgpID09PSBcInlcIikge1xuICAgICAgICB1cFZlY3Rvci5zZXQoMCwgMSwgMCk7XG4gICAgICB9IGVsc2UgaWYgKGF4aXMudG9Mb3dlckNhc2UoKSAhPT0gXCJ6XCIpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGBpbnZhbGlkIHZhbHVlICcke2F4aXN9JyBzcGVjaWZpZWQgYXMgdXBBeGlzYCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdXBWZWN0b3Iubm9ybWFsaXplKCk7XG5cbiAgICBjb25zdCBxID0gbmV3IFF1YXRlcm5pb24oKTtcbiAgICBxLnNldEZyb21Vbml0VmVjdG9ycyh1cFZlY3RvciwgREVGQVVMVF9VUCk7XG5cbiAgICAvLyBpbnZlcnNlIHJvdGF0aW9uIGlzIG5lZWRlZCBpbiBsYXRMbmdBbHRpdHVkZVRvVmVjdG9yMygpXG4gICAgdGhpcy5yb3RhdGlvbkludmVyc2UuY29weShxKS5pbnZlcnQoKTtcblxuICAgIC8vIGNvcHkgdG8gcm90YXRpb25BcnJheSBmb3IgdHJhbnNmb3JtZXIuZnJvbUxhdExuZ0FsdGl0dWRlKClcbiAgICBjb25zdCBldWxlciA9IG5ldyBFdWxlcigpLnNldEZyb21RdWF0ZXJuaW9uKHEsIFwiWFlaXCIpO1xuICAgIHRoaXMucm90YXRpb25BcnJheVswXSA9IE1hdGhVdGlscy5yYWRUb0RlZyhldWxlci54KTtcbiAgICB0aGlzLnJvdGF0aW9uQXJyYXlbMV0gPSBNYXRoVXRpbHMucmFkVG9EZWcoZXVsZXIueSk7XG4gICAgdGhpcy5yb3RhdGlvbkFycmF5WzJdID0gTWF0aFV0aWxzLnJhZFRvRGVnKGV1bGVyLnopO1xuICB9XG5cbiAgLyoqXG4gICAqIFJ1bnMgcmF5Y2FzdGluZyBmb3IgdGhlIHNwZWNpZmllZCBzY3JlZW4tY29vcmRpbmF0ZXMgYWdhaW5zdCBhbGwgb2JqZWN0c1xuICAgKiBpbiB0aGUgc2NlbmUuXG4gICAqXG4gICAqIEBwYXJhbSBwIG5vcm1hbGl6ZWQgc2NyZWVuc3BhY2UgY29vcmRpbmF0ZXMgb2YgdGhlXG4gICAqICAgbW91c2UtY3Vyc29yLiB4L3kgYXJlIGluIHJhbmdlIFstMSwgMV0sIHkgaXMgcG9pbnRpbmcgdXAuXG4gICAqIEBwYXJhbSBvcHRpb25zIHJheWNhc3Rpbmcgb3B0aW9ucy4gSW4gdGhpcyBjYXNlIHRoZSBgcmVjdXJzaXZlYCBvcHRpb25cbiAgICogICBoYXMgbm8gZWZmZWN0IGFzIGl0IGlzIGFsd2F5cyByZWN1cnNpdmUuXG4gICAqIEByZXR1cm4gdGhlIGxpc3Qgb2YgaW50ZXJzZWN0aW9uc1xuICAgKi9cbiAgcHVibGljIHJheWNhc3QocDogVmVjdG9yMiwgb3B0aW9ucz86IFJheWNhc3RPcHRpb25zKTogSW50ZXJzZWN0aW9uW107XG5cbiAgLyoqXG4gICAqIFJ1bnMgcmF5Y2FzdGluZyBmb3IgdGhlIHNwZWNpZmllZCBzY3JlZW4tY29vcmRpbmF0ZXMgYWdhaW5zdCB0aGUgc3BlY2lmaWVkXG4gICAqIGxpc3Qgb2Ygb2JqZWN0cy5cbiAgICpcbiAgICogTm90ZSBmb3IgdHlwZXNjcmlwdCB1c2VyczogdGhlIHJldHVybmVkIEludGVyc2VjdGlvbiBvYmplY3RzIGNhbiBvbmx5IGJlXG4gICAqIHByb3Blcmx5IHR5cGVkIGZvciBub24tcmVjdXJzaXZlIGxvb2t1cHMgKHRoaXMgaXMgaGFuZGxlZCBieSB0aGUgaW50ZXJuYWxcbiAgICogc2lnbmF0dXJlIGJlbG93KS5cbiAgICpcbiAgICogQHBhcmFtIHAgbm9ybWFsaXplZCBzY3JlZW5zcGFjZSBjb29yZGluYXRlcyBvZiB0aGVcbiAgICogICBtb3VzZS1jdXJzb3IuIHgveSBhcmUgaW4gcmFuZ2UgWy0xLCAxXSwgeSBpcyBwb2ludGluZyB1cC5cbiAgICogQHBhcmFtIG9iamVjdHMgbGlzdCBvZiBvYmplY3RzIHRvIHRlc3RcbiAgICogQHBhcmFtIG9wdGlvbnMgcmF5Y2FzdGluZyBvcHRpb25zLlxuICAgKi9cbiAgcHVibGljIHJheWNhc3QoXG4gICAgcDogVmVjdG9yMixcbiAgICBvYmplY3RzOiBPYmplY3QzRFtdLFxuICAgIG9wdGlvbnM/OiBSYXljYXN0T3B0aW9ucyAmIHsgcmVjdXJzaXZlOiB0cnVlIH1cbiAgKTogSW50ZXJzZWN0aW9uW107XG5cbiAgLy8gYWRkaXRpb25hbCBzaWduYXR1cmUgdG8gZW5hYmxlIHR5cGluZ3MgaW4gcmV0dXJuZWQgb2JqZWN0cyB3aGVuIHBvc3NpYmxlXG4gIHB1YmxpYyByYXljYXN0PFQgZXh0ZW5kcyBPYmplY3QzRD4oXG4gICAgcDogVmVjdG9yMixcbiAgICBvYmplY3RzOiBUW10sXG4gICAgb3B0aW9ucz86XG4gICAgICB8IE9taXQ8UmF5Y2FzdE9wdGlvbnMsIFwicmVjdXJzaXZlXCI+XG4gICAgICB8IChSYXljYXN0T3B0aW9ucyAmIHsgcmVjdXJzaXZlOiBmYWxzZSB9KVxuICApOiBJbnRlcnNlY3Rpb248VD5bXTtcblxuICAvLyBpbXBsZW1ldGF0aW9uXG4gIHB1YmxpYyByYXljYXN0KFxuICAgIHA6IFZlY3RvcjIsXG4gICAgb3B0aW9uc09yT2JqZWN0cz86IE9iamVjdDNEW10gfCBSYXljYXN0T3B0aW9ucyxcbiAgICBvcHRpb25zOiBSYXljYXN0T3B0aW9ucyA9IHt9XG4gICk6IEludGVyc2VjdGlvbltdIHtcbiAgICBsZXQgb2JqZWN0czogT2JqZWN0M0RbXTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zT3JPYmplY3RzKSkge1xuICAgICAgb2JqZWN0cyA9IG9wdGlvbnNPck9iamVjdHMgfHwgbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgb2JqZWN0cyA9IFt0aGlzLnNjZW5lXTtcbiAgICAgIG9wdGlvbnMgPSB7IC4uLm9wdGlvbnNPck9iamVjdHMsIHJlY3Vyc2l2ZTogdHJ1ZSB9O1xuICAgIH1cblxuICAgIGNvbnN0IHtcbiAgICAgIHVwZGF0ZU1hdHJpeCA9IHRydWUsXG4gICAgICByZWN1cnNpdmUgPSBmYWxzZSxcbiAgICAgIHJheWNhc3RlclBhcmFtZXRlcnMsXG4gICAgfSA9IG9wdGlvbnM7XG5cbiAgICAvLyB3aGVuIGByYXljYXN0KClgIGlzIGNhbGxlZCBmcm9tIHdpdGhpbiB0aGUgYG9uQmVmb3JlUmVuZGVyKClgIGNhbGxiYWNrLFxuICAgIC8vIHRoZSBtdnAtbWF0cml4IGZvciB0aGlzIGZyYW1lIGhhcyBhbHJlYWR5IGJlZW4gY29tcHV0ZWQgYW5kIHN0b3JlZCBpblxuICAgIC8vIGB0aGlzLmNhbWVyYS5wcm9qZWN0aW9uTWF0cml4YC5cbiAgICAvLyBUaGUgbXZwLW1hdHJpeCB0cmFuc2Zvcm1zIHdvcmxkLXNwYWNlIG1ldGVycyB0byBjbGlwLXNwYWNlXG4gICAgLy8gY29vcmRpbmF0ZXMuIFRoZSBpbnZlcnNlIG1hdHJpeCBjcmVhdGVkIGhlcmUgZG9lcyB0aGUgZXhhY3Qgb3Bwb3NpdGVcbiAgICAvLyBhbmQgY29udmVydHMgY2xpcC1zcGFjZSBjb29yZGluYXRlcyB0byB3b3JsZC1zcGFjZS5cbiAgICBpZiAodXBkYXRlTWF0cml4KSB7XG4gICAgICB0aGlzLnByb2plY3Rpb25NYXRyaXhJbnZlcnNlLmNvcHkodGhpcy5jYW1lcmEucHJvamVjdGlvbk1hdHJpeCkuaW52ZXJ0KCk7XG4gICAgfVxuXG4gICAgLy8gY3JlYXRlIHR3byBwb2ludHMgKHdpdGggZGlmZmVyZW50IGRlcHRoKSBmcm9tIHRoZSBtb3VzZS1wb3NpdGlvbiBhbmRcbiAgICAvLyBjb252ZXJ0IHRoZW0gaW50byB3b3JsZC1zcGFjZSBjb29yZGluYXRlcyB0byBzZXQgdXAgdGhlIHJheS5cbiAgICB0aGlzLnJheWNhc3Rlci5yYXkub3JpZ2luXG4gICAgICAuc2V0KHAueCwgcC55LCAwKVxuICAgICAgLmFwcGx5TWF0cml4NCh0aGlzLnByb2plY3Rpb25NYXRyaXhJbnZlcnNlKTtcblxuICAgIHRoaXMucmF5Y2FzdGVyLnJheS5kaXJlY3Rpb25cbiAgICAgIC5zZXQocC54LCBwLnksIDAuNSlcbiAgICAgIC5hcHBseU1hdHJpeDQodGhpcy5wcm9qZWN0aW9uTWF0cml4SW52ZXJzZSlcbiAgICAgIC5zdWIodGhpcy5yYXljYXN0ZXIucmF5Lm9yaWdpbilcbiAgICAgIC5ub3JtYWxpemUoKTtcblxuICAgIC8vIGJhY2sgdXAgdGhlIHJheWNhc3RlciBwYXJhbWV0ZXJzXG4gICAgY29uc3Qgb2xkUmF5Y2FzdGVyUGFyYW1zID0gdGhpcy5yYXljYXN0ZXIucGFyYW1zO1xuICAgIGlmIChyYXljYXN0ZXJQYXJhbWV0ZXJzKSB7XG4gICAgICB0aGlzLnJheWNhc3Rlci5wYXJhbXMgPSByYXljYXN0ZXJQYXJhbWV0ZXJzO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdHMgPSB0aGlzLnJheWNhc3Rlci5pbnRlcnNlY3RPYmplY3RzKG9iamVjdHMsIHJlY3Vyc2l2ZSk7XG5cbiAgICAvLyByZXNldCByYXljYXN0ZXIgcGFyYW1zIHRvIHdoYXRldmVyIHRoZXkgd2VyZSBiZWZvcmVcbiAgICB0aGlzLnJheWNhc3Rlci5wYXJhbXMgPSBvbGRSYXljYXN0ZXJQYXJhbXM7XG5cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxuXG4gIC8qKlxuICAgKiBPdmVyd3JpdGUgdGhpcyBtZXRob2QgdG8gaGFuZGxlIGFueSBHTCBzdGF0ZSB1cGRhdGVzIG91dHNpZGUgdGhlXG4gICAqIHJlbmRlciBhbmltYXRpb24gZnJhbWUuXG4gICAqIEBwYXJhbSBvcHRpb25zXG4gICAqL1xuICBwdWJsaWMgb25TdGF0ZVVwZGF0ZShvcHRpb25zOiBnb29nbGUubWFwcy5XZWJHTFN0YXRlT3B0aW9ucyk6IHZvaWQ7XG4gIHB1YmxpYyBvblN0YXRlVXBkYXRlKCk6IHZvaWQge31cblxuICAvKipcbiAgICogT3ZlcndyaXRlIHRoaXMgbWV0aG9kIHRvIGZldGNoIG9yIGNyZWF0ZSBpbnRlcm1lZGlhdGUgZGF0YSBzdHJ1Y3R1cmVzXG4gICAqIGJlZm9yZSB0aGUgb3ZlcmxheSBpcyBkcmF3biB0aGF0IGRvbuKAmXQgcmVxdWlyZSBpbW1lZGlhdGUgYWNjZXNzIHRvIHRoZVxuICAgKiBXZWJHTCByZW5kZXJpbmcgY29udGV4dC5cbiAgICovXG4gIHB1YmxpYyBvbkFkZCgpOiB2b2lkIHt9XG5cbiAgLyoqXG4gICAqIE92ZXJ3cml0ZSB0aGlzIG1ldGhvZCB0byB1cGRhdGUgeW91ciBzY2VuZSBqdXN0IGJlZm9yZSBhIG5ldyBmcmFtZSBpc1xuICAgKiBkcmF3bi5cbiAgICovXG4gIHB1YmxpYyBvbkJlZm9yZURyYXcoKTogdm9pZCB7fVxuXG4gIC8qKlxuICAgKiBUaGlzIG1ldGhvZCBpcyBjYWxsZWQgd2hlbiB0aGUgb3ZlcmxheSBpcyByZW1vdmVkIGZyb20gdGhlIG1hcCB3aXRoXG4gICAqIGBvdmVybGF5LnNldE1hcChudWxsKWAsIGFuZCBpcyB3aGVyZSB5b3UgY2FuIHJlbW92ZSBhbGwgaW50ZXJtZWRpYXRlXG4gICAqIG9iamVjdHMgY3JlYXRlZCBpbiBvbkFkZC5cbiAgICovXG4gIHB1YmxpYyBvblJlbW92ZSgpOiB2b2lkIHt9XG5cbiAgLyoqXG4gICAqIFRyaWdnZXJzIHRoZSBtYXAgdG8gdXBkYXRlIEdMIHN0YXRlLlxuICAgKi9cbiAgcHVibGljIHJlcXVlc3RTdGF0ZVVwZGF0ZSgpOiB2b2lkIHtcbiAgICB0aGlzLm92ZXJsYXkucmVxdWVzdFN0YXRlVXBkYXRlKCk7XG4gIH1cblxuICAvKipcbiAgICogVHJpZ2dlcnMgdGhlIG1hcCB0byByZWRyYXcgYSBmcmFtZS5cbiAgICovXG4gIHB1YmxpYyByZXF1ZXN0UmVkcmF3KCk6IHZvaWQge1xuICAgIHRoaXMub3ZlcmxheS5yZXF1ZXN0UmVkcmF3KCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbWFwIHRoZSBvdmVybGF5IGlzIGFkZGVkIHRvLlxuICAgKi9cbiAgcHVibGljIGdldE1hcCgpOiBnb29nbGUubWFwcy5NYXAge1xuICAgIHJldHVybiB0aGlzLm92ZXJsYXkuZ2V0TWFwKCk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0aGUgb3ZlcmxheSB0byB0aGUgbWFwLlxuICAgKiBAcGFyYW0gbWFwIFRoZSBtYXAgdG8gYWNjZXNzIHRoZSBkaXYsIG1vZGVsIGFuZCB2aWV3IHN0YXRlLlxuICAgKi9cbiAgcHVibGljIHNldE1hcChtYXA6IGdvb2dsZS5tYXBzLk1hcCk6IHZvaWQge1xuICAgIHRoaXMub3ZlcmxheS5zZXRNYXAobWFwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRoZSBnaXZlbiBsaXN0ZW5lciBmdW5jdGlvbiB0byB0aGUgZ2l2ZW4gZXZlbnQgbmFtZS4gUmV0dXJucyBhblxuICAgKiBpZGVudGlmaWVyIGZvciB0aGlzIGxpc3RlbmVyIHRoYXQgY2FuIGJlIHVzZWQgd2l0aFxuICAgKiA8Y29kZT5nb29nbGUubWFwcy5ldmVudC5yZW1vdmVMaXN0ZW5lcjwvY29kZT4uXG4gICAqL1xuICBwdWJsaWMgYWRkTGlzdGVuZXIoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcsXG4gICAgaGFuZGxlcjogKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZFxuICApOiBnb29nbGUubWFwcy5NYXBzRXZlbnRMaXN0ZW5lciB7XG4gICAgcmV0dXJuIHRoaXMub3ZlcmxheS5hZGRMaXN0ZW5lcihldmVudE5hbWUsIGhhbmRsZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGNhbGxlZCBvbmNlIHRoZSByZW5kZXJpbmcgY29udGV4dCBpcyBhdmFpbGFibGUuIFVzZSBpdCB0b1xuICAgKiBpbml0aWFsaXplIG9yIGJpbmQgYW55IFdlYkdMIHN0YXRlIHN1Y2ggYXMgc2hhZGVycyBvciBidWZmZXIgb2JqZWN0cy5cbiAgICogQHBhcmFtIG9wdGlvbnMgdGhhdCBhbGxvdyBkZXZlbG9wZXJzIHRvIHJlc3RvcmUgdGhlIEdMIGNvbnRleHQuXG4gICAqL1xuICBwdWJsaWMgb25Db250ZXh0UmVzdG9yZWQoeyBnbCB9OiBnb29nbGUubWFwcy5XZWJHTFN0YXRlT3B0aW9ucykge1xuICAgIHRoaXMucmVuZGVyZXIgPSBuZXcgV2ViR0xSZW5kZXJlcih7XG4gICAgICBjYW52YXM6IGdsLmNhbnZhcyxcbiAgICAgIGNvbnRleHQ6IGdsLFxuICAgICAgLi4uZ2wuZ2V0Q29udGV4dEF0dHJpYnV0ZXMoKSxcbiAgICB9KTtcbiAgICB0aGlzLnJlbmRlcmVyLmF1dG9DbGVhciA9IGZhbHNlO1xuICAgIHRoaXMucmVuZGVyZXIuYXV0b0NsZWFyRGVwdGggPSBmYWxzZTtcbiAgICB0aGlzLnJlbmRlcmVyLnNoYWRvd01hcC5lbmFibGVkID0gdHJ1ZTtcbiAgICB0aGlzLnJlbmRlcmVyLnNoYWRvd01hcC50eXBlID0gUENGU29mdFNoYWRvd01hcDtcblxuICAgIC8vIFNpbmNlIHIxNTIsIGRlZmF1bHQgb3V0cHV0Q29sb3JTcGFjZSBpcyBTUkdCXG4gICAgLy8gRGVwcmVjYXRlZCBvdXRwdXRFbmNvZGluZyBrZXB0IGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eVxuICAgIGlmIChOdW1iZXIoUkVWSVNJT04pIDwgMTUyKSB0aGlzLnJlbmRlcmVyLm91dHB1dEVuY29kaW5nID0gc1JHQkVuY29kaW5nO1xuXG4gICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0IH0gPSBnbC5jYW52YXM7XG4gICAgdGhpcy5yZW5kZXJlci5zZXRWaWV3cG9ydCgwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIG1ldGhvZCBpcyBjYWxsZWQgd2hlbiB0aGUgcmVuZGVyaW5nIGNvbnRleHQgaXMgbG9zdCBmb3IgYW55IHJlYXNvbixcbiAgICogYW5kIGlzIHdoZXJlIHlvdSBzaG91bGQgY2xlYW4gdXAgYW55IHByZS1leGlzdGluZyBHTCBzdGF0ZSwgc2luY2UgaXQgaXNcbiAgICogbm8gbG9uZ2VyIG5lZWRlZC5cbiAgICovXG4gIHB1YmxpYyBvbkNvbnRleHRMb3N0KCkge1xuICAgIGlmICghdGhpcy5yZW5kZXJlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMucmVuZGVyZXIuZGlzcG9zZSgpO1xuICAgIHRoaXMucmVuZGVyZXIgPSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEltcGxlbWVudCB0aGlzIG1ldGhvZCB0byBkcmF3IFdlYkdMIGNvbnRlbnQgZGlyZWN0bHkgb24gdGhlIG1hcC4gTm90ZVxuICAgKiB0aGF0IGlmIHRoZSBvdmVybGF5IG5lZWRzIGEgbmV3IGZyYW1lIGRyYXduIHRoZW4gY2FsbCB7QGxpbmtcbiAgICogVGhyZWVKU092ZXJsYXlWaWV3LnJlcXVlc3RSZWRyYXd9LlxuICAgKiBAcGFyYW0gb3B0aW9ucyB0aGF0IGFsbG93IGRldmVsb3BlcnMgdG8gcmVuZGVyIGNvbnRlbnQgdG8gYW4gYXNzb2NpYXRlZFxuICAgKiAgICAgR29vZ2xlIGJhc2VtYXAuXG4gICAqL1xuICBwdWJsaWMgb25EcmF3KHsgZ2wsIHRyYW5zZm9ybWVyIH06IGdvb2dsZS5tYXBzLldlYkdMRHJhd09wdGlvbnMpOiB2b2lkIHtcbiAgICB0aGlzLmNhbWVyYS5wcm9qZWN0aW9uTWF0cml4LmZyb21BcnJheShcbiAgICAgIHRyYW5zZm9ybWVyLmZyb21MYXRMbmdBbHRpdHVkZSh0aGlzLmFuY2hvciwgdGhpcy5yb3RhdGlvbkFycmF5KVxuICAgICk7XG5cbiAgICBnbC5kaXNhYmxlKGdsLlNDSVNTT1JfVEVTVCk7XG5cbiAgICB0aGlzLm9uQmVmb3JlRHJhdygpO1xuXG4gICAgdGhpcy5yZW5kZXJlci5yZW5kZXIodGhpcy5zY2VuZSwgdGhpcy5jYW1lcmEpO1xuICAgIHRoaXMucmVuZGVyZXIucmVzZXRTdGF0ZSgpO1xuXG4gICAgaWYgKHRoaXMuYW5pbWF0aW9uTW9kZSA9PT0gXCJhbHdheXNcIikgdGhpcy5yZXF1ZXN0UmVkcmF3KCk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydCBjb29yZGluYXRlcyBmcm9tIFdHUzg0IExhdGl0dWRlIExvbmdpdHVkZSB0byB3b3JsZC1zcGFjZVxuICAgKiBjb29yZGluYXRlcyB3aGlsZSB0YWtpbmcgdGhlIG9yaWdpbiBhbmQgb3JpZW50YXRpb24gaW50byBhY2NvdW50LlxuICAgKi9cbiAgcHVibGljIGxhdExuZ0FsdGl0dWRlVG9WZWN0b3IzKFxuICAgIHBvc2l0aW9uOiBMYXRMbmdUeXBlcyxcbiAgICB0YXJnZXQgPSBuZXcgVmVjdG9yMygpXG4gICkge1xuICAgIGxhdExuZ1RvVmVjdG9yM1JlbGF0aXZlKFxuICAgICAgdG9MYXRMbmdBbHRpdHVkZUxpdGVyYWwocG9zaXRpb24pLFxuICAgICAgdGhpcy5hbmNob3IsXG4gICAgICB0YXJnZXRcbiAgICApO1xuXG4gICAgdGFyZ2V0LmFwcGx5UXVhdGVybmlvbih0aGlzLnJvdGF0aW9uSW52ZXJzZSk7XG5cbiAgICByZXR1cm4gdGFyZ2V0O1xuICB9XG5cbiAgLy8gTVZDT2JqZWN0IGludGVyZmFjZSBmb3J3YXJkZWQgdG8gdGhlIG92ZXJsYXlcblxuICAvKipcbiAgICogQmluZHMgYSBWaWV3IHRvIGEgTW9kZWwuXG4gICAqL1xuICBwdWJsaWMgYmluZFRvKFxuICAgIGtleTogc3RyaW5nLFxuICAgIHRhcmdldDogZ29vZ2xlLm1hcHMuTVZDT2JqZWN0LFxuICAgIHRhcmdldEtleT86IHN0cmluZyxcbiAgICBub05vdGlmeT86IGJvb2xlYW5cbiAgKTogdm9pZCB7XG4gICAgdGhpcy5vdmVybGF5LmJpbmRUbyhrZXksIHRhcmdldCwgdGFyZ2V0S2V5LCBub05vdGlmeSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIHZhbHVlLlxuICAgKi9cbiAgcHVibGljIGdldChrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLm92ZXJsYXkuZ2V0KGtleSk7XG4gIH1cblxuICAvKipcbiAgICogTm90aWZ5IGFsbCBvYnNlcnZlcnMgb2YgYSBjaGFuZ2Ugb24gdGhpcyBwcm9wZXJ0eS4gVGhpcyBub3RpZmllcyBib3RoXG4gICAqIG9iamVjdHMgdGhhdCBhcmUgYm91bmQgdG8gdGhlIG9iamVjdCdzIHByb3BlcnR5IGFzIHdlbGwgYXMgdGhlIG9iamVjdFxuICAgKiB0aGF0IGl0IGlzIGJvdW5kIHRvLlxuICAgKi9cbiAgcHVibGljIG5vdGlmeShrZXk6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMub3ZlcmxheS5ub3RpZnkoa2V5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGEgdmFsdWUuXG4gICAqL1xuICBwdWJsaWMgc2V0KGtleTogc3RyaW5nLCB2YWx1ZTogdW5rbm93bik6IHZvaWQge1xuICAgIHRoaXMub3ZlcmxheS5zZXQoa2V5LCB2YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIGNvbGxlY3Rpb24gb2Yga2V5LXZhbHVlIHBhaXJzLlxuICAgKi9cbiAgcHVibGljIHNldFZhbHVlcyh2YWx1ZXM/OiBvYmplY3QpOiB2b2lkIHtcbiAgICB0aGlzLm92ZXJsYXkuc2V0VmFsdWVzKHZhbHVlcyk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhIGJpbmRpbmcuIFVuYmluZGluZyB3aWxsIHNldCB0aGUgdW5ib3VuZCBwcm9wZXJ0eSB0byB0aGUgY3VycmVudFxuICAgKiB2YWx1ZS4gVGhlIG9iamVjdCB3aWxsIG5vdCBiZSBub3RpZmllZCwgYXMgdGhlIHZhbHVlIGhhcyBub3QgY2hhbmdlZC5cbiAgICovXG4gIHB1YmxpYyB1bmJpbmQoa2V5OiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLm92ZXJsYXkudW5iaW5kKGtleSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhbGwgYmluZGluZ3MuXG4gICAqL1xuICBwdWJsaWMgdW5iaW5kQWxsKCk6IHZvaWQge1xuICAgIHRoaXMub3ZlcmxheS51bmJpbmRBbGwoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGxpZ2h0cyAoZGlyZWN0aW9uYWwgYW5kIGhlbWlzcGhlcmUgbGlnaHQpIHRvIGlsbHVtaW5hdGUgdGhlIG1vZGVsXG4gICAqIChyb3VnaGx5IGFwcHJveGltYXRlcyB0aGUgbGlnaHRpbmcgb2YgYnVpbGRpbmdzIGluIG1hcHMpXG4gICAqL1xuICBwcml2YXRlIGluaXRTY2VuZUxpZ2h0cygpIHtcbiAgICBjb25zdCBoZW1pTGlnaHQgPSBuZXcgSGVtaXNwaGVyZUxpZ2h0KDB4ZmZmZmZmLCAweDQ0NDQ0NCwgMSk7XG4gICAgaGVtaUxpZ2h0LnBvc2l0aW9uLnNldCgwLCAtMC4yLCAxKS5ub3JtYWxpemUoKTtcblxuICAgIGNvbnN0IGRpckxpZ2h0ID0gbmV3IERpcmVjdGlvbmFsTGlnaHQoMHhmZmZmZmYpO1xuICAgIGRpckxpZ2h0LnBvc2l0aW9uLnNldCgwLCAxMCwgMTAwKTtcblxuICAgIHRoaXMuc2NlbmUuYWRkKGhlbWlMaWdodCwgZGlyTGlnaHQpO1xuICB9XG59XG4iLCIvKipcbiAqIENvcHlyaWdodCAyMDIxIEdvb2dsZSBMTENcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7IExPQURFUl9PUFRJT05TLCBNQVBfSUQgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCB7IFRocmVlSlNPdmVybGF5VmlldyB9IGZyb20gXCIuLi9zcmNcIjtcblxuaW1wb3J0IHsgTG9hZGVyIH0gZnJvbSBcIkBnb29nbGVtYXBzL2pzLWFwaS1sb2FkZXJcIjtcbmltcG9ydCB7IEJveEdlb21ldHJ5LCBNZXNoLCBNZXNoTWF0Y2FwTWF0ZXJpYWwgfSBmcm9tIFwidGhyZWVcIjtcblxuY29uc3QgbWFwT3B0aW9ucyA9IHtcbiAgY2VudGVyOiB7XG4gICAgbG5nOiAwLFxuICAgIGxhdDogMCxcbiAgfSxcbiAgbWFwSWQ6IE1BUF9JRCxcbiAgem9vbTogNCxcbiAgdGlsdDogNjcsXG59O1xuXG5uZXcgTG9hZGVyKExPQURFUl9PUFRJT05TKS5sb2FkKCkudGhlbigoKSA9PiB7XG4gIC8vIGNyZWF0ZSB0aGUgbWFwIGFuZCBvdmVybGF5XG4gIGNvbnN0IG1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtYXBcIiksIG1hcE9wdGlvbnMpO1xuICBjb25zdCBvdmVybGF5ID0gbmV3IFRocmVlSlNPdmVybGF5Vmlldyh7IG1hcCB9KTtcblxuICBbXG4gICAgeyBsYXQ6IDQ1LCBsbmc6IC05MCB9LFxuICAgIHsgbGF0OiA0NSwgbG5nOiA5MCB9LFxuICAgIHsgbGF0OiAtNDUsIGxuZzogLTkwIH0sXG4gICAgeyBsYXQ6IC00NSwgbG5nOiA5MCB9LFxuICBdLmZvckVhY2goKGxhdExuZzogZ29vZ2xlLm1hcHMuTGF0TG5nTGl0ZXJhbCkgPT4ge1xuICAgIC8vIGNyZWF0ZSBhIGJveCBtZXNoIHdpdGggb3JpZ2luIG9uIHRoZSBncm91bmQsIGluIHotdXAgb3JpZW50YXRpb25cbiAgICBjb25zdCBnZW9tZXRyeSA9IG5ldyBCb3hHZW9tZXRyeSgxMCwgNTAsIDEwKVxuICAgICAgLnRyYW5zbGF0ZSgwLCAyNSwgMClcbiAgICAgIC5yb3RhdGVYKE1hdGguUEkgLyAyKTtcblxuICAgIGNvbnN0IGJveCA9IG5ldyBNZXNoKGdlb21ldHJ5LCBuZXcgTWVzaE1hdGNhcE1hdGVyaWFsKCkpO1xuXG4gICAgLy8gbWFrZSBpdCBodWdlXG4gICAgYm94LnNjYWxlLm11bHRpcGx5U2NhbGFyKDEwMDAwKTtcblxuICAgIC8vIHNldCBwb3NpdGlvbiBhdCBjZW50ZXIgb2YgbWFwXG4gICAgb3ZlcmxheS5sYXRMbmdBbHRpdHVkZVRvVmVjdG9yMyhsYXRMbmcsIGJveC5wb3NpdGlvbik7XG5cbiAgICAvLyBhZGQgYm94IG1lc2ggdG8gdGhlIHNjZW5lXG4gICAgb3ZlcmxheS5zY2VuZS5hZGQoYm94KTtcbiAgfSk7XG59KTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7Ozs7Ozs7OztBQWNHO0FBSUksTUFB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
