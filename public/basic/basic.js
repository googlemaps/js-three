import { V as Vector3, M as MathUtils, Q as Quaternion, a as Matrix4, R as Raycaster, S as Scene, P as PerspectiveCamera, E as Euler, W as WebGLRenderer, b as PCFSoftShadowMap, c as REVISION, s as sRGBEncoding, H as HemisphereLight, D as DirectionalLight, L as Loader, d as Mesh, B as BoxGeometry, e as MeshMatcapMaterial } from './vendor-07e36ed7.js';

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
        lng: -122.343787,
        lat: 47.607465,
    },
    mapId: MAP_ID,
    zoom: 15,
    heading: 45,
    tilt: 67,
};
new Loader(LOADER_OPTIONS).load().then(() => {
    // create the map and ThreeJS Overlay
    const map = new google.maps.Map(document.getElementById("map"), mapOptions);
    const overlay = new ThreeJSOverlayView({ map });
    // Create a box mesh
    const box = new Mesh(new BoxGeometry(100, 200, 500), new MeshMatcapMaterial());
    // set position at center of map
    const pos = overlay.latLngAltitudeToVector3(mapOptions.center);
    box.position.copy(pos);
    // set position vertically
    box.position.z = 25;
    // add box mesh to the scene
    overlay.scene.add(box);
    // rotate the box using requestAnimationFrame
    const animate = () => {
        box.rotateZ(MathUtils.degToRad(0.1));
        requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzaWMuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2V4YW1wbGVzL2NvbmZpZy50cyIsIi4uLy4uL3NyYy91dGlsLnRzIiwiLi4vLi4vc3JjL3RocmVlLnRzIiwiLi4vLi4vZXhhbXBsZXMvYmFzaWMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgMjAyMSBHb29nbGUgTExDXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuZXhwb3J0IGNvbnN0IE1BUF9JRCA9IFwiN2I5YTg5N2FjZDBhNjNhNFwiO1xuZXhwb3J0IGNvbnN0IExPQURFUl9PUFRJT05TID0ge1xuICAgIGFwaUtleTogXCJBSXphU3lEOHhpYVZQV0IwMk9lUWtKT2VuTGlKemRlVUh6bGh1MDBcIixcbiAgICB2ZXJzaW9uOiBcImJldGFcIixcbiAgICBsaWJyYXJpZXM6IFtdLFxufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWNvbmZpZy5qcy5tYXAiLCIvKipcbiAqIENvcHlyaWdodCAyMDIxIEdvb2dsZSBMTEMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuaW1wb3J0IHsgTWF0aFV0aWxzLCBWZWN0b3IzIH0gZnJvbSBcInRocmVlXCI7XG4vLyBzaG9ydGhhbmRzIGZvciBtYXRoLWZ1bmN0aW9ucywgbWFrZXMgZXF1YXRpb25zIG1vcmUgcmVhZGFibGVcbmNvbnN0IHsgYXRhbiwgY29zLCBleHAsIGxvZywgdGFuLCBQSSB9ID0gTWF0aDtcbmNvbnN0IHsgZGVnVG9SYWQsIHJhZFRvRGVnIH0gPSBNYXRoVXRpbHM7XG5leHBvcnQgY29uc3QgRUFSVEhfUkFESVVTID0gNjM3MTAxMC4wO1xuZXhwb3J0IGNvbnN0IFdPUkxEX1NJWkUgPSBNYXRoLlBJICogRUFSVEhfUkFESVVTO1xuLyoqXG4gKiBDb252ZXJ0cyBhbnkgb2YgdGhlIHN1cHBvcnRlZCBwb3NpdGlvbiBmb3JtYXRzIGludG8gdGhlXG4gKiBnb29nbGUubWFwcy5MYXRMbmdBbHRpdHVkZUxpdGVyYWwgZm9ybWF0IHVzZWQgZm9yIHRoZSBjYWxjdWxhdGlvbnMuXG4gKiBAcGFyYW0gcG9pbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvTGF0TG5nQWx0aXR1ZGVMaXRlcmFsKHBvaW50KSB7XG4gICAgaWYgKHdpbmRvdy5nb29nbGUgJiZcbiAgICAgICAgZ29vZ2xlLm1hcHMgJiZcbiAgICAgICAgKHBvaW50IGluc3RhbmNlb2YgZ29vZ2xlLm1hcHMuTGF0TG5nIHx8XG4gICAgICAgICAgICBwb2ludCBpbnN0YW5jZW9mIGdvb2dsZS5tYXBzLkxhdExuZ0FsdGl0dWRlKSkge1xuICAgICAgICByZXR1cm4geyBhbHRpdHVkZTogMCwgLi4ucG9pbnQudG9KU09OKCkgfTtcbiAgICB9XG4gICAgcmV0dXJuIHsgYWx0aXR1ZGU6IDAsIC4uLnBvaW50IH07XG59XG4vKipcbiAqIENvbnZlcnRzIGxhdGl0dWRlIGFuZCBsb25naXR1ZGUgdG8gd29ybGQgc3BhY2UgY29vcmRpbmF0ZXMgcmVsYXRpdmVcbiAqIHRvIGEgcmVmZXJlbmNlIGxvY2F0aW9uIHdpdGggeSB1cC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxhdExuZ1RvVmVjdG9yM1JlbGF0aXZlKHBvaW50LCByZWZlcmVuY2UsIHRhcmdldCA9IG5ldyBWZWN0b3IzKCkpIHtcbiAgICBjb25zdCBbcHgsIHB5XSA9IGxhdExuZ1RvWFkocG9pbnQpO1xuICAgIGNvbnN0IFtyeCwgcnldID0gbGF0TG5nVG9YWShyZWZlcmVuY2UpO1xuICAgIHRhcmdldC5zZXQocHggLSByeCwgcHkgLSByeSwgMCk7XG4gICAgLy8gYXBwbHkgdGhlIHNwaGVyaWNhbCBtZXJjYXRvciBzY2FsZS1mYWN0b3IgZm9yIHRoZSByZWZlcmVuY2UgbGF0aXR1ZGVcbiAgICB0YXJnZXQubXVsdGlwbHlTY2FsYXIoY29zKGRlZ1RvUmFkKHJlZmVyZW5jZS5sYXQpKSk7XG4gICAgdGFyZ2V0LnogPSBwb2ludC5hbHRpdHVkZSAtIHJlZmVyZW5jZS5hbHRpdHVkZTtcbiAgICByZXR1cm4gdGFyZ2V0O1xufVxuLyoqXG4gKiBDb252ZXJ0cyBXR1M4NCBsYXRpdHVkZSBhbmQgbG9uZ2l0dWRlIHRvICh1bmNvcnJlY3RlZCkgV2ViTWVyY2F0b3IgbWV0ZXJzLlxuICogKFdHUzg0IC0tPiBXZWJNZXJjYXRvciAoRVBTRzozODU3KSlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxhdExuZ1RvWFkocG9zaXRpb24pIHtcbiAgICByZXR1cm4gW1xuICAgICAgICBFQVJUSF9SQURJVVMgKiBkZWdUb1JhZChwb3NpdGlvbi5sbmcpLFxuICAgICAgICBFQVJUSF9SQURJVVMgKiBsb2codGFuKDAuMjUgKiBQSSArIDAuNSAqIGRlZ1RvUmFkKHBvc2l0aW9uLmxhdCkpKSxcbiAgICBdO1xufVxuLyoqXG4gKiBDb252ZXJ0cyBXZWJNZXJjYXRvciBtZXRlcnMgdG8gV0dTODQgbGF0aXR1ZGUvbG9uZ2l0dWRlLlxuICogKFdlYk1lcmNhdG9yIChFUFNHOjM4NTcpIC0tPiBXR1M4NClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHh5VG9MYXRMbmcocCkge1xuICAgIGNvbnN0IFt4LCB5XSA9IHA7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbGF0OiByYWRUb0RlZyhQSSAqIDAuNSAtIDIuMCAqIGF0YW4oZXhwKC15IC8gRUFSVEhfUkFESVVTKSkpLFxuICAgICAgICBsbmc6IHJhZFRvRGVnKHgpIC8gRUFSVEhfUkFESVVTLFxuICAgIH07XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD11dGlsLmpzLm1hcCIsIi8qKlxuICogQ29weXJpZ2h0IDIwMjEgR29vZ2xlIExMQ1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbmltcG9ydCB7IERpcmVjdGlvbmFsTGlnaHQsIEV1bGVyLCBIZW1pc3BoZXJlTGlnaHQsIE1hdGhVdGlscywgTWF0cml4NCwgUENGU29mdFNoYWRvd01hcCwgUGVyc3BlY3RpdmVDYW1lcmEsIFF1YXRlcm5pb24sIFJheWNhc3RlciwgUkVWSVNJT04sIFNjZW5lLCBzUkdCRW5jb2RpbmcsIFZlY3RvcjMsIFdlYkdMUmVuZGVyZXIsIH0gZnJvbSBcInRocmVlXCI7XG5pbXBvcnQgeyBsYXRMbmdUb1ZlY3RvcjNSZWxhdGl2ZSwgdG9MYXRMbmdBbHRpdHVkZUxpdGVyYWwgfSBmcm9tIFwiLi91dGlsXCI7XG5jb25zdCBERUZBVUxUX1VQID0gbmV3IFZlY3RvcjMoMCwgMCwgMSk7XG4vKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZW1wdHktZnVuY3Rpb24gKi9cbi8qKlxuICogQWRkIGEgW3RocmVlLmpzXShodHRwczovL3RocmVlanMub3JnKSBzY2VuZSBhcyBhIFtHb29nbGUgTWFwcyBXZWJHTE92ZXJsYXlWaWV3XShodHRwOi8vZ29vLmdsZS9XZWJHTE92ZXJsYXlWaWV3LXJlZikuXG4gKi9cbmV4cG9ydCBjbGFzcyBUaHJlZUpTT3ZlcmxheVZpZXcge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgICAgICAvKioge0Bpbmhlcml0RG9jIFRocmVlSlNPdmVybGF5Vmlld09wdGlvbnMuYW5pbWF0aW9uTW9kZX0gKi9cbiAgICAgICAgdGhpcy5hbmltYXRpb25Nb2RlID0gXCJvbmRlbWFuZFwiO1xuICAgICAgICB0aGlzLnJvdGF0aW9uQXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgICAgICB0aGlzLnJvdGF0aW9uSW52ZXJzZSA9IG5ldyBRdWF0ZXJuaW9uKCk7XG4gICAgICAgIHRoaXMucHJvamVjdGlvbk1hdHJpeEludmVyc2UgPSBuZXcgTWF0cml4NCgpO1xuICAgICAgICB0aGlzLnJheWNhc3RlciA9IG5ldyBSYXljYXN0ZXIoKTtcbiAgICAgICAgY29uc3QgeyBhbmNob3IgPSB7IGxhdDogMCwgbG5nOiAwLCBhbHRpdHVkZTogMCB9LCB1cEF4aXMgPSBcIlpcIiwgc2NlbmUsIG1hcCwgYW5pbWF0aW9uTW9kZSA9IFwib25kZW1hbmRcIiwgYWRkRGVmYXVsdExpZ2h0aW5nID0gdHJ1ZSwgfSA9IG9wdGlvbnM7XG4gICAgICAgIHRoaXMub3ZlcmxheSA9IG5ldyBnb29nbGUubWFwcy5XZWJHTE92ZXJsYXlWaWV3KCk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmNhbWVyYSA9IG51bGw7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9uTW9kZSA9IGFuaW1hdGlvbk1vZGU7XG4gICAgICAgIHRoaXMuc2V0QW5jaG9yKGFuY2hvcik7XG4gICAgICAgIHRoaXMuc2V0VXBBeGlzKHVwQXhpcyk7XG4gICAgICAgIHRoaXMuc2NlbmUgPSBzY2VuZSA/PyBuZXcgU2NlbmUoKTtcbiAgICAgICAgaWYgKGFkZERlZmF1bHRMaWdodGluZylcbiAgICAgICAgICAgIHRoaXMuaW5pdFNjZW5lTGlnaHRzKCk7XG4gICAgICAgIHRoaXMub3ZlcmxheS5vbkFkZCA9IHRoaXMub25BZGQuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5vdmVybGF5Lm9uUmVtb3ZlID0gdGhpcy5vblJlbW92ZS5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLm92ZXJsYXkub25Db250ZXh0TG9zdCA9IHRoaXMub25Db250ZXh0TG9zdC5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLm92ZXJsYXkub25Db250ZXh0UmVzdG9yZWQgPSB0aGlzLm9uQ29udGV4dFJlc3RvcmVkLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMub3ZlcmxheS5vblN0YXRlVXBkYXRlID0gdGhpcy5vblN0YXRlVXBkYXRlLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMub3ZlcmxheS5vbkRyYXcgPSB0aGlzLm9uRHJhdy5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLmNhbWVyYSA9IG5ldyBQZXJzcGVjdGl2ZUNhbWVyYSgpO1xuICAgICAgICBpZiAobWFwKSB7XG4gICAgICAgICAgICB0aGlzLnNldE1hcChtYXApO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIGFuY2hvci1wb2ludC5cbiAgICAgKiBAcGFyYW0gYW5jaG9yXG4gICAgICovXG4gICAgc2V0QW5jaG9yKGFuY2hvcikge1xuICAgICAgICB0aGlzLmFuY2hvciA9IHRvTGF0TG5nQWx0aXR1ZGVMaXRlcmFsKGFuY2hvcik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIGF4aXMgdG8gdXNlIGFzIFwidXBcIiBpbiB0aGUgc2NlbmUuXG4gICAgICogQHBhcmFtIGF4aXNcbiAgICAgKi9cbiAgICBzZXRVcEF4aXMoYXhpcykge1xuICAgICAgICBjb25zdCB1cFZlY3RvciA9IG5ldyBWZWN0b3IzKDAsIDAsIDEpO1xuICAgICAgICBpZiAodHlwZW9mIGF4aXMgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHVwVmVjdG9yLmNvcHkoYXhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAoYXhpcy50b0xvd2VyQ2FzZSgpID09PSBcInlcIikge1xuICAgICAgICAgICAgICAgIHVwVmVjdG9yLnNldCgwLCAxLCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGF4aXMudG9Mb3dlckNhc2UoKSAhPT0gXCJ6XCIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYGludmFsaWQgdmFsdWUgJyR7YXhpc30nIHNwZWNpZmllZCBhcyB1cEF4aXNgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB1cFZlY3Rvci5ub3JtYWxpemUoKTtcbiAgICAgICAgY29uc3QgcSA9IG5ldyBRdWF0ZXJuaW9uKCk7XG4gICAgICAgIHEuc2V0RnJvbVVuaXRWZWN0b3JzKHVwVmVjdG9yLCBERUZBVUxUX1VQKTtcbiAgICAgICAgLy8gaW52ZXJzZSByb3RhdGlvbiBpcyBuZWVkZWQgaW4gbGF0TG5nQWx0aXR1ZGVUb1ZlY3RvcjMoKVxuICAgICAgICB0aGlzLnJvdGF0aW9uSW52ZXJzZS5jb3B5KHEpLmludmVydCgpO1xuICAgICAgICAvLyBjb3B5IHRvIHJvdGF0aW9uQXJyYXkgZm9yIHRyYW5zZm9ybWVyLmZyb21MYXRMbmdBbHRpdHVkZSgpXG4gICAgICAgIGNvbnN0IGV1bGVyID0gbmV3IEV1bGVyKCkuc2V0RnJvbVF1YXRlcm5pb24ocSwgXCJYWVpcIik7XG4gICAgICAgIHRoaXMucm90YXRpb25BcnJheVswXSA9IE1hdGhVdGlscy5yYWRUb0RlZyhldWxlci54KTtcbiAgICAgICAgdGhpcy5yb3RhdGlvbkFycmF5WzFdID0gTWF0aFV0aWxzLnJhZFRvRGVnKGV1bGVyLnkpO1xuICAgICAgICB0aGlzLnJvdGF0aW9uQXJyYXlbMl0gPSBNYXRoVXRpbHMucmFkVG9EZWcoZXVsZXIueik7XG4gICAgfVxuICAgIC8vIGltcGxlbWV0YXRpb25cbiAgICByYXljYXN0KHAsIG9wdGlvbnNPck9iamVjdHMsIG9wdGlvbnMgPSB7fSkge1xuICAgICAgICBsZXQgb2JqZWN0cztcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9uc09yT2JqZWN0cykpIHtcbiAgICAgICAgICAgIG9iamVjdHMgPSBvcHRpb25zT3JPYmplY3RzIHx8IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBvYmplY3RzID0gW3RoaXMuc2NlbmVdO1xuICAgICAgICAgICAgb3B0aW9ucyA9IHsgLi4ub3B0aW9uc09yT2JqZWN0cywgcmVjdXJzaXZlOiB0cnVlIH07XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgeyB1cGRhdGVNYXRyaXggPSB0cnVlLCByZWN1cnNpdmUgPSBmYWxzZSwgcmF5Y2FzdGVyUGFyYW1ldGVycywgfSA9IG9wdGlvbnM7XG4gICAgICAgIC8vIHdoZW4gYHJheWNhc3QoKWAgaXMgY2FsbGVkIGZyb20gd2l0aGluIHRoZSBgb25CZWZvcmVSZW5kZXIoKWAgY2FsbGJhY2ssXG4gICAgICAgIC8vIHRoZSBtdnAtbWF0cml4IGZvciB0aGlzIGZyYW1lIGhhcyBhbHJlYWR5IGJlZW4gY29tcHV0ZWQgYW5kIHN0b3JlZCBpblxuICAgICAgICAvLyBgdGhpcy5jYW1lcmEucHJvamVjdGlvbk1hdHJpeGAuXG4gICAgICAgIC8vIFRoZSBtdnAtbWF0cml4IHRyYW5zZm9ybXMgd29ybGQtc3BhY2UgbWV0ZXJzIHRvIGNsaXAtc3BhY2VcbiAgICAgICAgLy8gY29vcmRpbmF0ZXMuIFRoZSBpbnZlcnNlIG1hdHJpeCBjcmVhdGVkIGhlcmUgZG9lcyB0aGUgZXhhY3Qgb3Bwb3NpdGVcbiAgICAgICAgLy8gYW5kIGNvbnZlcnRzIGNsaXAtc3BhY2UgY29vcmRpbmF0ZXMgdG8gd29ybGQtc3BhY2UuXG4gICAgICAgIGlmICh1cGRhdGVNYXRyaXgpIHtcbiAgICAgICAgICAgIHRoaXMucHJvamVjdGlvbk1hdHJpeEludmVyc2UuY29weSh0aGlzLmNhbWVyYS5wcm9qZWN0aW9uTWF0cml4KS5pbnZlcnQoKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBjcmVhdGUgdHdvIHBvaW50cyAod2l0aCBkaWZmZXJlbnQgZGVwdGgpIGZyb20gdGhlIG1vdXNlLXBvc2l0aW9uIGFuZFxuICAgICAgICAvLyBjb252ZXJ0IHRoZW0gaW50byB3b3JsZC1zcGFjZSBjb29yZGluYXRlcyB0byBzZXQgdXAgdGhlIHJheS5cbiAgICAgICAgdGhpcy5yYXljYXN0ZXIucmF5Lm9yaWdpblxuICAgICAgICAgICAgLnNldChwLngsIHAueSwgMClcbiAgICAgICAgICAgIC5hcHBseU1hdHJpeDQodGhpcy5wcm9qZWN0aW9uTWF0cml4SW52ZXJzZSk7XG4gICAgICAgIHRoaXMucmF5Y2FzdGVyLnJheS5kaXJlY3Rpb25cbiAgICAgICAgICAgIC5zZXQocC54LCBwLnksIDAuNSlcbiAgICAgICAgICAgIC5hcHBseU1hdHJpeDQodGhpcy5wcm9qZWN0aW9uTWF0cml4SW52ZXJzZSlcbiAgICAgICAgICAgIC5zdWIodGhpcy5yYXljYXN0ZXIucmF5Lm9yaWdpbilcbiAgICAgICAgICAgIC5ub3JtYWxpemUoKTtcbiAgICAgICAgLy8gYmFjayB1cCB0aGUgcmF5Y2FzdGVyIHBhcmFtZXRlcnNcbiAgICAgICAgY29uc3Qgb2xkUmF5Y2FzdGVyUGFyYW1zID0gdGhpcy5yYXljYXN0ZXIucGFyYW1zO1xuICAgICAgICBpZiAocmF5Y2FzdGVyUGFyYW1ldGVycykge1xuICAgICAgICAgICAgdGhpcy5yYXljYXN0ZXIucGFyYW1zID0gcmF5Y2FzdGVyUGFyYW1ldGVycztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXN1bHRzID0gdGhpcy5yYXljYXN0ZXIuaW50ZXJzZWN0T2JqZWN0cyhvYmplY3RzLCByZWN1cnNpdmUpO1xuICAgICAgICAvLyByZXNldCByYXljYXN0ZXIgcGFyYW1zIHRvIHdoYXRldmVyIHRoZXkgd2VyZSBiZWZvcmVcbiAgICAgICAgdGhpcy5yYXljYXN0ZXIucGFyYW1zID0gb2xkUmF5Y2FzdGVyUGFyYW1zO1xuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9XG4gICAgb25TdGF0ZVVwZGF0ZSgpIHsgfVxuICAgIC8qKlxuICAgICAqIE92ZXJ3cml0ZSB0aGlzIG1ldGhvZCB0byBmZXRjaCBvciBjcmVhdGUgaW50ZXJtZWRpYXRlIGRhdGEgc3RydWN0dXJlc1xuICAgICAqIGJlZm9yZSB0aGUgb3ZlcmxheSBpcyBkcmF3biB0aGF0IGRvbuKAmXQgcmVxdWlyZSBpbW1lZGlhdGUgYWNjZXNzIHRvIHRoZVxuICAgICAqIFdlYkdMIHJlbmRlcmluZyBjb250ZXh0LlxuICAgICAqL1xuICAgIG9uQWRkKCkgeyB9XG4gICAgLyoqXG4gICAgICogT3ZlcndyaXRlIHRoaXMgbWV0aG9kIHRvIHVwZGF0ZSB5b3VyIHNjZW5lIGp1c3QgYmVmb3JlIGEgbmV3IGZyYW1lIGlzXG4gICAgICogZHJhd24uXG4gICAgICovXG4gICAgb25CZWZvcmVEcmF3KCkgeyB9XG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgaXMgY2FsbGVkIHdoZW4gdGhlIG92ZXJsYXkgaXMgcmVtb3ZlZCBmcm9tIHRoZSBtYXAgd2l0aFxuICAgICAqIGBvdmVybGF5LnNldE1hcChudWxsKWAsIGFuZCBpcyB3aGVyZSB5b3UgY2FuIHJlbW92ZSBhbGwgaW50ZXJtZWRpYXRlXG4gICAgICogb2JqZWN0cyBjcmVhdGVkIGluIG9uQWRkLlxuICAgICAqL1xuICAgIG9uUmVtb3ZlKCkgeyB9XG4gICAgLyoqXG4gICAgICogVHJpZ2dlcnMgdGhlIG1hcCB0byB1cGRhdGUgR0wgc3RhdGUuXG4gICAgICovXG4gICAgcmVxdWVzdFN0YXRlVXBkYXRlKCkge1xuICAgICAgICB0aGlzLm92ZXJsYXkucmVxdWVzdFN0YXRlVXBkYXRlKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFRyaWdnZXJzIHRoZSBtYXAgdG8gcmVkcmF3IGEgZnJhbWUuXG4gICAgICovXG4gICAgcmVxdWVzdFJlZHJhdygpIHtcbiAgICAgICAgdGhpcy5vdmVybGF5LnJlcXVlc3RSZWRyYXcoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgbWFwIHRoZSBvdmVybGF5IGlzIGFkZGVkIHRvLlxuICAgICAqL1xuICAgIGdldE1hcCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3ZlcmxheS5nZXRNYXAoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyB0aGUgb3ZlcmxheSB0byB0aGUgbWFwLlxuICAgICAqIEBwYXJhbSBtYXAgVGhlIG1hcCB0byBhY2Nlc3MgdGhlIGRpdiwgbW9kZWwgYW5kIHZpZXcgc3RhdGUuXG4gICAgICovXG4gICAgc2V0TWFwKG1hcCkge1xuICAgICAgICB0aGlzLm92ZXJsYXkuc2V0TWFwKG1hcCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgdGhlIGdpdmVuIGxpc3RlbmVyIGZ1bmN0aW9uIHRvIHRoZSBnaXZlbiBldmVudCBuYW1lLiBSZXR1cm5zIGFuXG4gICAgICogaWRlbnRpZmllciBmb3IgdGhpcyBsaXN0ZW5lciB0aGF0IGNhbiBiZSB1c2VkIHdpdGhcbiAgICAgKiA8Y29kZT5nb29nbGUubWFwcy5ldmVudC5yZW1vdmVMaXN0ZW5lcjwvY29kZT4uXG4gICAgICovXG4gICAgYWRkTGlzdGVuZXIoZXZlbnROYW1lLCBoYW5kbGVyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm92ZXJsYXkuYWRkTGlzdGVuZXIoZXZlbnROYW1lLCBoYW5kbGVyKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgaXMgY2FsbGVkIG9uY2UgdGhlIHJlbmRlcmluZyBjb250ZXh0IGlzIGF2YWlsYWJsZS4gVXNlIGl0IHRvXG4gICAgICogaW5pdGlhbGl6ZSBvciBiaW5kIGFueSBXZWJHTCBzdGF0ZSBzdWNoIGFzIHNoYWRlcnMgb3IgYnVmZmVyIG9iamVjdHMuXG4gICAgICogQHBhcmFtIG9wdGlvbnMgdGhhdCBhbGxvdyBkZXZlbG9wZXJzIHRvIHJlc3RvcmUgdGhlIEdMIGNvbnRleHQuXG4gICAgICovXG4gICAgb25Db250ZXh0UmVzdG9yZWQoeyBnbCB9KSB7XG4gICAgICAgIHRoaXMucmVuZGVyZXIgPSBuZXcgV2ViR0xSZW5kZXJlcih7XG4gICAgICAgICAgICBjYW52YXM6IGdsLmNhbnZhcyxcbiAgICAgICAgICAgIGNvbnRleHQ6IGdsLFxuICAgICAgICAgICAgLi4uZ2wuZ2V0Q29udGV4dEF0dHJpYnV0ZXMoKSxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuYXV0b0NsZWFyID0gZmFsc2U7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuYXV0b0NsZWFyRGVwdGggPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zaGFkb3dNYXAuZW5hYmxlZCA9IHRydWU7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2hhZG93TWFwLnR5cGUgPSBQQ0ZTb2Z0U2hhZG93TWFwO1xuICAgICAgICAvLyBTaW5jZSByMTUyLCBkZWZhdWx0IG91dHB1dENvbG9yU3BhY2UgaXMgU1JHQlxuICAgICAgICAvLyBEZXByZWNhdGVkIG91dHB1dEVuY29kaW5nIGtlcHQgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG4gICAgICAgIGlmIChOdW1iZXIoUkVWSVNJT04pIDwgMTUyKVxuICAgICAgICAgICAgdGhpcy5yZW5kZXJlci5vdXRwdXRFbmNvZGluZyA9IHNSR0JFbmNvZGluZztcbiAgICAgICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0IH0gPSBnbC5jYW52YXM7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0Vmlld3BvcnQoMCwgMCwgd2lkdGgsIGhlaWdodCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIGNhbGxlZCB3aGVuIHRoZSByZW5kZXJpbmcgY29udGV4dCBpcyBsb3N0IGZvciBhbnkgcmVhc29uLFxuICAgICAqIGFuZCBpcyB3aGVyZSB5b3Ugc2hvdWxkIGNsZWFuIHVwIGFueSBwcmUtZXhpc3RpbmcgR0wgc3RhdGUsIHNpbmNlIGl0IGlzXG4gICAgICogbm8gbG9uZ2VyIG5lZWRlZC5cbiAgICAgKi9cbiAgICBvbkNvbnRleHRMb3N0KCkge1xuICAgICAgICBpZiAoIXRoaXMucmVuZGVyZXIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlbmRlcmVyLmRpc3Bvc2UoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlciA9IG51bGw7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEltcGxlbWVudCB0aGlzIG1ldGhvZCB0byBkcmF3IFdlYkdMIGNvbnRlbnQgZGlyZWN0bHkgb24gdGhlIG1hcC4gTm90ZVxuICAgICAqIHRoYXQgaWYgdGhlIG92ZXJsYXkgbmVlZHMgYSBuZXcgZnJhbWUgZHJhd24gdGhlbiBjYWxsIHtAbGlua1xuICAgICAqIFRocmVlSlNPdmVybGF5Vmlldy5yZXF1ZXN0UmVkcmF3fS5cbiAgICAgKiBAcGFyYW0gb3B0aW9ucyB0aGF0IGFsbG93IGRldmVsb3BlcnMgdG8gcmVuZGVyIGNvbnRlbnQgdG8gYW4gYXNzb2NpYXRlZFxuICAgICAqICAgICBHb29nbGUgYmFzZW1hcC5cbiAgICAgKi9cbiAgICBvbkRyYXcoeyBnbCwgdHJhbnNmb3JtZXIgfSkge1xuICAgICAgICB0aGlzLmNhbWVyYS5wcm9qZWN0aW9uTWF0cml4LmZyb21BcnJheSh0cmFuc2Zvcm1lci5mcm9tTGF0TG5nQWx0aXR1ZGUodGhpcy5hbmNob3IsIHRoaXMucm90YXRpb25BcnJheSkpO1xuICAgICAgICBnbC5kaXNhYmxlKGdsLlNDSVNTT1JfVEVTVCk7XG4gICAgICAgIHRoaXMub25CZWZvcmVEcmF3KCk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIucmVuZGVyKHRoaXMuc2NlbmUsIHRoaXMuY2FtZXJhKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5yZXNldFN0YXRlKCk7XG4gICAgICAgIGlmICh0aGlzLmFuaW1hdGlvbk1vZGUgPT09IFwiYWx3YXlzXCIpXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3RSZWRyYXcoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ29udmVydCBjb29yZGluYXRlcyBmcm9tIFdHUzg0IExhdGl0dWRlIExvbmdpdHVkZSB0byB3b3JsZC1zcGFjZVxuICAgICAqIGNvb3JkaW5hdGVzIHdoaWxlIHRha2luZyB0aGUgb3JpZ2luIGFuZCBvcmllbnRhdGlvbiBpbnRvIGFjY291bnQuXG4gICAgICovXG4gICAgbGF0TG5nQWx0aXR1ZGVUb1ZlY3RvcjMocG9zaXRpb24sIHRhcmdldCA9IG5ldyBWZWN0b3IzKCkpIHtcbiAgICAgICAgbGF0TG5nVG9WZWN0b3IzUmVsYXRpdmUodG9MYXRMbmdBbHRpdHVkZUxpdGVyYWwocG9zaXRpb24pLCB0aGlzLmFuY2hvciwgdGFyZ2V0KTtcbiAgICAgICAgdGFyZ2V0LmFwcGx5UXVhdGVybmlvbih0aGlzLnJvdGF0aW9uSW52ZXJzZSk7XG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfVxuICAgIC8vIE1WQ09iamVjdCBpbnRlcmZhY2UgZm9yd2FyZGVkIHRvIHRoZSBvdmVybGF5XG4gICAgLyoqXG4gICAgICogQmluZHMgYSBWaWV3IHRvIGEgTW9kZWwuXG4gICAgICovXG4gICAgYmluZFRvKGtleSwgdGFyZ2V0LCB0YXJnZXRLZXksIG5vTm90aWZ5KSB7XG4gICAgICAgIHRoaXMub3ZlcmxheS5iaW5kVG8oa2V5LCB0YXJnZXQsIHRhcmdldEtleSwgbm9Ob3RpZnkpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBHZXRzIGEgdmFsdWUuXG4gICAgICovXG4gICAgZ2V0KGtleSkge1xuICAgICAgICByZXR1cm4gdGhpcy5vdmVybGF5LmdldChrZXkpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBOb3RpZnkgYWxsIG9ic2VydmVycyBvZiBhIGNoYW5nZSBvbiB0aGlzIHByb3BlcnR5LiBUaGlzIG5vdGlmaWVzIGJvdGhcbiAgICAgKiBvYmplY3RzIHRoYXQgYXJlIGJvdW5kIHRvIHRoZSBvYmplY3QncyBwcm9wZXJ0eSBhcyB3ZWxsIGFzIHRoZSBvYmplY3RcbiAgICAgKiB0aGF0IGl0IGlzIGJvdW5kIHRvLlxuICAgICAqL1xuICAgIG5vdGlmeShrZXkpIHtcbiAgICAgICAgdGhpcy5vdmVybGF5Lm5vdGlmeShrZXkpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZXRzIGEgdmFsdWUuXG4gICAgICovXG4gICAgc2V0KGtleSwgdmFsdWUpIHtcbiAgICAgICAgdGhpcy5vdmVybGF5LnNldChrZXksIHZhbHVlKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0cyBhIGNvbGxlY3Rpb24gb2Yga2V5LXZhbHVlIHBhaXJzLlxuICAgICAqL1xuICAgIHNldFZhbHVlcyh2YWx1ZXMpIHtcbiAgICAgICAgdGhpcy5vdmVybGF5LnNldFZhbHVlcyh2YWx1ZXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGEgYmluZGluZy4gVW5iaW5kaW5nIHdpbGwgc2V0IHRoZSB1bmJvdW5kIHByb3BlcnR5IHRvIHRoZSBjdXJyZW50XG4gICAgICogdmFsdWUuIFRoZSBvYmplY3Qgd2lsbCBub3QgYmUgbm90aWZpZWQsIGFzIHRoZSB2YWx1ZSBoYXMgbm90IGNoYW5nZWQuXG4gICAgICovXG4gICAgdW5iaW5kKGtleSkge1xuICAgICAgICB0aGlzLm92ZXJsYXkudW5iaW5kKGtleSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgYWxsIGJpbmRpbmdzLlxuICAgICAqL1xuICAgIHVuYmluZEFsbCgpIHtcbiAgICAgICAgdGhpcy5vdmVybGF5LnVuYmluZEFsbCgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGxpZ2h0cyAoZGlyZWN0aW9uYWwgYW5kIGhlbWlzcGhlcmUgbGlnaHQpIHRvIGlsbHVtaW5hdGUgdGhlIG1vZGVsXG4gICAgICogKHJvdWdobHkgYXBwcm94aW1hdGVzIHRoZSBsaWdodGluZyBvZiBidWlsZGluZ3MgaW4gbWFwcylcbiAgICAgKi9cbiAgICBpbml0U2NlbmVMaWdodHMoKSB7XG4gICAgICAgIGNvbnN0IGhlbWlMaWdodCA9IG5ldyBIZW1pc3BoZXJlTGlnaHQoMHhmZmZmZmYsIDB4NDQ0NDQ0LCAxKTtcbiAgICAgICAgaGVtaUxpZ2h0LnBvc2l0aW9uLnNldCgwLCAtMC4yLCAxKS5ub3JtYWxpemUoKTtcbiAgICAgICAgY29uc3QgZGlyTGlnaHQgPSBuZXcgRGlyZWN0aW9uYWxMaWdodCgweGZmZmZmZik7XG4gICAgICAgIGRpckxpZ2h0LnBvc2l0aW9uLnNldCgwLCAxMCwgMTAwKTtcbiAgICAgICAgdGhpcy5zY2VuZS5hZGQoaGVtaUxpZ2h0LCBkaXJMaWdodCk7XG4gICAgfVxufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dGhyZWUuanMubWFwIiwiLyoqXG4gKiBDb3B5cmlnaHQgMjAyMSBHb29nbGUgTExDXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuaW1wb3J0IHsgTE9BREVSX09QVElPTlMsIE1BUF9JRCB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IHsgVGhyZWVKU092ZXJsYXlWaWV3IH0gZnJvbSBcIi4uL3NyY1wiO1xuaW1wb3J0IHsgTG9hZGVyIH0gZnJvbSBcIkBnb29nbGVtYXBzL2pzLWFwaS1sb2FkZXJcIjtcbmltcG9ydCB7IEJveEdlb21ldHJ5LCBNYXRoVXRpbHMsIE1lc2gsIE1lc2hNYXRjYXBNYXRlcmlhbCB9IGZyb20gXCJ0aHJlZVwiO1xuY29uc3QgbWFwT3B0aW9ucyA9IHtcbiAgICBjZW50ZXI6IHtcbiAgICAgICAgbG5nOiAtMTIyLjM0Mzc4NyxcbiAgICAgICAgbGF0OiA0Ny42MDc0NjUsXG4gICAgfSxcbiAgICBtYXBJZDogTUFQX0lELFxuICAgIHpvb206IDE1LFxuICAgIGhlYWRpbmc6IDQ1LFxuICAgIHRpbHQ6IDY3LFxufTtcbm5ldyBMb2FkZXIoTE9BREVSX09QVElPTlMpLmxvYWQoKS50aGVuKCgpID0+IHtcbiAgICAvLyBjcmVhdGUgdGhlIG1hcCBhbmQgVGhyZWVKUyBPdmVybGF5XG4gICAgY29uc3QgbWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1hcFwiKSwgbWFwT3B0aW9ucyk7XG4gICAgY29uc3Qgb3ZlcmxheSA9IG5ldyBUaHJlZUpTT3ZlcmxheVZpZXcoeyBtYXAgfSk7XG4gICAgLy8gQ3JlYXRlIGEgYm94IG1lc2hcbiAgICBjb25zdCBib3ggPSBuZXcgTWVzaChuZXcgQm94R2VvbWV0cnkoMTAwLCAyMDAsIDUwMCksIG5ldyBNZXNoTWF0Y2FwTWF0ZXJpYWwoKSk7XG4gICAgLy8gc2V0IHBvc2l0aW9uIGF0IGNlbnRlciBvZiBtYXBcbiAgICBjb25zdCBwb3MgPSBvdmVybGF5LmxhdExuZ0FsdGl0dWRlVG9WZWN0b3IzKG1hcE9wdGlvbnMuY2VudGVyKTtcbiAgICBib3gucG9zaXRpb24uY29weShwb3MpO1xuICAgIC8vIHNldCBwb3NpdGlvbiB2ZXJ0aWNhbGx5XG4gICAgYm94LnBvc2l0aW9uLnogPSAyNTtcbiAgICAvLyBhZGQgYm94IG1lc2ggdG8gdGhlIHNjZW5lXG4gICAgb3ZlcmxheS5zY2VuZS5hZGQoYm94KTtcbiAgICAvLyByb3RhdGUgdGhlIGJveCB1c2luZyByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICBjb25zdCBhbmltYXRlID0gKCkgPT4ge1xuICAgICAgICBib3gucm90YXRlWihNYXRoVXRpbHMuZGVnVG9SYWQoMC4xKSk7XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRlKTtcbiAgICB9O1xuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRlKTtcbn0pO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YmFzaWMuanMubWFwIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ08sTUFBTSxNQUFNLEdBQUcsa0JBQWtCLENBQUM7QUFDbEMsTUFBTSxjQUFjLEdBQUc7QUFDOUIsSUFBSSxNQUFNLEVBQUUseUNBQXlDO0FBQ3JELElBQUksT0FBTyxFQUFFLE1BQU07QUFDbkIsSUFBSSxTQUFTLEVBQUUsRUFBRTtBQUNqQixDQUFDOztBQ3BCRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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
