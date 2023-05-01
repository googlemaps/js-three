import { V as Vector3, M as MathUtils, Q as Quaternion, a as Matrix4, R as Raycaster, S as Scene, P as PerspectiveCamera, E as Euler, W as WebGLRenderer, b as PCFSoftShadowMap, s as sRGBEncoding, H as HemisphereLight, D as DirectionalLight, L as Loader, A as AxesHelper } from './vendor-499d4a45.js';

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5jaG9yLmpzIiwic291cmNlcyI6WyIuLi8uLi9leGFtcGxlcy9jb25maWcudHMiLCIuLi8uLi9zcmMvdXRpbC50cyIsIi4uLy4uL3NyYy90aHJlZS50cyIsIi4uLy4uL2V4YW1wbGVzL2FuY2hvci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAyMDIxIEdvb2dsZSBMTENcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7IExvYWRlck9wdGlvbnMgfSBmcm9tIFwiQGdvb2dsZW1hcHMvanMtYXBpLWxvYWRlclwiO1xuXG5leHBvcnQgY29uc3QgTUFQX0lEID0gXCI3YjlhODk3YWNkMGE2M2E0XCI7XG5cbmV4cG9ydCBjb25zdCBMT0FERVJfT1BUSU9OUzogTG9hZGVyT3B0aW9ucyA9IHtcbiAgYXBpS2V5OiBcIkFJemFTeUQ4eGlhVlBXQjAyT2VRa0pPZW5MaUp6ZGVVSHpsaHUwMFwiLFxuICB2ZXJzaW9uOiBcImJldGFcIixcbiAgbGlicmFyaWVzOiBbXSxcbn07XG4iLCIvKipcbiAqIENvcHlyaWdodCAyMDIxIEdvb2dsZSBMTEMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgeyBNYXRoVXRpbHMsIFZlY3RvcjMgfSBmcm9tIFwidGhyZWVcIjtcblxuZXhwb3J0IHR5cGUgTGF0TG5nVHlwZXMgPVxuICB8IGdvb2dsZS5tYXBzLkxhdExuZ0xpdGVyYWxcbiAgfCBnb29nbGUubWFwcy5MYXRMbmdcbiAgfCBnb29nbGUubWFwcy5MYXRMbmdBbHRpdHVkZUxpdGVyYWxcbiAgfCBnb29nbGUubWFwcy5MYXRMbmdBbHRpdHVkZTtcblxuLy8gc2hvcnRoYW5kcyBmb3IgbWF0aC1mdW5jdGlvbnMsIG1ha2VzIGVxdWF0aW9ucyBtb3JlIHJlYWRhYmxlXG5jb25zdCB7IGF0YW4sIGNvcywgZXhwLCBsb2csIHRhbiwgUEkgfSA9IE1hdGg7XG5jb25zdCB7IGRlZ1RvUmFkLCByYWRUb0RlZyB9ID0gTWF0aFV0aWxzO1xuXG5leHBvcnQgY29uc3QgRUFSVEhfUkFESVVTID0gNjM3MTAxMC4wO1xuZXhwb3J0IGNvbnN0IFdPUkxEX1NJWkUgPSBNYXRoLlBJICogRUFSVEhfUkFESVVTO1xuXG4vKipcbiAqIENvbnZlcnRzIGFueSBvZiB0aGUgc3VwcG9ydGVkIHBvc2l0aW9uIGZvcm1hdHMgaW50byB0aGVcbiAqIGdvb2dsZS5tYXBzLkxhdExuZ0FsdGl0dWRlTGl0ZXJhbCBmb3JtYXQgdXNlZCBmb3IgdGhlIGNhbGN1bGF0aW9ucy5cbiAqIEBwYXJhbSBwb2ludFxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9MYXRMbmdBbHRpdHVkZUxpdGVyYWwoXG4gIHBvaW50OiBMYXRMbmdUeXBlc1xuKTogZ29vZ2xlLm1hcHMuTGF0TG5nQWx0aXR1ZGVMaXRlcmFsIHtcbiAgaWYgKFxuICAgIHdpbmRvdy5nb29nbGUgJiZcbiAgICBnb29nbGUubWFwcyAmJlxuICAgIChwb2ludCBpbnN0YW5jZW9mIGdvb2dsZS5tYXBzLkxhdExuZyB8fFxuICAgICAgcG9pbnQgaW5zdGFuY2VvZiBnb29nbGUubWFwcy5MYXRMbmdBbHRpdHVkZSlcbiAgKSB7XG4gICAgcmV0dXJuIHsgYWx0aXR1ZGU6IDAsIC4uLnBvaW50LnRvSlNPTigpIH07XG4gIH1cblxuICByZXR1cm4geyBhbHRpdHVkZTogMCwgLi4uKHBvaW50IGFzIGdvb2dsZS5tYXBzLkxhdExuZ0xpdGVyYWwpIH07XG59XG5cbi8qKlxuICogQ29udmVydHMgbGF0aXR1ZGUgYW5kIGxvbmdpdHVkZSB0byB3b3JsZCBzcGFjZSBjb29yZGluYXRlcyByZWxhdGl2ZVxuICogdG8gYSByZWZlcmVuY2UgbG9jYXRpb24gd2l0aCB5IHVwLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbGF0TG5nVG9WZWN0b3IzUmVsYXRpdmUoXG4gIHBvaW50OiBnb29nbGUubWFwcy5MYXRMbmdBbHRpdHVkZUxpdGVyYWwsXG4gIHJlZmVyZW5jZTogZ29vZ2xlLm1hcHMuTGF0TG5nQWx0aXR1ZGVMaXRlcmFsLFxuICB0YXJnZXQgPSBuZXcgVmVjdG9yMygpXG4pIHtcbiAgY29uc3QgW3B4LCBweV0gPSBsYXRMbmdUb1hZKHBvaW50KTtcbiAgY29uc3QgW3J4LCByeV0gPSBsYXRMbmdUb1hZKHJlZmVyZW5jZSk7XG5cbiAgdGFyZ2V0LnNldChweCAtIHJ4LCBweSAtIHJ5LCAwKTtcblxuICAvLyBhcHBseSB0aGUgc3BoZXJpY2FsIG1lcmNhdG9yIHNjYWxlLWZhY3RvciBmb3IgdGhlIHJlZmVyZW5jZSBsYXRpdHVkZVxuICB0YXJnZXQubXVsdGlwbHlTY2FsYXIoY29zKGRlZ1RvUmFkKHJlZmVyZW5jZS5sYXQpKSk7XG5cbiAgdGFyZ2V0LnogPSBwb2ludC5hbHRpdHVkZSAtIHJlZmVyZW5jZS5hbHRpdHVkZTtcblxuICByZXR1cm4gdGFyZ2V0O1xufVxuXG4vKipcbiAqIENvbnZlcnRzIFdHUzg0IGxhdGl0dWRlIGFuZCBsb25naXR1ZGUgdG8gKHVuY29ycmVjdGVkKSBXZWJNZXJjYXRvciBtZXRlcnMuXG4gKiAoV0dTODQgLS0+IFdlYk1lcmNhdG9yIChFUFNHOjM4NTcpKVxuICovXG5leHBvcnQgZnVuY3Rpb24gbGF0TG5nVG9YWShwb3NpdGlvbjogZ29vZ2xlLm1hcHMuTGF0TG5nTGl0ZXJhbCk6IG51bWJlcltdIHtcbiAgcmV0dXJuIFtcbiAgICBFQVJUSF9SQURJVVMgKiBkZWdUb1JhZChwb3NpdGlvbi5sbmcpLFxuICAgIEVBUlRIX1JBRElVUyAqIGxvZyh0YW4oMC4yNSAqIFBJICsgMC41ICogZGVnVG9SYWQocG9zaXRpb24ubGF0KSkpLFxuICBdO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIFdlYk1lcmNhdG9yIG1ldGVycyB0byBXR1M4NCBsYXRpdHVkZS9sb25naXR1ZGUuXG4gKiAoV2ViTWVyY2F0b3IgKEVQU0c6Mzg1NykgLS0+IFdHUzg0KVxuICovXG5leHBvcnQgZnVuY3Rpb24geHlUb0xhdExuZyhwOiBudW1iZXJbXSk6IGdvb2dsZS5tYXBzLkxhdExuZ0xpdGVyYWwge1xuICBjb25zdCBbeCwgeV0gPSBwO1xuXG4gIHJldHVybiB7XG4gICAgbGF0OiByYWRUb0RlZyhQSSAqIDAuNSAtIDIuMCAqIGF0YW4oZXhwKC15IC8gRUFSVEhfUkFESVVTKSkpLFxuICAgIGxuZzogcmFkVG9EZWcoeCkgLyBFQVJUSF9SQURJVVMsXG4gIH07XG59XG4iLCIvKipcbiAqIENvcHlyaWdodCAyMDIxIEdvb2dsZSBMTENcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7XG4gIERpcmVjdGlvbmFsTGlnaHQsXG4gIEV1bGVyLFxuICBIZW1pc3BoZXJlTGlnaHQsXG4gIEludGVyc2VjdGlvbixcbiAgTWF0aFV0aWxzLFxuICBNYXRyaXg0LFxuICBPYmplY3QzRCxcbiAgUENGU29mdFNoYWRvd01hcCxcbiAgUGVyc3BlY3RpdmVDYW1lcmEsXG4gIFF1YXRlcm5pb24sXG4gIFJheWNhc3RlcixcbiAgUmF5Y2FzdGVyUGFyYW1ldGVycyxcbiAgU2NlbmUsXG4gIHNSR0JFbmNvZGluZyxcbiAgVmVjdG9yMixcbiAgVmVjdG9yMyxcbiAgV2ViR0xSZW5kZXJlcixcbn0gZnJvbSBcInRocmVlXCI7XG5pbXBvcnQgeyBsYXRMbmdUb1ZlY3RvcjNSZWxhdGl2ZSwgdG9MYXRMbmdBbHRpdHVkZUxpdGVyYWwgfSBmcm9tIFwiLi91dGlsXCI7XG5cbmltcG9ydCB0eXBlIHsgTGF0TG5nVHlwZXMgfSBmcm9tIFwiLi91dGlsXCI7XG5cbmNvbnN0IERFRkFVTFRfVVAgPSBuZXcgVmVjdG9yMygwLCAwLCAxKTtcblxuZXhwb3J0IGludGVyZmFjZSBSYXljYXN0T3B0aW9ucyB7XG4gIC8qKlxuICAgKiBTZXQgdG8gdHJ1ZSB0byBhbHNvIHRlc3QgY2hpbGRyZW4gb2YgdGhlIHNwZWNpZmllZCBvYmplY3RzIGZvclxuICAgKiBpbnRlcnNlY3Rpb25zLlxuICAgKlxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgcmVjdXJzaXZlPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBpbnZlcnNlLXByb2plY3Rpb24tbWF0cml4IGJlZm9yZSBjYXN0aW5nIHRoZSByYXkgKHNldCB0aGlzXG4gICAqIHRvIGZhbHNlIGlmIHlvdSBuZWVkIHRvIHJ1biBtdWx0aXBsZSByYXljYXN0cyBmb3IgdGhlIHNhbWUgZnJhbWUpLlxuICAgKlxuICAgKiBAZGVmYXVsdCB0cnVlXG4gICAqL1xuICB1cGRhdGVNYXRyaXg/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBBZGRpdGlvbmFsIHBhcmFtZXRlcnMgdG8gcGFzcyB0byB0aGUgdGhyZWUuanMgcmF5Y2FzdGVyLlxuICAgKlxuICAgKiBAc2VlIGh0dHBzOi8vdGhyZWVqcy5vcmcvZG9jcy8jYXBpL2VuL2NvcmUvUmF5Y2FzdGVyLnBhcmFtc1xuICAgKi9cbiAgcmF5Y2FzdGVyUGFyYW1ldGVycz86IFJheWNhc3RlclBhcmFtZXRlcnM7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGhyZWVKU092ZXJsYXlWaWV3T3B0aW9ucyB7XG4gIC8qKlxuICAgKiBUaGUgYW5jaG9yIGZvciB0aGUgc2NlbmUuXG4gICAqXG4gICAqIEBkZWZhdWx0IHtsYXQ6IDAsIGxuZzogMCwgYWx0aXR1ZGU6IDB9XG4gICAqL1xuICBhbmNob3I/OiBMYXRMbmdUeXBlcztcblxuICAvKipcbiAgICogVGhlIGF4aXMgcG9pbnRpbmcgdXAgaW4gdGhlIHNjZW5lLiBDYW4gYmUgc3BlY2lmaWVkIGFzIFwiWlwiLCBcIllcIiBvciBhXG4gICAqIFZlY3RvcjMsIGluIHdoaWNoIGNhc2UgdGhlIG5vcm1hbGl6ZWQgdmVjdG9yIHdpbGwgYmVjb21lIHRoZSB1cC1heGlzLlxuICAgKlxuICAgKiBAZGVmYXVsdCBcIlpcIlxuICAgKi9cbiAgdXBBeGlzPzogXCJaXCIgfCBcIllcIiB8IFZlY3RvcjM7XG5cbiAgLyoqXG4gICAqIFRoZSBtYXAgdGhlIG92ZXJsYXkgd2lsbCBiZSBhZGRlZCB0by5cbiAgICogQ2FuIGJlIHNldCBhdCBpbml0aWFsaXphdGlvbiBvciBieSBjYWxsaW5nIGBzZXRNYXAobWFwKWAuXG4gICAqL1xuICBtYXA/OiBnb29nbGUubWFwcy5NYXA7XG5cbiAgLyoqXG4gICAqIFRoZSBzY2VuZSBvYmplY3QgdG8gcmVuZGVyIGluIHRoZSBvdmVybGF5LiBJZiBubyBzY2VuZSBpcyBzcGVjaWZpZWQsIGFcbiAgICogbmV3IHNjZW5lIGlzIGNyZWF0ZWQgYW5kIGNhbiBiZSBhY2Nlc3NlZCB2aWEgYG92ZXJsYXkuc2NlbmVgLlxuICAgKi9cbiAgc2NlbmU/OiBTY2VuZTtcblxuICAvKipcbiAgICogVGhlIGFuaW1hdGlvbiBtb2RlIGNvbnRyb2xzIHdoZW4gdGhlIG92ZXJsYXkgd2lsbCByZWRyYXcsIGVpdGhlclxuICAgKiBjb250aW51b3VzbHkgKGBhbHdheXNgKSBvciBvbiBkZW1hbmQgKGBvbmRlbWFuZGApLiBXaGVuIHVzaW5nIHRoZVxuICAgKiBvbiBkZW1hbmQgbW9kZSwgdGhlIG92ZXJsYXkgd2lsbCByZS1yZW5kZXIgd2hlbmV2ZXIgdGhlIG1hcCByZW5kZXJzXG4gICAqIChjYW1lcmEgbW92ZW1lbnRzKSBvciB3aGVuIGByZXF1ZXN0UmVkcmF3KClgIGlzIGNhbGxlZC5cbiAgICpcbiAgICogVG8gYWNoaWV2ZSBhbmltYXRpb25zIGluIHRoaXMgbW9kZSwgeW91IGNhbiBlaXRoZXIgdXNlIGFuIG91dHNpZGVcbiAgICogYW5pbWF0aW9uLWxvb3AgdGhhdCBjYWxscyBgcmVxdWVzdFJlZHJhdygpYCBhcyBsb25nIGFzIG5lZWRlZCBvciBjYWxsXG4gICAqIGByZXF1ZXN0UmVkcmF3KClgIGZyb20gd2l0aGluIHRoZSBgb25CZWZvcmVSZW5kZXJgIGZ1bmN0aW9uIHRvXG4gICAqXG4gICAqIEBkZWZhdWx0IFwib25kZW1hbmRcIlxuICAgKi9cbiAgYW5pbWF0aW9uTW9kZT86IFwiYWx3YXlzXCIgfCBcIm9uZGVtYW5kXCI7XG5cbiAgLyoqXG4gICAqIEFkZCBkZWZhdWx0IGxpZ2h0aW5nIHRvIHRoZSBzY2VuZS5cbiAgICogQGRlZmF1bHQgdHJ1ZVxuICAgKi9cbiAgYWRkRGVmYXVsdExpZ2h0aW5nPzogYm9vbGVhbjtcbn1cblxuLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWVtcHR5LWZ1bmN0aW9uICovXG5cbi8qKlxuICogQWRkIGEgW3RocmVlLmpzXShodHRwczovL3RocmVlanMub3JnKSBzY2VuZSBhcyBhIFtHb29nbGUgTWFwcyBXZWJHTE92ZXJsYXlWaWV3XShodHRwOi8vZ29vLmdsZS9XZWJHTE92ZXJsYXlWaWV3LXJlZikuXG4gKi9cbmV4cG9ydCBjbGFzcyBUaHJlZUpTT3ZlcmxheVZpZXcgaW1wbGVtZW50cyBnb29nbGUubWFwcy5XZWJHTE92ZXJsYXlWaWV3IHtcbiAgLyoqIHtAaW5oZXJpdERvYyBUaHJlZUpTT3ZlcmxheVZpZXdPcHRpb25zLnNjZW5lfSAqL1xuICBwdWJsaWMgcmVhZG9ubHkgc2NlbmU6IFNjZW5lO1xuXG4gIC8qKiB7QGluaGVyaXREb2MgVGhyZWVKU092ZXJsYXlWaWV3T3B0aW9ucy5hbmltYXRpb25Nb2RlfSAqL1xuICBwdWJsaWMgYW5pbWF0aW9uTW9kZTogXCJhbHdheXNcIiB8IFwib25kZW1hbmRcIiA9IFwib25kZW1hbmRcIjtcblxuICAvKioge0Bpbmhlcml0RG9jIFRocmVlSlNPdmVybGF5Vmlld09wdGlvbnMuYW5jaG9yfSAqL1xuICBwcm90ZWN0ZWQgYW5jaG9yOiBnb29nbGUubWFwcy5MYXRMbmdBbHRpdHVkZUxpdGVyYWw7XG4gIHByb3RlY3RlZCByZWFkb25seSBjYW1lcmE6IFBlcnNwZWN0aXZlQ2FtZXJhO1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgcm90YXRpb25BcnJheTogRmxvYXQzMkFycmF5ID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgcHJvdGVjdGVkIHJlYWRvbmx5IHJvdGF0aW9uSW52ZXJzZTogUXVhdGVybmlvbiA9IG5ldyBRdWF0ZXJuaW9uKCk7XG4gIHByb3RlY3RlZCByZWFkb25seSBwcm9qZWN0aW9uTWF0cml4SW52ZXJzZSA9IG5ldyBNYXRyaXg0KCk7XG5cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IG92ZXJsYXk6IGdvb2dsZS5tYXBzLldlYkdMT3ZlcmxheVZpZXc7XG4gIHByb3RlY3RlZCByZW5kZXJlcjogV2ViR0xSZW5kZXJlcjtcbiAgcHJvdGVjdGVkIHJheWNhc3RlcjogUmF5Y2FzdGVyID0gbmV3IFJheWNhc3RlcigpO1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IFRocmVlSlNPdmVybGF5Vmlld09wdGlvbnMgPSB7fSkge1xuICAgIGNvbnN0IHtcbiAgICAgIGFuY2hvciA9IHsgbGF0OiAwLCBsbmc6IDAsIGFsdGl0dWRlOiAwIH0sXG4gICAgICB1cEF4aXMgPSBcIlpcIixcbiAgICAgIHNjZW5lLFxuICAgICAgbWFwLFxuICAgICAgYW5pbWF0aW9uTW9kZSA9IFwib25kZW1hbmRcIixcbiAgICAgIGFkZERlZmF1bHRMaWdodGluZyA9IHRydWUsXG4gICAgfSA9IG9wdGlvbnM7XG5cbiAgICB0aGlzLm92ZXJsYXkgPSBuZXcgZ29vZ2xlLm1hcHMuV2ViR0xPdmVybGF5VmlldygpO1xuICAgIHRoaXMucmVuZGVyZXIgPSBudWxsO1xuICAgIHRoaXMuY2FtZXJhID0gbnVsbDtcbiAgICB0aGlzLmFuaW1hdGlvbk1vZGUgPSBhbmltYXRpb25Nb2RlO1xuXG4gICAgdGhpcy5zZXRBbmNob3IoYW5jaG9yKTtcbiAgICB0aGlzLnNldFVwQXhpcyh1cEF4aXMpO1xuXG4gICAgdGhpcy5zY2VuZSA9IHNjZW5lID8/IG5ldyBTY2VuZSgpO1xuICAgIGlmIChhZGREZWZhdWx0TGlnaHRpbmcpIHRoaXMuaW5pdFNjZW5lTGlnaHRzKCk7XG5cbiAgICB0aGlzLm92ZXJsYXkub25BZGQgPSB0aGlzLm9uQWRkLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vdmVybGF5Lm9uUmVtb3ZlID0gdGhpcy5vblJlbW92ZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMub3ZlcmxheS5vbkNvbnRleHRMb3N0ID0gdGhpcy5vbkNvbnRleHRMb3N0LmJpbmQodGhpcyk7XG4gICAgdGhpcy5vdmVybGF5Lm9uQ29udGV4dFJlc3RvcmVkID0gdGhpcy5vbkNvbnRleHRSZXN0b3JlZC5iaW5kKHRoaXMpO1xuICAgIHRoaXMub3ZlcmxheS5vblN0YXRlVXBkYXRlID0gdGhpcy5vblN0YXRlVXBkYXRlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vdmVybGF5Lm9uRHJhdyA9IHRoaXMub25EcmF3LmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLmNhbWVyYSA9IG5ldyBQZXJzcGVjdGl2ZUNhbWVyYSgpO1xuXG4gICAgaWYgKG1hcCkge1xuICAgICAgdGhpcy5zZXRNYXAobWFwKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgYW5jaG9yLXBvaW50LlxuICAgKiBAcGFyYW0gYW5jaG9yXG4gICAqL1xuICBwdWJsaWMgc2V0QW5jaG9yKGFuY2hvcjogTGF0TG5nVHlwZXMpIHtcbiAgICB0aGlzLmFuY2hvciA9IHRvTGF0TG5nQWx0aXR1ZGVMaXRlcmFsKGFuY2hvcik7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgYXhpcyB0byB1c2UgYXMgXCJ1cFwiIGluIHRoZSBzY2VuZS5cbiAgICogQHBhcmFtIGF4aXNcbiAgICovXG4gIHB1YmxpYyBzZXRVcEF4aXMoYXhpczogXCJZXCIgfCBcIlpcIiB8IFZlY3RvcjMpOiB2b2lkIHtcbiAgICBjb25zdCB1cFZlY3RvciA9IG5ldyBWZWN0b3IzKDAsIDAsIDEpO1xuICAgIGlmICh0eXBlb2YgYXhpcyAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgdXBWZWN0b3IuY29weShheGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGF4aXMudG9Mb3dlckNhc2UoKSA9PT0gXCJ5XCIpIHtcbiAgICAgICAgdXBWZWN0b3Iuc2V0KDAsIDEsIDApO1xuICAgICAgfSBlbHNlIGlmIChheGlzLnRvTG93ZXJDYXNlKCkgIT09IFwielwiKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihgaW52YWxpZCB2YWx1ZSAnJHtheGlzfScgc3BlY2lmaWVkIGFzIHVwQXhpc2ApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHVwVmVjdG9yLm5vcm1hbGl6ZSgpO1xuXG4gICAgY29uc3QgcSA9IG5ldyBRdWF0ZXJuaW9uKCk7XG4gICAgcS5zZXRGcm9tVW5pdFZlY3RvcnModXBWZWN0b3IsIERFRkFVTFRfVVApO1xuXG4gICAgLy8gaW52ZXJzZSByb3RhdGlvbiBpcyBuZWVkZWQgaW4gbGF0TG5nQWx0aXR1ZGVUb1ZlY3RvcjMoKVxuICAgIHRoaXMucm90YXRpb25JbnZlcnNlLmNvcHkocSkuaW52ZXJ0KCk7XG5cbiAgICAvLyBjb3B5IHRvIHJvdGF0aW9uQXJyYXkgZm9yIHRyYW5zZm9ybWVyLmZyb21MYXRMbmdBbHRpdHVkZSgpXG4gICAgY29uc3QgZXVsZXIgPSBuZXcgRXVsZXIoKS5zZXRGcm9tUXVhdGVybmlvbihxLCBcIlhZWlwiKTtcbiAgICB0aGlzLnJvdGF0aW9uQXJyYXlbMF0gPSBNYXRoVXRpbHMucmFkVG9EZWcoZXVsZXIueCk7XG4gICAgdGhpcy5yb3RhdGlvbkFycmF5WzFdID0gTWF0aFV0aWxzLnJhZFRvRGVnKGV1bGVyLnkpO1xuICAgIHRoaXMucm90YXRpb25BcnJheVsyXSA9IE1hdGhVdGlscy5yYWRUb0RlZyhldWxlci56KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIHJheWNhc3RpbmcgZm9yIHRoZSBzcGVjaWZpZWQgc2NyZWVuLWNvb3JkaW5hdGVzIGFnYWluc3QgYWxsIG9iamVjdHNcbiAgICogaW4gdGhlIHNjZW5lLlxuICAgKlxuICAgKiBAcGFyYW0gcCBub3JtYWxpemVkIHNjcmVlbnNwYWNlIGNvb3JkaW5hdGVzIG9mIHRoZVxuICAgKiAgIG1vdXNlLWN1cnNvci4geC95IGFyZSBpbiByYW5nZSBbLTEsIDFdLCB5IGlzIHBvaW50aW5nIHVwLlxuICAgKiBAcGFyYW0gb3B0aW9ucyByYXljYXN0aW5nIG9wdGlvbnMuIEluIHRoaXMgY2FzZSB0aGUgYHJlY3Vyc2l2ZWAgb3B0aW9uXG4gICAqICAgaGFzIG5vIGVmZmVjdCBhcyBpdCBpcyBhbHdheXMgcmVjdXJzaXZlLlxuICAgKiBAcmV0dXJuIHRoZSBsaXN0IG9mIGludGVyc2VjdGlvbnNcbiAgICovXG4gIHB1YmxpYyByYXljYXN0KHA6IFZlY3RvcjIsIG9wdGlvbnM/OiBSYXljYXN0T3B0aW9ucyk6IEludGVyc2VjdGlvbltdO1xuXG4gIC8qKlxuICAgKiBSdW5zIHJheWNhc3RpbmcgZm9yIHRoZSBzcGVjaWZpZWQgc2NyZWVuLWNvb3JkaW5hdGVzIGFnYWluc3QgdGhlIHNwZWNpZmllZFxuICAgKiBsaXN0IG9mIG9iamVjdHMuXG4gICAqXG4gICAqIE5vdGUgZm9yIHR5cGVzY3JpcHQgdXNlcnM6IHRoZSByZXR1cm5lZCBJbnRlcnNlY3Rpb24gb2JqZWN0cyBjYW4gb25seSBiZVxuICAgKiBwcm9wZXJseSB0eXBlZCBmb3Igbm9uLXJlY3Vyc2l2ZSBsb29rdXBzICh0aGlzIGlzIGhhbmRsZWQgYnkgdGhlIGludGVybmFsXG4gICAqIHNpZ25hdHVyZSBiZWxvdykuXG4gICAqXG4gICAqIEBwYXJhbSBwIG5vcm1hbGl6ZWQgc2NyZWVuc3BhY2UgY29vcmRpbmF0ZXMgb2YgdGhlXG4gICAqICAgbW91c2UtY3Vyc29yLiB4L3kgYXJlIGluIHJhbmdlIFstMSwgMV0sIHkgaXMgcG9pbnRpbmcgdXAuXG4gICAqIEBwYXJhbSBvYmplY3RzIGxpc3Qgb2Ygb2JqZWN0cyB0byB0ZXN0XG4gICAqIEBwYXJhbSBvcHRpb25zIHJheWNhc3Rpbmcgb3B0aW9ucy5cbiAgICovXG4gIHB1YmxpYyByYXljYXN0KFxuICAgIHA6IFZlY3RvcjIsXG4gICAgb2JqZWN0czogT2JqZWN0M0RbXSxcbiAgICBvcHRpb25zPzogUmF5Y2FzdE9wdGlvbnMgJiB7IHJlY3Vyc2l2ZTogdHJ1ZSB9XG4gICk6IEludGVyc2VjdGlvbltdO1xuXG4gIC8vIGFkZGl0aW9uYWwgc2lnbmF0dXJlIHRvIGVuYWJsZSB0eXBpbmdzIGluIHJldHVybmVkIG9iamVjdHMgd2hlbiBwb3NzaWJsZVxuICBwdWJsaWMgcmF5Y2FzdDxUIGV4dGVuZHMgT2JqZWN0M0Q+KFxuICAgIHA6IFZlY3RvcjIsXG4gICAgb2JqZWN0czogVFtdLFxuICAgIG9wdGlvbnM/OlxuICAgICAgfCBPbWl0PFJheWNhc3RPcHRpb25zLCBcInJlY3Vyc2l2ZVwiPlxuICAgICAgfCAoUmF5Y2FzdE9wdGlvbnMgJiB7IHJlY3Vyc2l2ZTogZmFsc2UgfSlcbiAgKTogSW50ZXJzZWN0aW9uPFQ+W107XG5cbiAgLy8gaW1wbGVtZXRhdGlvblxuICBwdWJsaWMgcmF5Y2FzdChcbiAgICBwOiBWZWN0b3IyLFxuICAgIG9wdGlvbnNPck9iamVjdHM/OiBPYmplY3QzRFtdIHwgUmF5Y2FzdE9wdGlvbnMsXG4gICAgb3B0aW9uczogUmF5Y2FzdE9wdGlvbnMgPSB7fVxuICApOiBJbnRlcnNlY3Rpb25bXSB7XG4gICAgbGV0IG9iamVjdHM6IE9iamVjdDNEW107XG4gICAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9uc09yT2JqZWN0cykpIHtcbiAgICAgIG9iamVjdHMgPSBvcHRpb25zT3JPYmplY3RzIHx8IG51bGw7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9iamVjdHMgPSBbdGhpcy5zY2VuZV07XG4gICAgICBvcHRpb25zID0geyAuLi5vcHRpb25zT3JPYmplY3RzLCByZWN1cnNpdmU6IHRydWUgfTtcbiAgICB9XG5cbiAgICBjb25zdCB7XG4gICAgICB1cGRhdGVNYXRyaXggPSB0cnVlLFxuICAgICAgcmVjdXJzaXZlID0gZmFsc2UsXG4gICAgICByYXljYXN0ZXJQYXJhbWV0ZXJzLFxuICAgIH0gPSBvcHRpb25zO1xuXG4gICAgLy8gd2hlbiBgcmF5Y2FzdCgpYCBpcyBjYWxsZWQgZnJvbSB3aXRoaW4gdGhlIGBvbkJlZm9yZVJlbmRlcigpYCBjYWxsYmFjayxcbiAgICAvLyB0aGUgbXZwLW1hdHJpeCBmb3IgdGhpcyBmcmFtZSBoYXMgYWxyZWFkeSBiZWVuIGNvbXB1dGVkIGFuZCBzdG9yZWQgaW5cbiAgICAvLyBgdGhpcy5jYW1lcmEucHJvamVjdGlvbk1hdHJpeGAuXG4gICAgLy8gVGhlIG12cC1tYXRyaXggdHJhbnNmb3JtcyB3b3JsZC1zcGFjZSBtZXRlcnMgdG8gY2xpcC1zcGFjZVxuICAgIC8vIGNvb3JkaW5hdGVzLiBUaGUgaW52ZXJzZSBtYXRyaXggY3JlYXRlZCBoZXJlIGRvZXMgdGhlIGV4YWN0IG9wcG9zaXRlXG4gICAgLy8gYW5kIGNvbnZlcnRzIGNsaXAtc3BhY2UgY29vcmRpbmF0ZXMgdG8gd29ybGQtc3BhY2UuXG4gICAgaWYgKHVwZGF0ZU1hdHJpeCkge1xuICAgICAgdGhpcy5wcm9qZWN0aW9uTWF0cml4SW52ZXJzZS5jb3B5KHRoaXMuY2FtZXJhLnByb2plY3Rpb25NYXRyaXgpLmludmVydCgpO1xuICAgIH1cblxuICAgIC8vIGNyZWF0ZSB0d28gcG9pbnRzICh3aXRoIGRpZmZlcmVudCBkZXB0aCkgZnJvbSB0aGUgbW91c2UtcG9zaXRpb24gYW5kXG4gICAgLy8gY29udmVydCB0aGVtIGludG8gd29ybGQtc3BhY2UgY29vcmRpbmF0ZXMgdG8gc2V0IHVwIHRoZSByYXkuXG4gICAgdGhpcy5yYXljYXN0ZXIucmF5Lm9yaWdpblxuICAgICAgLnNldChwLngsIHAueSwgMClcbiAgICAgIC5hcHBseU1hdHJpeDQodGhpcy5wcm9qZWN0aW9uTWF0cml4SW52ZXJzZSk7XG5cbiAgICB0aGlzLnJheWNhc3Rlci5yYXkuZGlyZWN0aW9uXG4gICAgICAuc2V0KHAueCwgcC55LCAwLjUpXG4gICAgICAuYXBwbHlNYXRyaXg0KHRoaXMucHJvamVjdGlvbk1hdHJpeEludmVyc2UpXG4gICAgICAuc3ViKHRoaXMucmF5Y2FzdGVyLnJheS5vcmlnaW4pXG4gICAgICAubm9ybWFsaXplKCk7XG5cbiAgICAvLyBiYWNrIHVwIHRoZSByYXljYXN0ZXIgcGFyYW1ldGVyc1xuICAgIGNvbnN0IG9sZFJheWNhc3RlclBhcmFtcyA9IHRoaXMucmF5Y2FzdGVyLnBhcmFtcztcbiAgICBpZiAocmF5Y2FzdGVyUGFyYW1ldGVycykge1xuICAgICAgdGhpcy5yYXljYXN0ZXIucGFyYW1zID0gcmF5Y2FzdGVyUGFyYW1ldGVycztcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHRzID0gdGhpcy5yYXljYXN0ZXIuaW50ZXJzZWN0T2JqZWN0cyhvYmplY3RzLCByZWN1cnNpdmUpO1xuXG4gICAgLy8gcmVzZXQgcmF5Y2FzdGVyIHBhcmFtcyB0byB3aGF0ZXZlciB0aGV5IHdlcmUgYmVmb3JlXG4gICAgdGhpcy5yYXljYXN0ZXIucGFyYW1zID0gb2xkUmF5Y2FzdGVyUGFyYW1zO1xuXG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cblxuICAvKipcbiAgICogT3ZlcndyaXRlIHRoaXMgbWV0aG9kIHRvIGhhbmRsZSBhbnkgR0wgc3RhdGUgdXBkYXRlcyBvdXRzaWRlIHRoZVxuICAgKiByZW5kZXIgYW5pbWF0aW9uIGZyYW1lLlxuICAgKiBAcGFyYW0gb3B0aW9uc1xuICAgKi9cbiAgcHVibGljIG9uU3RhdGVVcGRhdGUob3B0aW9uczogZ29vZ2xlLm1hcHMuV2ViR0xTdGF0ZU9wdGlvbnMpOiB2b2lkIHt9XG5cbiAgLyoqXG4gICAqIE92ZXJ3cml0ZSB0aGlzIG1ldGhvZCB0byBmZXRjaCBvciBjcmVhdGUgaW50ZXJtZWRpYXRlIGRhdGEgc3RydWN0dXJlc1xuICAgKiBiZWZvcmUgdGhlIG92ZXJsYXkgaXMgZHJhd24gdGhhdCBkb27igJl0IHJlcXVpcmUgaW1tZWRpYXRlIGFjY2VzcyB0byB0aGVcbiAgICogV2ViR0wgcmVuZGVyaW5nIGNvbnRleHQuXG4gICAqL1xuICBwdWJsaWMgb25BZGQoKTogdm9pZCB7fVxuXG4gIC8qKlxuICAgKiBPdmVyd3JpdGUgdGhpcyBtZXRob2QgdG8gdXBkYXRlIHlvdXIgc2NlbmUganVzdCBiZWZvcmUgYSBuZXcgZnJhbWUgaXNcbiAgICogZHJhd24uXG4gICAqL1xuICBwdWJsaWMgb25CZWZvcmVEcmF3KCk6IHZvaWQge31cblxuICAvKipcbiAgICogVGhpcyBtZXRob2QgaXMgY2FsbGVkIHdoZW4gdGhlIG92ZXJsYXkgaXMgcmVtb3ZlZCBmcm9tIHRoZSBtYXAgd2l0aFxuICAgKiBgb3ZlcmxheS5zZXRNYXAobnVsbClgLCBhbmQgaXMgd2hlcmUgeW91IGNhbiByZW1vdmUgYWxsIGludGVybWVkaWF0ZVxuICAgKiBvYmplY3RzIGNyZWF0ZWQgaW4gb25BZGQuXG4gICAqL1xuICBwdWJsaWMgb25SZW1vdmUoKTogdm9pZCB7fVxuXG4gIC8qKlxuICAgKiBUcmlnZ2VycyB0aGUgbWFwIHRvIHVwZGF0ZSBHTCBzdGF0ZS5cbiAgICovXG4gIHB1YmxpYyByZXF1ZXN0U3RhdGVVcGRhdGUoKTogdm9pZCB7XG4gICAgdGhpcy5vdmVybGF5LnJlcXVlc3RTdGF0ZVVwZGF0ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyaWdnZXJzIHRoZSBtYXAgdG8gcmVkcmF3IGEgZnJhbWUuXG4gICAqL1xuICBwdWJsaWMgcmVxdWVzdFJlZHJhdygpOiB2b2lkIHtcbiAgICB0aGlzLm92ZXJsYXkucmVxdWVzdFJlZHJhdygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG1hcCB0aGUgb3ZlcmxheSBpcyBhZGRlZCB0by5cbiAgICovXG4gIHB1YmxpYyBnZXRNYXAoKTogZ29vZ2xlLm1hcHMuTWFwIHtcbiAgICByZXR1cm4gdGhpcy5vdmVybGF5LmdldE1hcCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdGhlIG92ZXJsYXkgdG8gdGhlIG1hcC5cbiAgICogQHBhcmFtIG1hcCBUaGUgbWFwIHRvIGFjY2VzcyB0aGUgZGl2LCBtb2RlbCBhbmQgdmlldyBzdGF0ZS5cbiAgICovXG4gIHB1YmxpYyBzZXRNYXAobWFwOiBnb29nbGUubWFwcy5NYXApOiB2b2lkIHtcbiAgICB0aGlzLm92ZXJsYXkuc2V0TWFwKG1hcCk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0aGUgZ2l2ZW4gbGlzdGVuZXIgZnVuY3Rpb24gdG8gdGhlIGdpdmVuIGV2ZW50IG5hbWUuIFJldHVybnMgYW5cbiAgICogaWRlbnRpZmllciBmb3IgdGhpcyBsaXN0ZW5lciB0aGF0IGNhbiBiZSB1c2VkIHdpdGhcbiAgICogPGNvZGU+Z29vZ2xlLm1hcHMuZXZlbnQucmVtb3ZlTGlzdGVuZXI8L2NvZGU+LlxuICAgKi9cbiAgcHVibGljIGFkZExpc3RlbmVyKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nLFxuICAgIGhhbmRsZXI6ICguLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWRcbiAgKTogZ29vZ2xlLm1hcHMuTWFwc0V2ZW50TGlzdGVuZXIge1xuICAgIHJldHVybiB0aGlzLm92ZXJsYXkuYWRkTGlzdGVuZXIoZXZlbnROYW1lLCBoYW5kbGVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIG1ldGhvZCBpcyBjYWxsZWQgb25jZSB0aGUgcmVuZGVyaW5nIGNvbnRleHQgaXMgYXZhaWxhYmxlLiBVc2UgaXQgdG9cbiAgICogaW5pdGlhbGl6ZSBvciBiaW5kIGFueSBXZWJHTCBzdGF0ZSBzdWNoIGFzIHNoYWRlcnMgb3IgYnVmZmVyIG9iamVjdHMuXG4gICAqIEBwYXJhbSBvcHRpb25zIHRoYXQgYWxsb3cgZGV2ZWxvcGVycyB0byByZXN0b3JlIHRoZSBHTCBjb250ZXh0LlxuICAgKi9cbiAgcHVibGljIG9uQ29udGV4dFJlc3RvcmVkKHsgZ2wgfTogZ29vZ2xlLm1hcHMuV2ViR0xTdGF0ZU9wdGlvbnMpIHtcbiAgICB0aGlzLnJlbmRlcmVyID0gbmV3IFdlYkdMUmVuZGVyZXIoe1xuICAgICAgY2FudmFzOiBnbC5jYW52YXMsXG4gICAgICBjb250ZXh0OiBnbCxcbiAgICAgIC4uLmdsLmdldENvbnRleHRBdHRyaWJ1dGVzKCksXG4gICAgfSk7XG4gICAgdGhpcy5yZW5kZXJlci5hdXRvQ2xlYXIgPSBmYWxzZTtcbiAgICB0aGlzLnJlbmRlcmVyLmF1dG9DbGVhckRlcHRoID0gZmFsc2U7XG4gICAgdGhpcy5yZW5kZXJlci5zaGFkb3dNYXAuZW5hYmxlZCA9IHRydWU7XG4gICAgdGhpcy5yZW5kZXJlci5zaGFkb3dNYXAudHlwZSA9IFBDRlNvZnRTaGFkb3dNYXA7XG5cbiAgICAvLyBMaW5lYXJFbmNvZGluZyBpcyBkZWZhdWx0IGZvciBoaXN0b3JpY2FsIHJlYXNvbnNcbiAgICAvLyBodHRwczovL2Rpc2NvdXJzZS50aHJlZWpzLm9yZy90L2xpbmVhcmVuY29kaW5nLXZzLXNyZ2JlbmNvZGluZy8yMzI0M1xuICAgIHRoaXMucmVuZGVyZXIub3V0cHV0RW5jb2RpbmcgPSBzUkdCRW5jb2Rpbmc7XG5cbiAgICBjb25zdCB7IHdpZHRoLCBoZWlnaHQgfSA9IGdsLmNhbnZhcztcbiAgICB0aGlzLnJlbmRlcmVyLnNldFZpZXdwb3J0KDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGNhbGxlZCB3aGVuIHRoZSByZW5kZXJpbmcgY29udGV4dCBpcyBsb3N0IGZvciBhbnkgcmVhc29uLFxuICAgKiBhbmQgaXMgd2hlcmUgeW91IHNob3VsZCBjbGVhbiB1cCBhbnkgcHJlLWV4aXN0aW5nIEdMIHN0YXRlLCBzaW5jZSBpdCBpc1xuICAgKiBubyBsb25nZXIgbmVlZGVkLlxuICAgKi9cbiAgcHVibGljIG9uQ29udGV4dExvc3QoKSB7XG4gICAgaWYgKCF0aGlzLnJlbmRlcmVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5yZW5kZXJlci5kaXNwb3NlKCk7XG4gICAgdGhpcy5yZW5kZXJlciA9IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogSW1wbGVtZW50IHRoaXMgbWV0aG9kIHRvIGRyYXcgV2ViR0wgY29udGVudCBkaXJlY3RseSBvbiB0aGUgbWFwLiBOb3RlXG4gICAqIHRoYXQgaWYgdGhlIG92ZXJsYXkgbmVlZHMgYSBuZXcgZnJhbWUgZHJhd24gdGhlbiBjYWxsIHtAbGlua1xuICAgKiBUaHJlZUpTT3ZlcmxheVZpZXcucmVxdWVzdFJlZHJhd30uXG4gICAqIEBwYXJhbSBvcHRpb25zIHRoYXQgYWxsb3cgZGV2ZWxvcGVycyB0byByZW5kZXIgY29udGVudCB0byBhbiBhc3NvY2lhdGVkXG4gICAqICAgICBHb29nbGUgYmFzZW1hcC5cbiAgICovXG4gIHB1YmxpYyBvbkRyYXcoeyBnbCwgdHJhbnNmb3JtZXIgfTogZ29vZ2xlLm1hcHMuV2ViR0xEcmF3T3B0aW9ucyk6IHZvaWQge1xuICAgIHRoaXMuY2FtZXJhLnByb2plY3Rpb25NYXRyaXguZnJvbUFycmF5KFxuICAgICAgdHJhbnNmb3JtZXIuZnJvbUxhdExuZ0FsdGl0dWRlKHRoaXMuYW5jaG9yLCB0aGlzLnJvdGF0aW9uQXJyYXkpXG4gICAgKTtcblxuICAgIGdsLmRpc2FibGUoZ2wuU0NJU1NPUl9URVNUKTtcblxuICAgIHRoaXMub25CZWZvcmVEcmF3KCk7XG5cbiAgICB0aGlzLnJlbmRlcmVyLnJlbmRlcih0aGlzLnNjZW5lLCB0aGlzLmNhbWVyYSk7XG4gICAgdGhpcy5yZW5kZXJlci5yZXNldFN0YXRlKCk7XG5cbiAgICBpZiAodGhpcy5hbmltYXRpb25Nb2RlID09PSBcImFsd2F5c1wiKSB0aGlzLnJlcXVlc3RSZWRyYXcoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0IGNvb3JkaW5hdGVzIGZyb20gV0dTODQgTGF0aXR1ZGUgTG9uZ2l0dWRlIHRvIHdvcmxkLXNwYWNlXG4gICAqIGNvb3JkaW5hdGVzIHdoaWxlIHRha2luZyB0aGUgb3JpZ2luIGFuZCBvcmllbnRhdGlvbiBpbnRvIGFjY291bnQuXG4gICAqL1xuICBwdWJsaWMgbGF0TG5nQWx0aXR1ZGVUb1ZlY3RvcjMoXG4gICAgcG9zaXRpb246IExhdExuZ1R5cGVzLFxuICAgIHRhcmdldCA9IG5ldyBWZWN0b3IzKClcbiAgKSB7XG4gICAgbGF0TG5nVG9WZWN0b3IzUmVsYXRpdmUoXG4gICAgICB0b0xhdExuZ0FsdGl0dWRlTGl0ZXJhbChwb3NpdGlvbiksXG4gICAgICB0aGlzLmFuY2hvcixcbiAgICAgIHRhcmdldFxuICAgICk7XG5cbiAgICB0YXJnZXQuYXBwbHlRdWF0ZXJuaW9uKHRoaXMucm90YXRpb25JbnZlcnNlKTtcblxuICAgIHJldHVybiB0YXJnZXQ7XG4gIH1cblxuICAvLyBNVkNPYmplY3QgaW50ZXJmYWNlIGZvcndhcmRlZCB0byB0aGUgb3ZlcmxheVxuXG4gIC8qKlxuICAgKiBCaW5kcyBhIFZpZXcgdG8gYSBNb2RlbC5cbiAgICovXG4gIHB1YmxpYyBiaW5kVG8oXG4gICAga2V5OiBzdHJpbmcsXG4gICAgdGFyZ2V0OiBnb29nbGUubWFwcy5NVkNPYmplY3QsXG4gICAgdGFyZ2V0S2V5Pzogc3RyaW5nLFxuICAgIG5vTm90aWZ5PzogYm9vbGVhblxuICApOiB2b2lkIHtcbiAgICB0aGlzLm92ZXJsYXkuYmluZFRvKGtleSwgdGFyZ2V0LCB0YXJnZXRLZXksIG5vTm90aWZ5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgdmFsdWUuXG4gICAqL1xuICBwdWJsaWMgZ2V0KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMub3ZlcmxheS5nZXQoa2V5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBOb3RpZnkgYWxsIG9ic2VydmVycyBvZiBhIGNoYW5nZSBvbiB0aGlzIHByb3BlcnR5LiBUaGlzIG5vdGlmaWVzIGJvdGhcbiAgICogb2JqZWN0cyB0aGF0IGFyZSBib3VuZCB0byB0aGUgb2JqZWN0J3MgcHJvcGVydHkgYXMgd2VsbCBhcyB0aGUgb2JqZWN0XG4gICAqIHRoYXQgaXQgaXMgYm91bmQgdG8uXG4gICAqL1xuICBwdWJsaWMgbm90aWZ5KGtleTogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5vdmVybGF5Lm5vdGlmeShrZXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYSB2YWx1ZS5cbiAgICovXG4gIHB1YmxpYyBzZXQoa2V5OiBzdHJpbmcsIHZhbHVlOiB1bmtub3duKTogdm9pZCB7XG4gICAgdGhpcy5vdmVybGF5LnNldChrZXksIHZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGEgY29sbGVjdGlvbiBvZiBrZXktdmFsdWUgcGFpcnMuXG4gICAqL1xuICBwdWJsaWMgc2V0VmFsdWVzKHZhbHVlcz86IG9iamVjdCk6IHZvaWQge1xuICAgIHRoaXMub3ZlcmxheS5zZXRWYWx1ZXModmFsdWVzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGEgYmluZGluZy4gVW5iaW5kaW5nIHdpbGwgc2V0IHRoZSB1bmJvdW5kIHByb3BlcnR5IHRvIHRoZSBjdXJyZW50XG4gICAqIHZhbHVlLiBUaGUgb2JqZWN0IHdpbGwgbm90IGJlIG5vdGlmaWVkLCBhcyB0aGUgdmFsdWUgaGFzIG5vdCBjaGFuZ2VkLlxuICAgKi9cbiAgcHVibGljIHVuYmluZChrZXk6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMub3ZlcmxheS51bmJpbmQoa2V5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGFsbCBiaW5kaW5ncy5cbiAgICovXG4gIHB1YmxpYyB1bmJpbmRBbGwoKTogdm9pZCB7XG4gICAgdGhpcy5vdmVybGF5LnVuYmluZEFsbCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgbGlnaHRzIChkaXJlY3Rpb25hbCBhbmQgaGVtaXNwaGVyZSBsaWdodCkgdG8gaWxsdW1pbmF0ZSB0aGUgbW9kZWxcbiAgICogKHJvdWdobHkgYXBwcm94aW1hdGVzIHRoZSBsaWdodGluZyBvZiBidWlsZGluZ3MgaW4gbWFwcylcbiAgICovXG4gIHByaXZhdGUgaW5pdFNjZW5lTGlnaHRzKCkge1xuICAgIGNvbnN0IGhlbWlMaWdodCA9IG5ldyBIZW1pc3BoZXJlTGlnaHQoMHhmZmZmZmYsIDB4NDQ0NDQ0LCAxKTtcbiAgICBoZW1pTGlnaHQucG9zaXRpb24uc2V0KDAsIC0wLjIsIDEpLm5vcm1hbGl6ZSgpO1xuXG4gICAgY29uc3QgZGlyTGlnaHQgPSBuZXcgRGlyZWN0aW9uYWxMaWdodCgweGZmZmZmZik7XG4gICAgZGlyTGlnaHQucG9zaXRpb24uc2V0KDAsIDEwLCAxMDApO1xuXG4gICAgdGhpcy5zY2VuZS5hZGQoaGVtaUxpZ2h0LCBkaXJMaWdodCk7XG4gIH1cbn1cbiIsIi8qKlxuICogQ29weXJpZ2h0IDIwMjEgR29vZ2xlIExMQ1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHsgTE9BREVSX09QVElPTlMsIE1BUF9JRCB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IHsgVGhyZWVKU092ZXJsYXlWaWV3LCBXT1JMRF9TSVpFIH0gZnJvbSBcIi4uL3NyY1wiO1xuXG5pbXBvcnQgeyBMb2FkZXIgfSBmcm9tIFwiQGdvb2dsZW1hcHMvanMtYXBpLWxvYWRlclwiO1xuaW1wb3J0IHsgQXhlc0hlbHBlciB9IGZyb20gXCJ0aHJlZVwiO1xuXG5jb25zdCBtYXBPcHRpb25zID0ge1xuICBjZW50ZXI6IHtcbiAgICBsYXQ6IDQ1LFxuICAgIGxuZzogMCxcbiAgfSxcbiAgbWFwSWQ6IE1BUF9JRCxcbiAgem9vbTogNSxcbiAgaGVhZGluZzogLTQ1LFxuICB0aWx0OiA0NSxcbn07XG5cbm5ldyBMb2FkZXIoTE9BREVSX09QVElPTlMpLmxvYWQoKS50aGVuKCgpID0+IHtcbiAgY29uc3QgbWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1hcFwiKSwgbWFwT3B0aW9ucyk7XG4gIGNvbnN0IG92ZXJsYXkgPSBuZXcgVGhyZWVKU092ZXJsYXlWaWV3KHtcbiAgICBhbmNob3I6IHsgLi4ubWFwT3B0aW9ucy5jZW50ZXIsIGFsdGl0dWRlOiAwIH0sXG4gICAgbWFwLFxuICB9KTtcblxuICBvdmVybGF5LnNjZW5lLmFkZChuZXcgQXhlc0hlbHBlcihXT1JMRF9TSVpFKSk7XG59KTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7Ozs7Ozs7OztBQWNHO0FBSUksTUFBTSxNQUFNLEdBQUcsa0JBQWtCLENBQUM7QUFFbEMsTUFBTSxjQUFjLEdBQWtCO0FBQzNDLElBQUEsTUFBTSxFQUFFLHlDQUF5QztBQUNqRCxJQUFBLE9BQU8sRUFBRSxNQUFNO0FBQ2YsSUFBQSxTQUFTLEVBQUUsRUFBRTtDQUNkOztBQ3hCRDs7Ozs7Ozs7Ozs7Ozs7QUFjRztBQVVIO0FBQ0EsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDO0FBQzlDLE1BQU0sRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLEdBQUcsU0FBUyxDQUFDO0FBRWxDLE1BQU0sWUFBWSxHQUFHLFNBQVMsQ0FBQztBQUMvQixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLFlBQVksQ0FBQztBQUVqRDs7OztBQUlHO0FBQ0csU0FBVSx1QkFBdUIsQ0FDckMsS0FBa0IsRUFBQTtJQUVsQixJQUNFLE1BQU0sQ0FBQyxNQUFNO0FBQ2IsUUFBQSxNQUFNLENBQUMsSUFBSTtBQUNYLFNBQUMsS0FBSyxZQUFZLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTTtBQUNsQyxZQUFBLEtBQUssWUFBWSxNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxFQUM5QztRQUNBLE9BQU8sRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEdBQUcsS0FBSyxDQUFDLE1BQU0s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
