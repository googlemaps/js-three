import { V as Vector3, M as MathUtils, Q as Quaternion, a as Matrix4, R as Raycaster, S as Scene, P as PerspectiveCamera, E as Euler, W as WebGLRenderer, b as PCFSoftShadowMap, c as REVISION, H as HemisphereLight, D as DirectionalLight, L as Loader, A as AxesHelper } from './vendor-CJPzZWqr.js';

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
const WORLD_SIZE = Math.PI * EARTH_RADIUS;
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
// Since r162, the sRGBEncoding constant is no longer exported from three.
// The value is kept here to keep compatibility with older three.js versions.
// This will be removed with the next major release.
const sRGBEncoding = 3001;
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
        if (Number(REVISION) < 152) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.renderer.outputEncoding = sRGBEncoding;
        }
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
    const overlay = new ThreeJSOverlayView({
        anchor: { ...mapOptions.center, altitude: 0 },
        map,
    });
    overlay.scene.add(new AxesHelper(WORLD_SIZE));
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5jaG9yLmpzIiwic291cmNlcyI6WyIuLi8uLi9leGFtcGxlcy9jb25maWcudHMiLCIuLi8uLi9zcmMvdXRpbC50cyIsIi4uLy4uL3NyYy90aHJlZS50cyIsIi4uLy4uL2V4YW1wbGVzL2FuY2hvci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAyMDIxIEdvb2dsZSBMTENcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7IExvYWRlck9wdGlvbnMgfSBmcm9tIFwiQGdvb2dsZW1hcHMvanMtYXBpLWxvYWRlclwiO1xuXG5leHBvcnQgY29uc3QgTUFQX0lEID0gXCI3YjlhODk3YWNkMGE2M2E0XCI7XG5cbmV4cG9ydCBjb25zdCBMT0FERVJfT1BUSU9OUzogTG9hZGVyT3B0aW9ucyA9IHtcbiAgYXBpS2V5OiBcIkFJemFTeUQ4eGlhVlBXQjAyT2VRa0pPZW5MaUp6ZGVVSHpsaHUwMFwiLFxuICB2ZXJzaW9uOiBcImJldGFcIixcbiAgbGlicmFyaWVzOiBbXSxcbn07XG4iLCIvKipcbiAqIENvcHlyaWdodCAyMDIxIEdvb2dsZSBMTEMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgeyBNYXRoVXRpbHMsIFZlY3RvcjMgfSBmcm9tIFwidGhyZWVcIjtcblxuZXhwb3J0IHR5cGUgTGF0TG5nVHlwZXMgPVxuICB8IGdvb2dsZS5tYXBzLkxhdExuZ0xpdGVyYWxcbiAgfCBnb29nbGUubWFwcy5MYXRMbmdcbiAgfCBnb29nbGUubWFwcy5MYXRMbmdBbHRpdHVkZUxpdGVyYWxcbiAgfCBnb29nbGUubWFwcy5MYXRMbmdBbHRpdHVkZTtcblxuLy8gc2hvcnRoYW5kcyBmb3IgbWF0aC1mdW5jdGlvbnMsIG1ha2VzIGVxdWF0aW9ucyBtb3JlIHJlYWRhYmxlXG5jb25zdCB7IGF0YW4sIGNvcywgZXhwLCBsb2csIHRhbiwgUEkgfSA9IE1hdGg7XG5jb25zdCB7IGRlZ1RvUmFkLCByYWRUb0RlZyB9ID0gTWF0aFV0aWxzO1xuXG5leHBvcnQgY29uc3QgRUFSVEhfUkFESVVTID0gNjM3MTAxMC4wO1xuZXhwb3J0IGNvbnN0IFdPUkxEX1NJWkUgPSBNYXRoLlBJICogRUFSVEhfUkFESVVTO1xuXG4vKipcbiAqIENvbnZlcnRzIGFueSBvZiB0aGUgc3VwcG9ydGVkIHBvc2l0aW9uIGZvcm1hdHMgaW50byB0aGVcbiAqIGdvb2dsZS5tYXBzLkxhdExuZ0FsdGl0dWRlTGl0ZXJhbCBmb3JtYXQgdXNlZCBmb3IgdGhlIGNhbGN1bGF0aW9ucy5cbiAqIEBwYXJhbSBwb2ludFxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9MYXRMbmdBbHRpdHVkZUxpdGVyYWwoXG4gIHBvaW50OiBMYXRMbmdUeXBlc1xuKTogZ29vZ2xlLm1hcHMuTGF0TG5nQWx0aXR1ZGVMaXRlcmFsIHtcbiAgaWYgKFxuICAgIHdpbmRvdy5nb29nbGUgJiZcbiAgICBnb29nbGUubWFwcyAmJlxuICAgIChwb2ludCBpbnN0YW5jZW9mIGdvb2dsZS5tYXBzLkxhdExuZyB8fFxuICAgICAgcG9pbnQgaW5zdGFuY2VvZiBnb29nbGUubWFwcy5MYXRMbmdBbHRpdHVkZSlcbiAgKSB7XG4gICAgcmV0dXJuIHsgYWx0aXR1ZGU6IDAsIC4uLnBvaW50LnRvSlNPTigpIH07XG4gIH1cblxuICByZXR1cm4geyBhbHRpdHVkZTogMCwgLi4uKHBvaW50IGFzIGdvb2dsZS5tYXBzLkxhdExuZ0xpdGVyYWwpIH07XG59XG5cbi8qKlxuICogQ29udmVydHMgbGF0aXR1ZGUgYW5kIGxvbmdpdHVkZSB0byB3b3JsZCBzcGFjZSBjb29yZGluYXRlcyByZWxhdGl2ZVxuICogdG8gYSByZWZlcmVuY2UgbG9jYXRpb24gd2l0aCB5IHVwLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbGF0TG5nVG9WZWN0b3IzUmVsYXRpdmUoXG4gIHBvaW50OiBnb29nbGUubWFwcy5MYXRMbmdBbHRpdHVkZUxpdGVyYWwsXG4gIHJlZmVyZW5jZTogZ29vZ2xlLm1hcHMuTGF0TG5nQWx0aXR1ZGVMaXRlcmFsLFxuICB0YXJnZXQgPSBuZXcgVmVjdG9yMygpXG4pIHtcbiAgY29uc3QgW3B4LCBweV0gPSBsYXRMbmdUb1hZKHBvaW50KTtcbiAgY29uc3QgW3J4LCByeV0gPSBsYXRMbmdUb1hZKHJlZmVyZW5jZSk7XG5cbiAgdGFyZ2V0LnNldChweCAtIHJ4LCBweSAtIHJ5LCAwKTtcblxuICAvLyBhcHBseSB0aGUgc3BoZXJpY2FsIG1lcmNhdG9yIHNjYWxlLWZhY3RvciBmb3IgdGhlIHJlZmVyZW5jZSBsYXRpdHVkZVxuICB0YXJnZXQubXVsdGlwbHlTY2FsYXIoY29zKGRlZ1RvUmFkKHJlZmVyZW5jZS5sYXQpKSk7XG5cbiAgdGFyZ2V0LnogPSBwb2ludC5hbHRpdHVkZSAtIHJlZmVyZW5jZS5hbHRpdHVkZTtcblxuICByZXR1cm4gdGFyZ2V0O1xufVxuXG4vKipcbiAqIENvbnZlcnRzIFdHUzg0IGxhdGl0dWRlIGFuZCBsb25naXR1ZGUgdG8gKHVuY29ycmVjdGVkKSBXZWJNZXJjYXRvciBtZXRlcnMuXG4gKiAoV0dTODQgLS0+IFdlYk1lcmNhdG9yIChFUFNHOjM4NTcpKVxuICovXG5leHBvcnQgZnVuY3Rpb24gbGF0TG5nVG9YWShwb3NpdGlvbjogZ29vZ2xlLm1hcHMuTGF0TG5nTGl0ZXJhbCk6IG51bWJlcltdIHtcbiAgcmV0dXJuIFtcbiAgICBFQVJUSF9SQURJVVMgKiBkZWdUb1JhZChwb3NpdGlvbi5sbmcpLFxuICAgIEVBUlRIX1JBRElVUyAqIGxvZyh0YW4oMC4yNSAqIFBJICsgMC41ICogZGVnVG9SYWQocG9zaXRpb24ubGF0KSkpLFxuICBdO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIFdlYk1lcmNhdG9yIG1ldGVycyB0byBXR1M4NCBsYXRpdHVkZS9sb25naXR1ZGUuXG4gKiAoV2ViTWVyY2F0b3IgKEVQU0c6Mzg1NykgLS0+IFdHUzg0KVxuICovXG5leHBvcnQgZnVuY3Rpb24geHlUb0xhdExuZyhwOiBudW1iZXJbXSk6IGdvb2dsZS5tYXBzLkxhdExuZ0xpdGVyYWwge1xuICBjb25zdCBbeCwgeV0gPSBwO1xuXG4gIHJldHVybiB7XG4gICAgbGF0OiByYWRUb0RlZyhQSSAqIDAuNSAtIDIuMCAqIGF0YW4oZXhwKC15IC8gRUFSVEhfUkFESVVTKSkpLFxuICAgIGxuZzogcmFkVG9EZWcoeCkgLyBFQVJUSF9SQURJVVMsXG4gIH07XG59XG4iLCIvKipcbiAqIENvcHlyaWdodCAyMDIxIEdvb2dsZSBMTENcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7XG4gIERpcmVjdGlvbmFsTGlnaHQsXG4gIEV1bGVyLFxuICBIZW1pc3BoZXJlTGlnaHQsXG4gIEludGVyc2VjdGlvbixcbiAgTWF0aFV0aWxzLFxuICBNYXRyaXg0LFxuICBPYmplY3QzRCxcbiAgUENGU29mdFNoYWRvd01hcCxcbiAgUGVyc3BlY3RpdmVDYW1lcmEsXG4gIFF1YXRlcm5pb24sXG4gIFJheWNhc3RlcixcbiAgUmF5Y2FzdGVyUGFyYW1ldGVycyxcbiAgUkVWSVNJT04sXG4gIFNjZW5lLFxuICBWZWN0b3IyLFxuICBWZWN0b3IzLFxuICBXZWJHTFJlbmRlcmVyLFxufSBmcm9tIFwidGhyZWVcIjtcbmltcG9ydCB7IGxhdExuZ1RvVmVjdG9yM1JlbGF0aXZlLCB0b0xhdExuZ0FsdGl0dWRlTGl0ZXJhbCB9IGZyb20gXCIuL3V0aWxcIjtcblxuaW1wb3J0IHR5cGUgeyBMYXRMbmdUeXBlcyB9IGZyb20gXCIuL3V0aWxcIjtcblxuLy8gU2luY2UgcjE2MiwgdGhlIHNSR0JFbmNvZGluZyBjb25zdGFudCBpcyBubyBsb25nZXIgZXhwb3J0ZWQgZnJvbSB0aHJlZS5cbi8vIFRoZSB2YWx1ZSBpcyBrZXB0IGhlcmUgdG8ga2VlcCBjb21wYXRpYmlsaXR5IHdpdGggb2xkZXIgdGhyZWUuanMgdmVyc2lvbnMuXG4vLyBUaGlzIHdpbGwgYmUgcmVtb3ZlZCB3aXRoIHRoZSBuZXh0IG1ham9yIHJlbGVhc2UuXG5jb25zdCBzUkdCRW5jb2RpbmcgPSAzMDAxO1xuXG5jb25zdCBERUZBVUxUX1VQID0gbmV3IFZlY3RvcjMoMCwgMCwgMSk7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmF5Y2FzdE9wdGlvbnMge1xuICAvKipcbiAgICogU2V0IHRvIHRydWUgdG8gYWxzbyB0ZXN0IGNoaWxkcmVuIG9mIHRoZSBzcGVjaWZpZWQgb2JqZWN0cyBmb3JcbiAgICogaW50ZXJzZWN0aW9ucy5cbiAgICpcbiAgICogQGRlZmF1bHQgZmFsc2VcbiAgICovXG4gIHJlY3Vyc2l2ZT86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgaW52ZXJzZS1wcm9qZWN0aW9uLW1hdHJpeCBiZWZvcmUgY2FzdGluZyB0aGUgcmF5IChzZXQgdGhpc1xuICAgKiB0byBmYWxzZSBpZiB5b3UgbmVlZCB0byBydW4gbXVsdGlwbGUgcmF5Y2FzdHMgZm9yIHRoZSBzYW1lIGZyYW1lKS5cbiAgICpcbiAgICogQGRlZmF1bHQgdHJ1ZVxuICAgKi9cbiAgdXBkYXRlTWF0cml4PzogYm9vbGVhbjtcblxuICAvKipcbiAgICogQWRkaXRpb25hbCBwYXJhbWV0ZXJzIHRvIHBhc3MgdG8gdGhlIHRocmVlLmpzIHJheWNhc3Rlci5cbiAgICpcbiAgICogQHNlZSBodHRwczovL3RocmVlanMub3JnL2RvY3MvI2FwaS9lbi9jb3JlL1JheWNhc3Rlci5wYXJhbXNcbiAgICovXG4gIHJheWNhc3RlclBhcmFtZXRlcnM/OiBSYXljYXN0ZXJQYXJhbWV0ZXJzO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRocmVlSlNPdmVybGF5Vmlld09wdGlvbnMge1xuICAvKipcbiAgICogVGhlIGFuY2hvciBmb3IgdGhlIHNjZW5lLlxuICAgKlxuICAgKiBAZGVmYXVsdCB7bGF0OiAwLCBsbmc6IDAsIGFsdGl0dWRlOiAwfVxuICAgKi9cbiAgYW5jaG9yPzogTGF0TG5nVHlwZXM7XG5cbiAgLyoqXG4gICAqIFRoZSBheGlzIHBvaW50aW5nIHVwIGluIHRoZSBzY2VuZS4gQ2FuIGJlIHNwZWNpZmllZCBhcyBcIlpcIiwgXCJZXCIgb3IgYVxuICAgKiBWZWN0b3IzLCBpbiB3aGljaCBjYXNlIHRoZSBub3JtYWxpemVkIHZlY3RvciB3aWxsIGJlY29tZSB0aGUgdXAtYXhpcy5cbiAgICpcbiAgICogQGRlZmF1bHQgXCJaXCJcbiAgICovXG4gIHVwQXhpcz86IFwiWlwiIHwgXCJZXCIgfCBWZWN0b3IzO1xuXG4gIC8qKlxuICAgKiBUaGUgbWFwIHRoZSBvdmVybGF5IHdpbGwgYmUgYWRkZWQgdG8uXG4gICAqIENhbiBiZSBzZXQgYXQgaW5pdGlhbGl6YXRpb24gb3IgYnkgY2FsbGluZyBgc2V0TWFwKG1hcClgLlxuICAgKi9cbiAgbWFwPzogZ29vZ2xlLm1hcHMuTWFwO1xuXG4gIC8qKlxuICAgKiBUaGUgc2NlbmUgb2JqZWN0IHRvIHJlbmRlciBpbiB0aGUgb3ZlcmxheS4gSWYgbm8gc2NlbmUgaXMgc3BlY2lmaWVkLCBhXG4gICAqIG5ldyBzY2VuZSBpcyBjcmVhdGVkIGFuZCBjYW4gYmUgYWNjZXNzZWQgdmlhIGBvdmVybGF5LnNjZW5lYC5cbiAgICovXG4gIHNjZW5lPzogU2NlbmU7XG5cbiAgLyoqXG4gICAqIFRoZSBhbmltYXRpb24gbW9kZSBjb250cm9scyB3aGVuIHRoZSBvdmVybGF5IHdpbGwgcmVkcmF3LCBlaXRoZXJcbiAgICogY29udGludW91c2x5IChgYWx3YXlzYCkgb3Igb24gZGVtYW5kIChgb25kZW1hbmRgKS4gV2hlbiB1c2luZyB0aGVcbiAgICogb24gZGVtYW5kIG1vZGUsIHRoZSBvdmVybGF5IHdpbGwgcmUtcmVuZGVyIHdoZW5ldmVyIHRoZSBtYXAgcmVuZGVyc1xuICAgKiAoY2FtZXJhIG1vdmVtZW50cykgb3Igd2hlbiBgcmVxdWVzdFJlZHJhdygpYCBpcyBjYWxsZWQuXG4gICAqXG4gICAqIFRvIGFjaGlldmUgYW5pbWF0aW9ucyBpbiB0aGlzIG1vZGUsIHlvdSBjYW4gZWl0aGVyIHVzZSBhbiBvdXRzaWRlXG4gICAqIGFuaW1hdGlvbi1sb29wIHRoYXQgY2FsbHMgYHJlcXVlc3RSZWRyYXcoKWAgYXMgbG9uZyBhcyBuZWVkZWQgb3IgY2FsbFxuICAgKiBgcmVxdWVzdFJlZHJhdygpYCBmcm9tIHdpdGhpbiB0aGUgYG9uQmVmb3JlUmVuZGVyYCBmdW5jdGlvbiB0b1xuICAgKlxuICAgKiBAZGVmYXVsdCBcIm9uZGVtYW5kXCJcbiAgICovXG4gIGFuaW1hdGlvbk1vZGU/OiBcImFsd2F5c1wiIHwgXCJvbmRlbWFuZFwiO1xuXG4gIC8qKlxuICAgKiBBZGQgZGVmYXVsdCBsaWdodGluZyB0byB0aGUgc2NlbmUuXG4gICAqIEBkZWZhdWx0IHRydWVcbiAgICovXG4gIGFkZERlZmF1bHRMaWdodGluZz86IGJvb2xlYW47XG59XG5cbi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uby1lbXB0eS1mdW5jdGlvbiAqL1xuXG4vKipcbiAqIEFkZCBhIFt0aHJlZS5qc10oaHR0cHM6Ly90aHJlZWpzLm9yZykgc2NlbmUgYXMgYSBbR29vZ2xlIE1hcHMgV2ViR0xPdmVybGF5Vmlld10oaHR0cDovL2dvby5nbGUvV2ViR0xPdmVybGF5Vmlldy1yZWYpLlxuICovXG5leHBvcnQgY2xhc3MgVGhyZWVKU092ZXJsYXlWaWV3IGltcGxlbWVudHMgZ29vZ2xlLm1hcHMuV2ViR0xPdmVybGF5VmlldyB7XG4gIC8qKiB7QGluaGVyaXREb2MgVGhyZWVKU092ZXJsYXlWaWV3T3B0aW9ucy5zY2VuZX0gKi9cbiAgcHVibGljIHJlYWRvbmx5IHNjZW5lOiBTY2VuZTtcblxuICAvKioge0Bpbmhlcml0RG9jIFRocmVlSlNPdmVybGF5Vmlld09wdGlvbnMuYW5pbWF0aW9uTW9kZX0gKi9cbiAgcHVibGljIGFuaW1hdGlvbk1vZGU6IFwiYWx3YXlzXCIgfCBcIm9uZGVtYW5kXCIgPSBcIm9uZGVtYW5kXCI7XG5cbiAgLyoqIHtAaW5oZXJpdERvYyBUaHJlZUpTT3ZlcmxheVZpZXdPcHRpb25zLmFuY2hvcn0gKi9cbiAgcHJvdGVjdGVkIGFuY2hvcjogZ29vZ2xlLm1hcHMuTGF0TG5nQWx0aXR1ZGVMaXRlcmFsO1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgY2FtZXJhOiBQZXJzcGVjdGl2ZUNhbWVyYTtcbiAgcHJvdGVjdGVkIHJlYWRvbmx5IHJvdGF0aW9uQXJyYXk6IEZsb2F0MzJBcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG4gIHByb3RlY3RlZCByZWFkb25seSByb3RhdGlvbkludmVyc2U6IFF1YXRlcm5pb24gPSBuZXcgUXVhdGVybmlvbigpO1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgcHJvamVjdGlvbk1hdHJpeEludmVyc2UgPSBuZXcgTWF0cml4NCgpO1xuXG4gIHByb3RlY3RlZCByZWFkb25seSBvdmVybGF5OiBnb29nbGUubWFwcy5XZWJHTE92ZXJsYXlWaWV3O1xuICBwcm90ZWN0ZWQgcmVuZGVyZXI6IFdlYkdMUmVuZGVyZXI7XG4gIHByb3RlY3RlZCByYXljYXN0ZXI6IFJheWNhc3RlciA9IG5ldyBSYXljYXN0ZXIoKTtcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBUaHJlZUpTT3ZlcmxheVZpZXdPcHRpb25zID0ge30pIHtcbiAgICBjb25zdCB7XG4gICAgICBhbmNob3IgPSB7IGxhdDogMCwgbG5nOiAwLCBhbHRpdHVkZTogMCB9LFxuICAgICAgdXBBeGlzID0gXCJaXCIsXG4gICAgICBzY2VuZSxcbiAgICAgIG1hcCxcbiAgICAgIGFuaW1hdGlvbk1vZGUgPSBcIm9uZGVtYW5kXCIsXG4gICAgICBhZGREZWZhdWx0TGlnaHRpbmcgPSB0cnVlLFxuICAgIH0gPSBvcHRpb25zO1xuXG4gICAgdGhpcy5vdmVybGF5ID0gbmV3IGdvb2dsZS5tYXBzLldlYkdMT3ZlcmxheVZpZXcoKTtcbiAgICB0aGlzLnJlbmRlcmVyID0gbnVsbDtcbiAgICB0aGlzLmNhbWVyYSA9IG51bGw7XG4gICAgdGhpcy5hbmltYXRpb25Nb2RlID0gYW5pbWF0aW9uTW9kZTtcblxuICAgIHRoaXMuc2V0QW5jaG9yKGFuY2hvcik7XG4gICAgdGhpcy5zZXRVcEF4aXModXBBeGlzKTtcblxuICAgIHRoaXMuc2NlbmUgPSBzY2VuZSA/PyBuZXcgU2NlbmUoKTtcbiAgICBpZiAoYWRkRGVmYXVsdExpZ2h0aW5nKSB0aGlzLmluaXRTY2VuZUxpZ2h0cygpO1xuXG4gICAgdGhpcy5vdmVybGF5Lm9uQWRkID0gdGhpcy5vbkFkZC5iaW5kKHRoaXMpO1xuICAgIHRoaXMub3ZlcmxheS5vblJlbW92ZSA9IHRoaXMub25SZW1vdmUuYmluZCh0aGlzKTtcbiAgICB0aGlzLm92ZXJsYXkub25Db250ZXh0TG9zdCA9IHRoaXMub25Db250ZXh0TG9zdC5iaW5kKHRoaXMpO1xuICAgIHRoaXMub3ZlcmxheS5vbkNvbnRleHRSZXN0b3JlZCA9IHRoaXMub25Db250ZXh0UmVzdG9yZWQuYmluZCh0aGlzKTtcbiAgICB0aGlzLm92ZXJsYXkub25TdGF0ZVVwZGF0ZSA9IHRoaXMub25TdGF0ZVVwZGF0ZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMub3ZlcmxheS5vbkRyYXcgPSB0aGlzLm9uRHJhdy5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5jYW1lcmEgPSBuZXcgUGVyc3BlY3RpdmVDYW1lcmEoKTtcblxuICAgIGlmIChtYXApIHtcbiAgICAgIHRoaXMuc2V0TWFwKG1hcCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGFuY2hvci1wb2ludC5cbiAgICogQHBhcmFtIGFuY2hvclxuICAgKi9cbiAgcHVibGljIHNldEFuY2hvcihhbmNob3I6IExhdExuZ1R5cGVzKSB7XG4gICAgdGhpcy5hbmNob3IgPSB0b0xhdExuZ0FsdGl0dWRlTGl0ZXJhbChhbmNob3IpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGF4aXMgdG8gdXNlIGFzIFwidXBcIiBpbiB0aGUgc2NlbmUuXG4gICAqIEBwYXJhbSBheGlzXG4gICAqL1xuICBwdWJsaWMgc2V0VXBBeGlzKGF4aXM6IFwiWVwiIHwgXCJaXCIgfCBWZWN0b3IzKTogdm9pZCB7XG4gICAgY29uc3QgdXBWZWN0b3IgPSBuZXcgVmVjdG9yMygwLCAwLCAxKTtcbiAgICBpZiAodHlwZW9mIGF4aXMgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHVwVmVjdG9yLmNvcHkoYXhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChheGlzLnRvTG93ZXJDYXNlKCkgPT09IFwieVwiKSB7XG4gICAgICAgIHVwVmVjdG9yLnNldCgwLCAxLCAwKTtcbiAgICAgIH0gZWxzZSBpZiAoYXhpcy50b0xvd2VyQ2FzZSgpICE9PSBcInpcIikge1xuICAgICAgICBjb25zb2xlLndhcm4oYGludmFsaWQgdmFsdWUgJyR7YXhpc30nIHNwZWNpZmllZCBhcyB1cEF4aXNgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB1cFZlY3Rvci5ub3JtYWxpemUoKTtcblxuICAgIGNvbnN0IHEgPSBuZXcgUXVhdGVybmlvbigpO1xuICAgIHEuc2V0RnJvbVVuaXRWZWN0b3JzKHVwVmVjdG9yLCBERUZBVUxUX1VQKTtcblxuICAgIC8vIGludmVyc2Ugcm90YXRpb24gaXMgbmVlZGVkIGluIGxhdExuZ0FsdGl0dWRlVG9WZWN0b3IzKClcbiAgICB0aGlzLnJvdGF0aW9uSW52ZXJzZS5jb3B5KHEpLmludmVydCgpO1xuXG4gICAgLy8gY29weSB0byByb3RhdGlvbkFycmF5IGZvciB0cmFuc2Zvcm1lci5mcm9tTGF0TG5nQWx0aXR1ZGUoKVxuICAgIGNvbnN0IGV1bGVyID0gbmV3IEV1bGVyKCkuc2V0RnJvbVF1YXRlcm5pb24ocSwgXCJYWVpcIik7XG4gICAgdGhpcy5yb3RhdGlvbkFycmF5WzBdID0gTWF0aFV0aWxzLnJhZFRvRGVnKGV1bGVyLngpO1xuICAgIHRoaXMucm90YXRpb25BcnJheVsxXSA9IE1hdGhVdGlscy5yYWRUb0RlZyhldWxlci55KTtcbiAgICB0aGlzLnJvdGF0aW9uQXJyYXlbMl0gPSBNYXRoVXRpbHMucmFkVG9EZWcoZXVsZXIueik7XG4gIH1cblxuICAvKipcbiAgICogUnVucyByYXljYXN0aW5nIGZvciB0aGUgc3BlY2lmaWVkIHNjcmVlbi1jb29yZGluYXRlcyBhZ2FpbnN0IGFsbCBvYmplY3RzXG4gICAqIGluIHRoZSBzY2VuZS5cbiAgICpcbiAgICogQHBhcmFtIHAgbm9ybWFsaXplZCBzY3JlZW5zcGFjZSBjb29yZGluYXRlcyBvZiB0aGVcbiAgICogICBtb3VzZS1jdXJzb3IuIHgveSBhcmUgaW4gcmFuZ2UgWy0xLCAxXSwgeSBpcyBwb2ludGluZyB1cC5cbiAgICogQHBhcmFtIG9wdGlvbnMgcmF5Y2FzdGluZyBvcHRpb25zLiBJbiB0aGlzIGNhc2UgdGhlIGByZWN1cnNpdmVgIG9wdGlvblxuICAgKiAgIGhhcyBubyBlZmZlY3QgYXMgaXQgaXMgYWx3YXlzIHJlY3Vyc2l2ZS5cbiAgICogQHJldHVybiB0aGUgbGlzdCBvZiBpbnRlcnNlY3Rpb25zXG4gICAqL1xuICBwdWJsaWMgcmF5Y2FzdChwOiBWZWN0b3IyLCBvcHRpb25zPzogUmF5Y2FzdE9wdGlvbnMpOiBJbnRlcnNlY3Rpb25bXTtcblxuICAvKipcbiAgICogUnVucyByYXljYXN0aW5nIGZvciB0aGUgc3BlY2lmaWVkIHNjcmVlbi1jb29yZGluYXRlcyBhZ2FpbnN0IHRoZSBzcGVjaWZpZWRcbiAgICogbGlzdCBvZiBvYmplY3RzLlxuICAgKlxuICAgKiBOb3RlIGZvciB0eXBlc2NyaXB0IHVzZXJzOiB0aGUgcmV0dXJuZWQgSW50ZXJzZWN0aW9uIG9iamVjdHMgY2FuIG9ubHkgYmVcbiAgICogcHJvcGVybHkgdHlwZWQgZm9yIG5vbi1yZWN1cnNpdmUgbG9va3VwcyAodGhpcyBpcyBoYW5kbGVkIGJ5IHRoZSBpbnRlcm5hbFxuICAgKiBzaWduYXR1cmUgYmVsb3cpLlxuICAgKlxuICAgKiBAcGFyYW0gcCBub3JtYWxpemVkIHNjcmVlbnNwYWNlIGNvb3JkaW5hdGVzIG9mIHRoZVxuICAgKiAgIG1vdXNlLWN1cnNvci4geC95IGFyZSBpbiByYW5nZSBbLTEsIDFdLCB5IGlzIHBvaW50aW5nIHVwLlxuICAgKiBAcGFyYW0gb2JqZWN0cyBsaXN0IG9mIG9iamVjdHMgdG8gdGVzdFxuICAgKiBAcGFyYW0gb3B0aW9ucyByYXljYXN0aW5nIG9wdGlvbnMuXG4gICAqL1xuICBwdWJsaWMgcmF5Y2FzdChcbiAgICBwOiBWZWN0b3IyLFxuICAgIG9iamVjdHM6IE9iamVjdDNEW10sXG4gICAgb3B0aW9ucz86IFJheWNhc3RPcHRpb25zICYgeyByZWN1cnNpdmU6IHRydWUgfVxuICApOiBJbnRlcnNlY3Rpb25bXTtcblxuICAvLyBhZGRpdGlvbmFsIHNpZ25hdHVyZSB0byBlbmFibGUgdHlwaW5ncyBpbiByZXR1cm5lZCBvYmplY3RzIHdoZW4gcG9zc2libGVcbiAgcHVibGljIHJheWNhc3Q8VCBleHRlbmRzIE9iamVjdDNEPihcbiAgICBwOiBWZWN0b3IyLFxuICAgIG9iamVjdHM6IFRbXSxcbiAgICBvcHRpb25zPzpcbiAgICAgIHwgT21pdDxSYXljYXN0T3B0aW9ucywgXCJyZWN1cnNpdmVcIj5cbiAgICAgIHwgKFJheWNhc3RPcHRpb25zICYgeyByZWN1cnNpdmU6IGZhbHNlIH0pXG4gICk6IEludGVyc2VjdGlvbjxUPltdO1xuXG4gIC8vIGltcGxlbWV0YXRpb25cbiAgcHVibGljIHJheWNhc3QoXG4gICAgcDogVmVjdG9yMixcbiAgICBvcHRpb25zT3JPYmplY3RzPzogT2JqZWN0M0RbXSB8IFJheWNhc3RPcHRpb25zLFxuICAgIG9wdGlvbnM6IFJheWNhc3RPcHRpb25zID0ge31cbiAgKTogSW50ZXJzZWN0aW9uW10ge1xuICAgIGxldCBvYmplY3RzOiBPYmplY3QzRFtdO1xuICAgIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnNPck9iamVjdHMpKSB7XG4gICAgICBvYmplY3RzID0gb3B0aW9uc09yT2JqZWN0cyB8fCBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICBvYmplY3RzID0gW3RoaXMuc2NlbmVdO1xuICAgICAgb3B0aW9ucyA9IHsgLi4ub3B0aW9uc09yT2JqZWN0cywgcmVjdXJzaXZlOiB0cnVlIH07XG4gICAgfVxuXG4gICAgY29uc3Qge1xuICAgICAgdXBkYXRlTWF0cml4ID0gdHJ1ZSxcbiAgICAgIHJlY3Vyc2l2ZSA9IGZhbHNlLFxuICAgICAgcmF5Y2FzdGVyUGFyYW1ldGVycyxcbiAgICB9ID0gb3B0aW9ucztcblxuICAgIC8vIHdoZW4gYHJheWNhc3QoKWAgaXMgY2FsbGVkIGZyb20gd2l0aGluIHRoZSBgb25CZWZvcmVSZW5kZXIoKWAgY2FsbGJhY2ssXG4gICAgLy8gdGhlIG12cC1tYXRyaXggZm9yIHRoaXMgZnJhbWUgaGFzIGFscmVhZHkgYmVlbiBjb21wdXRlZCBhbmQgc3RvcmVkIGluXG4gICAgLy8gYHRoaXMuY2FtZXJhLnByb2plY3Rpb25NYXRyaXhgLlxuICAgIC8vIFRoZSBtdnAtbWF0cml4IHRyYW5zZm9ybXMgd29ybGQtc3BhY2UgbWV0ZXJzIHRvIGNsaXAtc3BhY2VcbiAgICAvLyBjb29yZGluYXRlcy4gVGhlIGludmVyc2UgbWF0cml4IGNyZWF0ZWQgaGVyZSBkb2VzIHRoZSBleGFjdCBvcHBvc2l0ZVxuICAgIC8vIGFuZCBjb252ZXJ0cyBjbGlwLXNwYWNlIGNvb3JkaW5hdGVzIHRvIHdvcmxkLXNwYWNlLlxuICAgIGlmICh1cGRhdGVNYXRyaXgpIHtcbiAgICAgIHRoaXMucHJvamVjdGlvbk1hdHJpeEludmVyc2UuY29weSh0aGlzLmNhbWVyYS5wcm9qZWN0aW9uTWF0cml4KS5pbnZlcnQoKTtcbiAgICB9XG5cbiAgICAvLyBjcmVhdGUgdHdvIHBvaW50cyAod2l0aCBkaWZmZXJlbnQgZGVwdGgpIGZyb20gdGhlIG1vdXNlLXBvc2l0aW9uIGFuZFxuICAgIC8vIGNvbnZlcnQgdGhlbSBpbnRvIHdvcmxkLXNwYWNlIGNvb3JkaW5hdGVzIHRvIHNldCB1cCB0aGUgcmF5LlxuICAgIHRoaXMucmF5Y2FzdGVyLnJheS5vcmlnaW5cbiAgICAgIC5zZXQocC54LCBwLnksIDApXG4gICAgICAuYXBwbHlNYXRyaXg0KHRoaXMucHJvamVjdGlvbk1hdHJpeEludmVyc2UpO1xuXG4gICAgdGhpcy5yYXljYXN0ZXIucmF5LmRpcmVjdGlvblxuICAgICAgLnNldChwLngsIHAueSwgMC41KVxuICAgICAgLmFwcGx5TWF0cml4NCh0aGlzLnByb2plY3Rpb25NYXRyaXhJbnZlcnNlKVxuICAgICAgLnN1Yih0aGlzLnJheWNhc3Rlci5yYXkub3JpZ2luKVxuICAgICAgLm5vcm1hbGl6ZSgpO1xuXG4gICAgLy8gYmFjayB1cCB0aGUgcmF5Y2FzdGVyIHBhcmFtZXRlcnNcbiAgICBjb25zdCBvbGRSYXljYXN0ZXJQYXJhbXMgPSB0aGlzLnJheWNhc3Rlci5wYXJhbXM7XG4gICAgaWYgKHJheWNhc3RlclBhcmFtZXRlcnMpIHtcbiAgICAgIHRoaXMucmF5Y2FzdGVyLnBhcmFtcyA9IHJheWNhc3RlclBhcmFtZXRlcnM7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0cyA9IHRoaXMucmF5Y2FzdGVyLmludGVyc2VjdE9iamVjdHMob2JqZWN0cywgcmVjdXJzaXZlKTtcblxuICAgIC8vIHJlc2V0IHJheWNhc3RlciBwYXJhbXMgdG8gd2hhdGV2ZXIgdGhleSB3ZXJlIGJlZm9yZVxuICAgIHRoaXMucmF5Y2FzdGVyLnBhcmFtcyA9IG9sZFJheWNhc3RlclBhcmFtcztcblxuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG5cbiAgLyoqXG4gICAqIE92ZXJ3cml0ZSB0aGlzIG1ldGhvZCB0byBoYW5kbGUgYW55IEdMIHN0YXRlIHVwZGF0ZXMgb3V0c2lkZSB0aGVcbiAgICogcmVuZGVyIGFuaW1hdGlvbiBmcmFtZS5cbiAgICogQHBhcmFtIG9wdGlvbnNcbiAgICovXG4gIHB1YmxpYyBvblN0YXRlVXBkYXRlKG9wdGlvbnM6IGdvb2dsZS5tYXBzLldlYkdMU3RhdGVPcHRpb25zKTogdm9pZDtcbiAgcHVibGljIG9uU3RhdGVVcGRhdGUoKTogdm9pZCB7fVxuXG4gIC8qKlxuICAgKiBPdmVyd3JpdGUgdGhpcyBtZXRob2QgdG8gZmV0Y2ggb3IgY3JlYXRlIGludGVybWVkaWF0ZSBkYXRhIHN0cnVjdHVyZXNcbiAgICogYmVmb3JlIHRoZSBvdmVybGF5IGlzIGRyYXduIHRoYXQgZG9u4oCZdCByZXF1aXJlIGltbWVkaWF0ZSBhY2Nlc3MgdG8gdGhlXG4gICAqIFdlYkdMIHJlbmRlcmluZyBjb250ZXh0LlxuICAgKi9cbiAgcHVibGljIG9uQWRkKCk6IHZvaWQge31cblxuICAvKipcbiAgICogT3ZlcndyaXRlIHRoaXMgbWV0aG9kIHRvIHVwZGF0ZSB5b3VyIHNjZW5lIGp1c3QgYmVmb3JlIGEgbmV3IGZyYW1lIGlzXG4gICAqIGRyYXduLlxuICAgKi9cbiAgcHVibGljIG9uQmVmb3JlRHJhdygpOiB2b2lkIHt9XG5cbiAgLyoqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGNhbGxlZCB3aGVuIHRoZSBvdmVybGF5IGlzIHJlbW92ZWQgZnJvbSB0aGUgbWFwIHdpdGhcbiAgICogYG92ZXJsYXkuc2V0TWFwKG51bGwpYCwgYW5kIGlzIHdoZXJlIHlvdSBjYW4gcmVtb3ZlIGFsbCBpbnRlcm1lZGlhdGVcbiAgICogb2JqZWN0cyBjcmVhdGVkIGluIG9uQWRkLlxuICAgKi9cbiAgcHVibGljIG9uUmVtb3ZlKCk6IHZvaWQge31cblxuICAvKipcbiAgICogVHJpZ2dlcnMgdGhlIG1hcCB0byB1cGRhdGUgR0wgc3RhdGUuXG4gICAqL1xuICBwdWJsaWMgcmVxdWVzdFN0YXRlVXBkYXRlKCk6IHZvaWQge1xuICAgIHRoaXMub3ZlcmxheS5yZXF1ZXN0U3RhdGVVcGRhdGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmlnZ2VycyB0aGUgbWFwIHRvIHJlZHJhdyBhIGZyYW1lLlxuICAgKi9cbiAgcHVibGljIHJlcXVlc3RSZWRyYXcoKTogdm9pZCB7XG4gICAgdGhpcy5vdmVybGF5LnJlcXVlc3RSZWRyYXcoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBtYXAgdGhlIG92ZXJsYXkgaXMgYWRkZWQgdG8uXG4gICAqL1xuICBwdWJsaWMgZ2V0TWFwKCk6IGdvb2dsZS5tYXBzLk1hcCB7XG4gICAgcmV0dXJuIHRoaXMub3ZlcmxheS5nZXRNYXAoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRoZSBvdmVybGF5IHRvIHRoZSBtYXAuXG4gICAqIEBwYXJhbSBtYXAgVGhlIG1hcCB0byBhY2Nlc3MgdGhlIGRpdiwgbW9kZWwgYW5kIHZpZXcgc3RhdGUuXG4gICAqL1xuICBwdWJsaWMgc2V0TWFwKG1hcDogZ29vZ2xlLm1hcHMuTWFwKTogdm9pZCB7XG4gICAgdGhpcy5vdmVybGF5LnNldE1hcChtYXApO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdGhlIGdpdmVuIGxpc3RlbmVyIGZ1bmN0aW9uIHRvIHRoZSBnaXZlbiBldmVudCBuYW1lLiBSZXR1cm5zIGFuXG4gICAqIGlkZW50aWZpZXIgZm9yIHRoaXMgbGlzdGVuZXIgdGhhdCBjYW4gYmUgdXNlZCB3aXRoXG4gICAqIDxjb2RlPmdvb2dsZS5tYXBzLmV2ZW50LnJlbW92ZUxpc3RlbmVyPC9jb2RlPi5cbiAgICovXG4gIHB1YmxpYyBhZGRMaXN0ZW5lcihcbiAgICBldmVudE5hbWU6IHN0cmluZyxcbiAgICBoYW5kbGVyOiAoLi4uYXJnczogdW5rbm93bltdKSA9PiB2b2lkXG4gICk6IGdvb2dsZS5tYXBzLk1hcHNFdmVudExpc3RlbmVyIHtcbiAgICByZXR1cm4gdGhpcy5vdmVybGF5LmFkZExpc3RlbmVyKGV2ZW50TmFtZSwgaGFuZGxlcik7XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBtZXRob2QgaXMgY2FsbGVkIG9uY2UgdGhlIHJlbmRlcmluZyBjb250ZXh0IGlzIGF2YWlsYWJsZS4gVXNlIGl0IHRvXG4gICAqIGluaXRpYWxpemUgb3IgYmluZCBhbnkgV2ViR0wgc3RhdGUgc3VjaCBhcyBzaGFkZXJzIG9yIGJ1ZmZlciBvYmplY3RzLlxuICAgKiBAcGFyYW0gb3B0aW9ucyB0aGF0IGFsbG93IGRldmVsb3BlcnMgdG8gcmVzdG9yZSB0aGUgR0wgY29udGV4dC5cbiAgICovXG4gIHB1YmxpYyBvbkNvbnRleHRSZXN0b3JlZCh7IGdsIH06IGdvb2dsZS5tYXBzLldlYkdMU3RhdGVPcHRpb25zKSB7XG4gICAgdGhpcy5yZW5kZXJlciA9IG5ldyBXZWJHTFJlbmRlcmVyKHtcbiAgICAgIGNhbnZhczogZ2wuY2FudmFzLFxuICAgICAgY29udGV4dDogZ2wsXG4gICAgICAuLi5nbC5nZXRDb250ZXh0QXR0cmlidXRlcygpLFxuICAgIH0pO1xuICAgIHRoaXMucmVuZGVyZXIuYXV0b0NsZWFyID0gZmFsc2U7XG4gICAgdGhpcy5yZW5kZXJlci5hdXRvQ2xlYXJEZXB0aCA9IGZhbHNlO1xuICAgIHRoaXMucmVuZGVyZXIuc2hhZG93TWFwLmVuYWJsZWQgPSB0cnVlO1xuICAgIHRoaXMucmVuZGVyZXIuc2hhZG93TWFwLnR5cGUgPSBQQ0ZTb2Z0U2hhZG93TWFwO1xuXG4gICAgLy8gU2luY2UgcjE1MiwgZGVmYXVsdCBvdXRwdXRDb2xvclNwYWNlIGlzIFNSR0JcbiAgICAvLyBEZXByZWNhdGVkIG91dHB1dEVuY29kaW5nIGtlcHQgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG4gICAgaWYgKE51bWJlcihSRVZJU0lPTikgPCAxNTIpIHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgICAodGhpcy5yZW5kZXJlciBhcyBhbnkpLm91dHB1dEVuY29kaW5nID0gc1JHQkVuY29kaW5nO1xuICAgIH1cblxuICAgIGNvbnN0IHsgd2lkdGgsIGhlaWdodCB9ID0gZ2wuY2FudmFzO1xuICAgIHRoaXMucmVuZGVyZXIuc2V0Vmlld3BvcnQoMCwgMCwgd2lkdGgsIGhlaWdodCk7XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBtZXRob2QgaXMgY2FsbGVkIHdoZW4gdGhlIHJlbmRlcmluZyBjb250ZXh0IGlzIGxvc3QgZm9yIGFueSByZWFzb24sXG4gICAqIGFuZCBpcyB3aGVyZSB5b3Ugc2hvdWxkIGNsZWFuIHVwIGFueSBwcmUtZXhpc3RpbmcgR0wgc3RhdGUsIHNpbmNlIGl0IGlzXG4gICAqIG5vIGxvbmdlciBuZWVkZWQuXG4gICAqL1xuICBwdWJsaWMgb25Db250ZXh0TG9zdCgpIHtcbiAgICBpZiAoIXRoaXMucmVuZGVyZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnJlbmRlcmVyLmRpc3Bvc2UoKTtcbiAgICB0aGlzLnJlbmRlcmVyID0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbXBsZW1lbnQgdGhpcyBtZXRob2QgdG8gZHJhdyBXZWJHTCBjb250ZW50IGRpcmVjdGx5IG9uIHRoZSBtYXAuIE5vdGVcbiAgICogdGhhdCBpZiB0aGUgb3ZlcmxheSBuZWVkcyBhIG5ldyBmcmFtZSBkcmF3biB0aGVuIGNhbGwge0BsaW5rXG4gICAqIFRocmVlSlNPdmVybGF5Vmlldy5yZXF1ZXN0UmVkcmF3fS5cbiAgICogQHBhcmFtIG9wdGlvbnMgdGhhdCBhbGxvdyBkZXZlbG9wZXJzIHRvIHJlbmRlciBjb250ZW50IHRvIGFuIGFzc29jaWF0ZWRcbiAgICogICAgIEdvb2dsZSBiYXNlbWFwLlxuICAgKi9cbiAgcHVibGljIG9uRHJhdyh7IGdsLCB0cmFuc2Zvcm1lciB9OiBnb29nbGUubWFwcy5XZWJHTERyYXdPcHRpb25zKTogdm9pZCB7XG4gICAgdGhpcy5jYW1lcmEucHJvamVjdGlvbk1hdHJpeC5mcm9tQXJyYXkoXG4gICAgICB0cmFuc2Zvcm1lci5mcm9tTGF0TG5nQWx0aXR1ZGUodGhpcy5hbmNob3IsIHRoaXMucm90YXRpb25BcnJheSlcbiAgICApO1xuXG4gICAgZ2wuZGlzYWJsZShnbC5TQ0lTU09SX1RFU1QpO1xuXG4gICAgdGhpcy5vbkJlZm9yZURyYXcoKTtcblxuICAgIHRoaXMucmVuZGVyZXIucmVuZGVyKHRoaXMuc2NlbmUsIHRoaXMuY2FtZXJhKTtcbiAgICB0aGlzLnJlbmRlcmVyLnJlc2V0U3RhdGUoKTtcblxuICAgIGlmICh0aGlzLmFuaW1hdGlvbk1vZGUgPT09IFwiYWx3YXlzXCIpIHRoaXMucmVxdWVzdFJlZHJhdygpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnQgY29vcmRpbmF0ZXMgZnJvbSBXR1M4NCBMYXRpdHVkZSBMb25naXR1ZGUgdG8gd29ybGQtc3BhY2VcbiAgICogY29vcmRpbmF0ZXMgd2hpbGUgdGFraW5nIHRoZSBvcmlnaW4gYW5kIG9yaWVudGF0aW9uIGludG8gYWNjb3VudC5cbiAgICovXG4gIHB1YmxpYyBsYXRMbmdBbHRpdHVkZVRvVmVjdG9yMyhcbiAgICBwb3NpdGlvbjogTGF0TG5nVHlwZXMsXG4gICAgdGFyZ2V0ID0gbmV3IFZlY3RvcjMoKVxuICApIHtcbiAgICBsYXRMbmdUb1ZlY3RvcjNSZWxhdGl2ZShcbiAgICAgIHRvTGF0TG5nQWx0aXR1ZGVMaXRlcmFsKHBvc2l0aW9uKSxcbiAgICAgIHRoaXMuYW5jaG9yLFxuICAgICAgdGFyZ2V0XG4gICAgKTtcblxuICAgIHRhcmdldC5hcHBseVF1YXRlcm5pb24odGhpcy5yb3RhdGlvbkludmVyc2UpO1xuXG4gICAgcmV0dXJuIHRhcmdldDtcbiAgfVxuXG4gIC8vIE1WQ09iamVjdCBpbnRlcmZhY2UgZm9yd2FyZGVkIHRvIHRoZSBvdmVybGF5XG5cbiAgLyoqXG4gICAqIEJpbmRzIGEgVmlldyB0byBhIE1vZGVsLlxuICAgKi9cbiAgcHVibGljIGJpbmRUbyhcbiAgICBrZXk6IHN0cmluZyxcbiAgICB0YXJnZXQ6IGdvb2dsZS5tYXBzLk1WQ09iamVjdCxcbiAgICB0YXJnZXRLZXk/OiBzdHJpbmcsXG4gICAgbm9Ob3RpZnk/OiBib29sZWFuXG4gICk6IHZvaWQge1xuICAgIHRoaXMub3ZlcmxheS5iaW5kVG8oa2V5LCB0YXJnZXQsIHRhcmdldEtleSwgbm9Ob3RpZnkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSB2YWx1ZS5cbiAgICovXG4gIHB1YmxpYyBnZXQoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5vdmVybGF5LmdldChrZXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIE5vdGlmeSBhbGwgb2JzZXJ2ZXJzIG9mIGEgY2hhbmdlIG9uIHRoaXMgcHJvcGVydHkuIFRoaXMgbm90aWZpZXMgYm90aFxuICAgKiBvYmplY3RzIHRoYXQgYXJlIGJvdW5kIHRvIHRoZSBvYmplY3QncyBwcm9wZXJ0eSBhcyB3ZWxsIGFzIHRoZSBvYmplY3RcbiAgICogdGhhdCBpdCBpcyBib3VuZCB0by5cbiAgICovXG4gIHB1YmxpYyBub3RpZnkoa2V5OiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLm92ZXJsYXkubm90aWZ5KGtleSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIHZhbHVlLlxuICAgKi9cbiAgcHVibGljIHNldChrZXk6IHN0cmluZywgdmFsdWU6IHVua25vd24pOiB2b2lkIHtcbiAgICB0aGlzLm92ZXJsYXkuc2V0KGtleSwgdmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYSBjb2xsZWN0aW9uIG9mIGtleS12YWx1ZSBwYWlycy5cbiAgICovXG4gIHB1YmxpYyBzZXRWYWx1ZXModmFsdWVzPzogb2JqZWN0KTogdm9pZCB7XG4gICAgdGhpcy5vdmVybGF5LnNldFZhbHVlcyh2YWx1ZXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYSBiaW5kaW5nLiBVbmJpbmRpbmcgd2lsbCBzZXQgdGhlIHVuYm91bmQgcHJvcGVydHkgdG8gdGhlIGN1cnJlbnRcbiAgICogdmFsdWUuIFRoZSBvYmplY3Qgd2lsbCBub3QgYmUgbm90aWZpZWQsIGFzIHRoZSB2YWx1ZSBoYXMgbm90IGNoYW5nZWQuXG4gICAqL1xuICBwdWJsaWMgdW5iaW5kKGtleTogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5vdmVybGF5LnVuYmluZChrZXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYWxsIGJpbmRpbmdzLlxuICAgKi9cbiAgcHVibGljIHVuYmluZEFsbCgpOiB2b2lkIHtcbiAgICB0aGlzLm92ZXJsYXkudW5iaW5kQWxsKCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBsaWdodHMgKGRpcmVjdGlvbmFsIGFuZCBoZW1pc3BoZXJlIGxpZ2h0KSB0byBpbGx1bWluYXRlIHRoZSBtb2RlbFxuICAgKiAocm91Z2hseSBhcHByb3hpbWF0ZXMgdGhlIGxpZ2h0aW5nIG9mIGJ1aWxkaW5ncyBpbiBtYXBzKVxuICAgKi9cbiAgcHJpdmF0ZSBpbml0U2NlbmVMaWdodHMoKSB7XG4gICAgY29uc3QgaGVtaUxpZ2h0ID0gbmV3IEhlbWlzcGhlcmVMaWdodCgweGZmZmZmZiwgMHg0NDQ0NDQsIDEpO1xuICAgIGhlbWlMaWdodC5wb3NpdGlvbi5zZXQoMCwgLTAuMiwgMSkubm9ybWFsaXplKCk7XG5cbiAgICBjb25zdCBkaXJMaWdodCA9IG5ldyBEaXJlY3Rpb25hbExpZ2h0KDB4ZmZmZmZmKTtcbiAgICBkaXJMaWdodC5wb3NpdGlvbi5zZXQoMCwgMTAsIDEwMCk7XG5cbiAgICB0aGlzLnNjZW5lLmFkZChoZW1pTGlnaHQsIGRpckxpZ2h0KTtcbiAgfVxufVxuIiwiLyoqXG4gKiBDb3B5cmlnaHQgMjAyMSBHb29nbGUgTExDXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgeyBMT0FERVJfT1BUSU9OUywgTUFQX0lEIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgeyBUaHJlZUpTT3ZlcmxheVZpZXcsIFdPUkxEX1NJWkUgfSBmcm9tIFwiLi4vc3JjXCI7XG5cbmltcG9ydCB7IExvYWRlciB9IGZyb20gXCJAZ29vZ2xlbWFwcy9qcy1hcGktbG9hZGVyXCI7XG5pbXBvcnQgeyBBeGVzSGVscGVyIH0gZnJvbSBcInRocmVlXCI7XG5cbmNvbnN0IG1hcE9wdGlvbnMgPSB7XG4gIGNlbnRlcjoge1xuICAgIGxhdDogNDUsXG4gICAgbG5nOiAwLFxuICB9LFxuICBtYXBJZDogTUFQX0lELFxuICB6b29tOiA1LFxuICBoZWFkaW5nOiAtNDUsXG4gIHRpbHQ6IDQ1LFxufTtcblxubmV3IExvYWRlcihMT0FERVJfT1BUSU9OUykubG9hZCgpLnRoZW4oKCkgPT4ge1xuICBjb25zdCBtYXAgPSBuZXcgZ29vZ2xlLm1hcHMuTWFwKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibWFwXCIpLCBtYXBPcHRpb25zKTtcbiAgY29uc3Qgb3ZlcmxheSA9IG5ldyBUaHJlZUpTT3ZlcmxheVZpZXcoe1xuICAgIGFuY2hvcjogeyAuLi5tYXBPcHRpb25zLmNlbnRlciwgYWx0aXR1ZGU6IDAgfSxcbiAgICBtYXAsXG4gIH0pO1xuXG4gIG92ZXJsYXkuc2NlbmUuYWRkKG5ldyBBeGVzSGVscGVyKFdPUkxEX1NJWkUpKTtcbn0pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7Ozs7Ozs7O0FBY0c7QUFJSSxNQUFNLE1BQU0sR0FBRyxrQkFBa0IsQ0FBQztBQUVsQyxNQUFNLGNBQWMsR0FBa0I7QUFDM0MsSUFBQSxNQUFNLEVBQUUseUNBQXlDO0FBQ2pELElBQUEsT0FBTyxFQUFFLE1BQU07QUFDZixJQUFBLFNBQVMsRUFBRSxFQUFFO0NBQ2Q7O0FDeEJEOzs7Ozs7Ozs7Ozs7OztBQWNHO0FBVUg7QUFDQSxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUM7QUFDOUMsTUFBTSxF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
