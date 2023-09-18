import { V as Vector3, M as MathUtils, Q as Quaternion, a as Matrix4, R as Raycaster, S as Scene, P as PerspectiveCamera, E as Euler, W as WebGLRenderer, b as PCFSoftShadowMap, c as REVISION, s as sRGBEncoding, H as HemisphereLight, D as DirectionalLight, L as Loader, A as AxesHelper } from './vendor-ffcac098.js';

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5jaG9yLmpzIiwic291cmNlcyI6WyIuLi8uLi9leGFtcGxlcy9jb25maWcudHMiLCIuLi8uLi9zcmMvdXRpbC50cyIsIi4uLy4uL3NyYy90aHJlZS50cyIsIi4uLy4uL2V4YW1wbGVzL2FuY2hvci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAyMDIxIEdvb2dsZSBMTENcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5leHBvcnQgY29uc3QgTUFQX0lEID0gXCI3YjlhODk3YWNkMGE2M2E0XCI7XG5leHBvcnQgY29uc3QgTE9BREVSX09QVElPTlMgPSB7XG4gICAgYXBpS2V5OiBcIkFJemFTeUQ4eGlhVlBXQjAyT2VRa0pPZW5MaUp6ZGVVSHpsaHUwMFwiLFxuICAgIHZlcnNpb246IFwiYmV0YVwiLFxuICAgIGxpYnJhcmllczogW10sXG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y29uZmlnLmpzLm1hcCIsIi8qKlxuICogQ29weXJpZ2h0IDIwMjEgR29vZ2xlIExMQy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5pbXBvcnQgeyBNYXRoVXRpbHMsIFZlY3RvcjMgfSBmcm9tIFwidGhyZWVcIjtcbi8vIHNob3J0aGFuZHMgZm9yIG1hdGgtZnVuY3Rpb25zLCBtYWtlcyBlcXVhdGlvbnMgbW9yZSByZWFkYWJsZVxuY29uc3QgeyBhdGFuLCBjb3MsIGV4cCwgbG9nLCB0YW4sIFBJIH0gPSBNYXRoO1xuY29uc3QgeyBkZWdUb1JhZCwgcmFkVG9EZWcgfSA9IE1hdGhVdGlscztcbmV4cG9ydCBjb25zdCBFQVJUSF9SQURJVVMgPSA2MzcxMDEwLjA7XG5leHBvcnQgY29uc3QgV09STERfU0laRSA9IE1hdGguUEkgKiBFQVJUSF9SQURJVVM7XG4vKipcbiAqIENvbnZlcnRzIGFueSBvZiB0aGUgc3VwcG9ydGVkIHBvc2l0aW9uIGZvcm1hdHMgaW50byB0aGVcbiAqIGdvb2dsZS5tYXBzLkxhdExuZ0FsdGl0dWRlTGl0ZXJhbCBmb3JtYXQgdXNlZCBmb3IgdGhlIGNhbGN1bGF0aW9ucy5cbiAqIEBwYXJhbSBwb2ludFxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9MYXRMbmdBbHRpdHVkZUxpdGVyYWwocG9pbnQpIHtcbiAgICBpZiAod2luZG93Lmdvb2dsZSAmJlxuICAgICAgICBnb29nbGUubWFwcyAmJlxuICAgICAgICAocG9pbnQgaW5zdGFuY2VvZiBnb29nbGUubWFwcy5MYXRMbmcgfHxcbiAgICAgICAgICAgIHBvaW50IGluc3RhbmNlb2YgZ29vZ2xlLm1hcHMuTGF0TG5nQWx0aXR1ZGUpKSB7XG4gICAgICAgIHJldHVybiB7IGFsdGl0dWRlOiAwLCAuLi5wb2ludC50b0pTT04oKSB9O1xuICAgIH1cbiAgICByZXR1cm4geyBhbHRpdHVkZTogMCwgLi4ucG9pbnQgfTtcbn1cbi8qKlxuICogQ29udmVydHMgbGF0aXR1ZGUgYW5kIGxvbmdpdHVkZSB0byB3b3JsZCBzcGFjZSBjb29yZGluYXRlcyByZWxhdGl2ZVxuICogdG8gYSByZWZlcmVuY2UgbG9jYXRpb24gd2l0aCB5IHVwLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbGF0TG5nVG9WZWN0b3IzUmVsYXRpdmUocG9pbnQsIHJlZmVyZW5jZSwgdGFyZ2V0ID0gbmV3IFZlY3RvcjMoKSkge1xuICAgIGNvbnN0IFtweCwgcHldID0gbGF0TG5nVG9YWShwb2ludCk7XG4gICAgY29uc3QgW3J4LCByeV0gPSBsYXRMbmdUb1hZKHJlZmVyZW5jZSk7XG4gICAgdGFyZ2V0LnNldChweCAtIHJ4LCBweSAtIHJ5LCAwKTtcbiAgICAvLyBhcHBseSB0aGUgc3BoZXJpY2FsIG1lcmNhdG9yIHNjYWxlLWZhY3RvciBmb3IgdGhlIHJlZmVyZW5jZSBsYXRpdHVkZVxuICAgIHRhcmdldC5tdWx0aXBseVNjYWxhcihjb3MoZGVnVG9SYWQocmVmZXJlbmNlLmxhdCkpKTtcbiAgICB0YXJnZXQueiA9IHBvaW50LmFsdGl0dWRlIC0gcmVmZXJlbmNlLmFsdGl0dWRlO1xuICAgIHJldHVybiB0YXJnZXQ7XG59XG4vKipcbiAqIENvbnZlcnRzIFdHUzg0IGxhdGl0dWRlIGFuZCBsb25naXR1ZGUgdG8gKHVuY29ycmVjdGVkKSBXZWJNZXJjYXRvciBtZXRlcnMuXG4gKiAoV0dTODQgLS0+IFdlYk1lcmNhdG9yIChFUFNHOjM4NTcpKVxuICovXG5leHBvcnQgZnVuY3Rpb24gbGF0TG5nVG9YWShwb3NpdGlvbikge1xuICAgIHJldHVybiBbXG4gICAgICAgIEVBUlRIX1JBRElVUyAqIGRlZ1RvUmFkKHBvc2l0aW9uLmxuZyksXG4gICAgICAgIEVBUlRIX1JBRElVUyAqIGxvZyh0YW4oMC4yNSAqIFBJICsgMC41ICogZGVnVG9SYWQocG9zaXRpb24ubGF0KSkpLFxuICAgIF07XG59XG4vKipcbiAqIENvbnZlcnRzIFdlYk1lcmNhdG9yIG1ldGVycyB0byBXR1M4NCBsYXRpdHVkZS9sb25naXR1ZGUuXG4gKiAoV2ViTWVyY2F0b3IgKEVQU0c6Mzg1NykgLS0+IFdHUzg0KVxuICovXG5leHBvcnQgZnVuY3Rpb24geHlUb0xhdExuZyhwKSB7XG4gICAgY29uc3QgW3gsIHldID0gcDtcbiAgICByZXR1cm4ge1xuICAgICAgICBsYXQ6IHJhZFRvRGVnKFBJICogMC41IC0gMi4wICogYXRhbihleHAoLXkgLyBFQVJUSF9SQURJVVMpKSksXG4gICAgICAgIGxuZzogcmFkVG9EZWcoeCkgLyBFQVJUSF9SQURJVVMsXG4gICAgfTtcbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXV0aWwuanMubWFwIiwiLyoqXG4gKiBDb3B5cmlnaHQgMjAyMSBHb29nbGUgTExDXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuaW1wb3J0IHsgRGlyZWN0aW9uYWxMaWdodCwgRXVsZXIsIEhlbWlzcGhlcmVMaWdodCwgTWF0aFV0aWxzLCBNYXRyaXg0LCBQQ0ZTb2Z0U2hhZG93TWFwLCBQZXJzcGVjdGl2ZUNhbWVyYSwgUXVhdGVybmlvbiwgUmF5Y2FzdGVyLCBSRVZJU0lPTiwgU2NlbmUsIHNSR0JFbmNvZGluZywgVmVjdG9yMywgV2ViR0xSZW5kZXJlciwgfSBmcm9tIFwidGhyZWVcIjtcbmltcG9ydCB7IGxhdExuZ1RvVmVjdG9yM1JlbGF0aXZlLCB0b0xhdExuZ0FsdGl0dWRlTGl0ZXJhbCB9IGZyb20gXCIuL3V0aWxcIjtcbmNvbnN0IERFRkFVTFRfVVAgPSBuZXcgVmVjdG9yMygwLCAwLCAxKTtcbi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uby1lbXB0eS1mdW5jdGlvbiAqL1xuLyoqXG4gKiBBZGQgYSBbdGhyZWUuanNdKGh0dHBzOi8vdGhyZWVqcy5vcmcpIHNjZW5lIGFzIGEgW0dvb2dsZSBNYXBzIFdlYkdMT3ZlcmxheVZpZXddKGh0dHA6Ly9nb28uZ2xlL1dlYkdMT3ZlcmxheVZpZXctcmVmKS5cbiAqL1xuZXhwb3J0IGNsYXNzIFRocmVlSlNPdmVybGF5VmlldyB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgICAgIC8qKiB7QGluaGVyaXREb2MgVGhyZWVKU092ZXJsYXlWaWV3T3B0aW9ucy5hbmltYXRpb25Nb2RlfSAqL1xuICAgICAgICB0aGlzLmFuaW1hdGlvbk1vZGUgPSBcIm9uZGVtYW5kXCI7XG4gICAgICAgIHRoaXMucm90YXRpb25BcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG4gICAgICAgIHRoaXMucm90YXRpb25JbnZlcnNlID0gbmV3IFF1YXRlcm5pb24oKTtcbiAgICAgICAgdGhpcy5wcm9qZWN0aW9uTWF0cml4SW52ZXJzZSA9IG5ldyBNYXRyaXg0KCk7XG4gICAgICAgIHRoaXMucmF5Y2FzdGVyID0gbmV3IFJheWNhc3RlcigpO1xuICAgICAgICBjb25zdCB7IGFuY2hvciA9IHsgbGF0OiAwLCBsbmc6IDAsIGFsdGl0dWRlOiAwIH0sIHVwQXhpcyA9IFwiWlwiLCBzY2VuZSwgbWFwLCBhbmltYXRpb25Nb2RlID0gXCJvbmRlbWFuZFwiLCBhZGREZWZhdWx0TGlnaHRpbmcgPSB0cnVlLCB9ID0gb3B0aW9ucztcbiAgICAgICAgdGhpcy5vdmVybGF5ID0gbmV3IGdvb2dsZS5tYXBzLldlYkdMT3ZlcmxheVZpZXcoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlciA9IG51bGw7XG4gICAgICAgIHRoaXMuY2FtZXJhID0gbnVsbDtcbiAgICAgICAgdGhpcy5hbmltYXRpb25Nb2RlID0gYW5pbWF0aW9uTW9kZTtcbiAgICAgICAgdGhpcy5zZXRBbmNob3IoYW5jaG9yKTtcbiAgICAgICAgdGhpcy5zZXRVcEF4aXModXBBeGlzKTtcbiAgICAgICAgdGhpcy5zY2VuZSA9IHNjZW5lID8/IG5ldyBTY2VuZSgpO1xuICAgICAgICBpZiAoYWRkRGVmYXVsdExpZ2h0aW5nKVxuICAgICAgICAgICAgdGhpcy5pbml0U2NlbmVMaWdodHMoKTtcbiAgICAgICAgdGhpcy5vdmVybGF5Lm9uQWRkID0gdGhpcy5vbkFkZC5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLm92ZXJsYXkub25SZW1vdmUgPSB0aGlzLm9uUmVtb3ZlLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMub3ZlcmxheS5vbkNvbnRleHRMb3N0ID0gdGhpcy5vbkNvbnRleHRMb3N0LmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMub3ZlcmxheS5vbkNvbnRleHRSZXN0b3JlZCA9IHRoaXMub25Db250ZXh0UmVzdG9yZWQuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5vdmVybGF5Lm9uU3RhdGVVcGRhdGUgPSB0aGlzLm9uU3RhdGVVcGRhdGUuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5vdmVybGF5Lm9uRHJhdyA9IHRoaXMub25EcmF3LmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuY2FtZXJhID0gbmV3IFBlcnNwZWN0aXZlQ2FtZXJhKCk7XG4gICAgICAgIGlmIChtYXApIHtcbiAgICAgICAgICAgIHRoaXMuc2V0TWFwKG1hcCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgYW5jaG9yLXBvaW50LlxuICAgICAqIEBwYXJhbSBhbmNob3JcbiAgICAgKi9cbiAgICBzZXRBbmNob3IoYW5jaG9yKSB7XG4gICAgICAgIHRoaXMuYW5jaG9yID0gdG9MYXRMbmdBbHRpdHVkZUxpdGVyYWwoYW5jaG9yKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgYXhpcyB0byB1c2UgYXMgXCJ1cFwiIGluIHRoZSBzY2VuZS5cbiAgICAgKiBAcGFyYW0gYXhpc1xuICAgICAqL1xuICAgIHNldFVwQXhpcyhheGlzKSB7XG4gICAgICAgIGNvbnN0IHVwVmVjdG9yID0gbmV3IFZlY3RvcjMoMCwgMCwgMSk7XG4gICAgICAgIGlmICh0eXBlb2YgYXhpcyAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdXBWZWN0b3IuY29weShheGlzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmIChheGlzLnRvTG93ZXJDYXNlKCkgPT09IFwieVwiKSB7XG4gICAgICAgICAgICAgICAgdXBWZWN0b3Iuc2V0KDAsIDEsIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoYXhpcy50b0xvd2VyQ2FzZSgpICE9PSBcInpcIikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgaW52YWxpZCB2YWx1ZSAnJHtheGlzfScgc3BlY2lmaWVkIGFzIHVwQXhpc2ApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHVwVmVjdG9yLm5vcm1hbGl6ZSgpO1xuICAgICAgICBjb25zdCBxID0gbmV3IFF1YXRlcm5pb24oKTtcbiAgICAgICAgcS5zZXRGcm9tVW5pdFZlY3RvcnModXBWZWN0b3IsIERFRkFVTFRfVVApO1xuICAgICAgICAvLyBpbnZlcnNlIHJvdGF0aW9uIGlzIG5lZWRlZCBpbiBsYXRMbmdBbHRpdHVkZVRvVmVjdG9yMygpXG4gICAgICAgIHRoaXMucm90YXRpb25JbnZlcnNlLmNvcHkocSkuaW52ZXJ0KCk7XG4gICAgICAgIC8vIGNvcHkgdG8gcm90YXRpb25BcnJheSBmb3IgdHJhbnNmb3JtZXIuZnJvbUxhdExuZ0FsdGl0dWRlKClcbiAgICAgICAgY29uc3QgZXVsZXIgPSBuZXcgRXVsZXIoKS5zZXRGcm9tUXVhdGVybmlvbihxLCBcIlhZWlwiKTtcbiAgICAgICAgdGhpcy5yb3RhdGlvbkFycmF5WzBdID0gTWF0aFV0aWxzLnJhZFRvRGVnKGV1bGVyLngpO1xuICAgICAgICB0aGlzLnJvdGF0aW9uQXJyYXlbMV0gPSBNYXRoVXRpbHMucmFkVG9EZWcoZXVsZXIueSk7XG4gICAgICAgIHRoaXMucm90YXRpb25BcnJheVsyXSA9IE1hdGhVdGlscy5yYWRUb0RlZyhldWxlci56KTtcbiAgICB9XG4gICAgLy8gaW1wbGVtZXRhdGlvblxuICAgIHJheWNhc3QocCwgb3B0aW9uc09yT2JqZWN0cywgb3B0aW9ucyA9IHt9KSB7XG4gICAgICAgIGxldCBvYmplY3RzO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zT3JPYmplY3RzKSkge1xuICAgICAgICAgICAgb2JqZWN0cyA9IG9wdGlvbnNPck9iamVjdHMgfHwgbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG9iamVjdHMgPSBbdGhpcy5zY2VuZV07XG4gICAgICAgICAgICBvcHRpb25zID0geyAuLi5vcHRpb25zT3JPYmplY3RzLCByZWN1cnNpdmU6IHRydWUgfTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7IHVwZGF0ZU1hdHJpeCA9IHRydWUsIHJlY3Vyc2l2ZSA9IGZhbHNlLCByYXljYXN0ZXJQYXJhbWV0ZXJzLCB9ID0gb3B0aW9ucztcbiAgICAgICAgLy8gd2hlbiBgcmF5Y2FzdCgpYCBpcyBjYWxsZWQgZnJvbSB3aXRoaW4gdGhlIGBvbkJlZm9yZVJlbmRlcigpYCBjYWxsYmFjayxcbiAgICAgICAgLy8gdGhlIG12cC1tYXRyaXggZm9yIHRoaXMgZnJhbWUgaGFzIGFscmVhZHkgYmVlbiBjb21wdXRlZCBhbmQgc3RvcmVkIGluXG4gICAgICAgIC8vIGB0aGlzLmNhbWVyYS5wcm9qZWN0aW9uTWF0cml4YC5cbiAgICAgICAgLy8gVGhlIG12cC1tYXRyaXggdHJhbnNmb3JtcyB3b3JsZC1zcGFjZSBtZXRlcnMgdG8gY2xpcC1zcGFjZVxuICAgICAgICAvLyBjb29yZGluYXRlcy4gVGhlIGludmVyc2UgbWF0cml4IGNyZWF0ZWQgaGVyZSBkb2VzIHRoZSBleGFjdCBvcHBvc2l0ZVxuICAgICAgICAvLyBhbmQgY29udmVydHMgY2xpcC1zcGFjZSBjb29yZGluYXRlcyB0byB3b3JsZC1zcGFjZS5cbiAgICAgICAgaWYgKHVwZGF0ZU1hdHJpeCkge1xuICAgICAgICAgICAgdGhpcy5wcm9qZWN0aW9uTWF0cml4SW52ZXJzZS5jb3B5KHRoaXMuY2FtZXJhLnByb2plY3Rpb25NYXRyaXgpLmludmVydCgpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGNyZWF0ZSB0d28gcG9pbnRzICh3aXRoIGRpZmZlcmVudCBkZXB0aCkgZnJvbSB0aGUgbW91c2UtcG9zaXRpb24gYW5kXG4gICAgICAgIC8vIGNvbnZlcnQgdGhlbSBpbnRvIHdvcmxkLXNwYWNlIGNvb3JkaW5hdGVzIHRvIHNldCB1cCB0aGUgcmF5LlxuICAgICAgICB0aGlzLnJheWNhc3Rlci5yYXkub3JpZ2luXG4gICAgICAgICAgICAuc2V0KHAueCwgcC55LCAwKVxuICAgICAgICAgICAgLmFwcGx5TWF0cml4NCh0aGlzLnByb2plY3Rpb25NYXRyaXhJbnZlcnNlKTtcbiAgICAgICAgdGhpcy5yYXljYXN0ZXIucmF5LmRpcmVjdGlvblxuICAgICAgICAgICAgLnNldChwLngsIHAueSwgMC41KVxuICAgICAgICAgICAgLmFwcGx5TWF0cml4NCh0aGlzLnByb2plY3Rpb25NYXRyaXhJbnZlcnNlKVxuICAgICAgICAgICAgLnN1Yih0aGlzLnJheWNhc3Rlci5yYXkub3JpZ2luKVxuICAgICAgICAgICAgLm5vcm1hbGl6ZSgpO1xuICAgICAgICAvLyBiYWNrIHVwIHRoZSByYXljYXN0ZXIgcGFyYW1ldGVyc1xuICAgICAgICBjb25zdCBvbGRSYXljYXN0ZXJQYXJhbXMgPSB0aGlzLnJheWNhc3Rlci5wYXJhbXM7XG4gICAgICAgIGlmIChyYXljYXN0ZXJQYXJhbWV0ZXJzKSB7XG4gICAgICAgICAgICB0aGlzLnJheWNhc3Rlci5wYXJhbXMgPSByYXljYXN0ZXJQYXJhbWV0ZXJzO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSB0aGlzLnJheWNhc3Rlci5pbnRlcnNlY3RPYmplY3RzKG9iamVjdHMsIHJlY3Vyc2l2ZSk7XG4gICAgICAgIC8vIHJlc2V0IHJheWNhc3RlciBwYXJhbXMgdG8gd2hhdGV2ZXIgdGhleSB3ZXJlIGJlZm9yZVxuICAgICAgICB0aGlzLnJheWNhc3Rlci5wYXJhbXMgPSBvbGRSYXljYXN0ZXJQYXJhbXM7XG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cbiAgICBvblN0YXRlVXBkYXRlKCkgeyB9XG4gICAgLyoqXG4gICAgICogT3ZlcndyaXRlIHRoaXMgbWV0aG9kIHRvIGZldGNoIG9yIGNyZWF0ZSBpbnRlcm1lZGlhdGUgZGF0YSBzdHJ1Y3R1cmVzXG4gICAgICogYmVmb3JlIHRoZSBvdmVybGF5IGlzIGRyYXduIHRoYXQgZG9u4oCZdCByZXF1aXJlIGltbWVkaWF0ZSBhY2Nlc3MgdG8gdGhlXG4gICAgICogV2ViR0wgcmVuZGVyaW5nIGNvbnRleHQuXG4gICAgICovXG4gICAgb25BZGQoKSB7IH1cbiAgICAvKipcbiAgICAgKiBPdmVyd3JpdGUgdGhpcyBtZXRob2QgdG8gdXBkYXRlIHlvdXIgc2NlbmUganVzdCBiZWZvcmUgYSBuZXcgZnJhbWUgaXNcbiAgICAgKiBkcmF3bi5cbiAgICAgKi9cbiAgICBvbkJlZm9yZURyYXcoKSB7IH1cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBpcyBjYWxsZWQgd2hlbiB0aGUgb3ZlcmxheSBpcyByZW1vdmVkIGZyb20gdGhlIG1hcCB3aXRoXG4gICAgICogYG92ZXJsYXkuc2V0TWFwKG51bGwpYCwgYW5kIGlzIHdoZXJlIHlvdSBjYW4gcmVtb3ZlIGFsbCBpbnRlcm1lZGlhdGVcbiAgICAgKiBvYmplY3RzIGNyZWF0ZWQgaW4gb25BZGQuXG4gICAgICovXG4gICAgb25SZW1vdmUoKSB7IH1cbiAgICAvKipcbiAgICAgKiBUcmlnZ2VycyB0aGUgbWFwIHRvIHVwZGF0ZSBHTCBzdGF0ZS5cbiAgICAgKi9cbiAgICByZXF1ZXN0U3RhdGVVcGRhdGUoKSB7XG4gICAgICAgIHRoaXMub3ZlcmxheS5yZXF1ZXN0U3RhdGVVcGRhdGUoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogVHJpZ2dlcnMgdGhlIG1hcCB0byByZWRyYXcgYSBmcmFtZS5cbiAgICAgKi9cbiAgICByZXF1ZXN0UmVkcmF3KCkge1xuICAgICAgICB0aGlzLm92ZXJsYXkucmVxdWVzdFJlZHJhdygpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBtYXAgdGhlIG92ZXJsYXkgaXMgYWRkZWQgdG8uXG4gICAgICovXG4gICAgZ2V0TWFwKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vdmVybGF5LmdldE1hcCgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIHRoZSBvdmVybGF5IHRvIHRoZSBtYXAuXG4gICAgICogQHBhcmFtIG1hcCBUaGUgbWFwIHRvIGFjY2VzcyB0aGUgZGl2LCBtb2RlbCBhbmQgdmlldyBzdGF0ZS5cbiAgICAgKi9cbiAgICBzZXRNYXAobWFwKSB7XG4gICAgICAgIHRoaXMub3ZlcmxheS5zZXRNYXAobWFwKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyB0aGUgZ2l2ZW4gbGlzdGVuZXIgZnVuY3Rpb24gdG8gdGhlIGdpdmVuIGV2ZW50IG5hbWUuIFJldHVybnMgYW5cbiAgICAgKiBpZGVudGlmaWVyIGZvciB0aGlzIGxpc3RlbmVyIHRoYXQgY2FuIGJlIHVzZWQgd2l0aFxuICAgICAqIDxjb2RlPmdvb2dsZS5tYXBzLmV2ZW50LnJlbW92ZUxpc3RlbmVyPC9jb2RlPi5cbiAgICAgKi9cbiAgICBhZGRMaXN0ZW5lcihldmVudE5hbWUsIGhhbmRsZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3ZlcmxheS5hZGRMaXN0ZW5lcihldmVudE5hbWUsIGhhbmRsZXIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBpcyBjYWxsZWQgb25jZSB0aGUgcmVuZGVyaW5nIGNvbnRleHQgaXMgYXZhaWxhYmxlLiBVc2UgaXQgdG9cbiAgICAgKiBpbml0aWFsaXplIG9yIGJpbmQgYW55IFdlYkdMIHN0YXRlIHN1Y2ggYXMgc2hhZGVycyBvciBidWZmZXIgb2JqZWN0cy5cbiAgICAgKiBAcGFyYW0gb3B0aW9ucyB0aGF0IGFsbG93IGRldmVsb3BlcnMgdG8gcmVzdG9yZSB0aGUgR0wgY29udGV4dC5cbiAgICAgKi9cbiAgICBvbkNvbnRleHRSZXN0b3JlZCh7IGdsIH0pIHtcbiAgICAgICAgdGhpcy5yZW5kZXJlciA9IG5ldyBXZWJHTFJlbmRlcmVyKHtcbiAgICAgICAgICAgIGNhbnZhczogZ2wuY2FudmFzLFxuICAgICAgICAgICAgY29udGV4dDogZ2wsXG4gICAgICAgICAgICAuLi5nbC5nZXRDb250ZXh0QXR0cmlidXRlcygpLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5hdXRvQ2xlYXIgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5hdXRvQ2xlYXJEZXB0aCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNoYWRvd01hcC5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zaGFkb3dNYXAudHlwZSA9IFBDRlNvZnRTaGFkb3dNYXA7XG4gICAgICAgIC8vIFNpbmNlIHIxNTIsIGRlZmF1bHQgb3V0cHV0Q29sb3JTcGFjZSBpcyBTUkdCXG4gICAgICAgIC8vIERlcHJlY2F0ZWQgb3V0cHV0RW5jb2Rpbmcga2VwdCBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHlcbiAgICAgICAgaWYgKE51bWJlcihSRVZJU0lPTikgPCAxNTIpXG4gICAgICAgICAgICB0aGlzLnJlbmRlcmVyLm91dHB1dEVuY29kaW5nID0gc1JHQkVuY29kaW5nO1xuICAgICAgICBjb25zdCB7IHdpZHRoLCBoZWlnaHQgfSA9IGdsLmNhbnZhcztcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRWaWV3cG9ydCgwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgaXMgY2FsbGVkIHdoZW4gdGhlIHJlbmRlcmluZyBjb250ZXh0IGlzIGxvc3QgZm9yIGFueSByZWFzb24sXG4gICAgICogYW5kIGlzIHdoZXJlIHlvdSBzaG91bGQgY2xlYW4gdXAgYW55IHByZS1leGlzdGluZyBHTCBzdGF0ZSwgc2luY2UgaXQgaXNcbiAgICAgKiBubyBsb25nZXIgbmVlZGVkLlxuICAgICAqL1xuICAgIG9uQ29udGV4dExvc3QoKSB7XG4gICAgICAgIGlmICghdGhpcy5yZW5kZXJlcikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVuZGVyZXIuZGlzcG9zZSgpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyID0gbnVsbDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogSW1wbGVtZW50IHRoaXMgbWV0aG9kIHRvIGRyYXcgV2ViR0wgY29udGVudCBkaXJlY3RseSBvbiB0aGUgbWFwLiBOb3RlXG4gICAgICogdGhhdCBpZiB0aGUgb3ZlcmxheSBuZWVkcyBhIG5ldyBmcmFtZSBkcmF3biB0aGVuIGNhbGwge0BsaW5rXG4gICAgICogVGhyZWVKU092ZXJsYXlWaWV3LnJlcXVlc3RSZWRyYXd9LlxuICAgICAqIEBwYXJhbSBvcHRpb25zIHRoYXQgYWxsb3cgZGV2ZWxvcGVycyB0byByZW5kZXIgY29udGVudCB0byBhbiBhc3NvY2lhdGVkXG4gICAgICogICAgIEdvb2dsZSBiYXNlbWFwLlxuICAgICAqL1xuICAgIG9uRHJhdyh7IGdsLCB0cmFuc2Zvcm1lciB9KSB7XG4gICAgICAgIHRoaXMuY2FtZXJhLnByb2plY3Rpb25NYXRyaXguZnJvbUFycmF5KHRyYW5zZm9ybWVyLmZyb21MYXRMbmdBbHRpdHVkZSh0aGlzLmFuY2hvciwgdGhpcy5yb3RhdGlvbkFycmF5KSk7XG4gICAgICAgIGdsLmRpc2FibGUoZ2wuU0NJU1NPUl9URVNUKTtcbiAgICAgICAgdGhpcy5vbkJlZm9yZURyYXcoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5yZW5kZXIodGhpcy5zY2VuZSwgdGhpcy5jYW1lcmEpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnJlc2V0U3RhdGUoKTtcbiAgICAgICAgaWYgKHRoaXMuYW5pbWF0aW9uTW9kZSA9PT0gXCJhbHdheXNcIilcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdFJlZHJhdygpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IGNvb3JkaW5hdGVzIGZyb20gV0dTODQgTGF0aXR1ZGUgTG9uZ2l0dWRlIHRvIHdvcmxkLXNwYWNlXG4gICAgICogY29vcmRpbmF0ZXMgd2hpbGUgdGFraW5nIHRoZSBvcmlnaW4gYW5kIG9yaWVudGF0aW9uIGludG8gYWNjb3VudC5cbiAgICAgKi9cbiAgICBsYXRMbmdBbHRpdHVkZVRvVmVjdG9yMyhwb3NpdGlvbiwgdGFyZ2V0ID0gbmV3IFZlY3RvcjMoKSkge1xuICAgICAgICBsYXRMbmdUb1ZlY3RvcjNSZWxhdGl2ZSh0b0xhdExuZ0FsdGl0dWRlTGl0ZXJhbChwb3NpdGlvbiksIHRoaXMuYW5jaG9yLCB0YXJnZXQpO1xuICAgICAgICB0YXJnZXQuYXBwbHlRdWF0ZXJuaW9uKHRoaXMucm90YXRpb25JbnZlcnNlKTtcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9XG4gICAgLy8gTVZDT2JqZWN0IGludGVyZmFjZSBmb3J3YXJkZWQgdG8gdGhlIG92ZXJsYXlcbiAgICAvKipcbiAgICAgKiBCaW5kcyBhIFZpZXcgdG8gYSBNb2RlbC5cbiAgICAgKi9cbiAgICBiaW5kVG8oa2V5LCB0YXJnZXQsIHRhcmdldEtleSwgbm9Ob3RpZnkpIHtcbiAgICAgICAgdGhpcy5vdmVybGF5LmJpbmRUbyhrZXksIHRhcmdldCwgdGFyZ2V0S2V5LCBub05vdGlmeSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEdldHMgYSB2YWx1ZS5cbiAgICAgKi9cbiAgICBnZXQoa2V5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLm92ZXJsYXkuZ2V0KGtleSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE5vdGlmeSBhbGwgb2JzZXJ2ZXJzIG9mIGEgY2hhbmdlIG9uIHRoaXMgcHJvcGVydHkuIFRoaXMgbm90aWZpZXMgYm90aFxuICAgICAqIG9iamVjdHMgdGhhdCBhcmUgYm91bmQgdG8gdGhlIG9iamVjdCdzIHByb3BlcnR5IGFzIHdlbGwgYXMgdGhlIG9iamVjdFxuICAgICAqIHRoYXQgaXQgaXMgYm91bmQgdG8uXG4gICAgICovXG4gICAgbm90aWZ5KGtleSkge1xuICAgICAgICB0aGlzLm92ZXJsYXkubm90aWZ5KGtleSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNldHMgYSB2YWx1ZS5cbiAgICAgKi9cbiAgICBzZXQoa2V5LCB2YWx1ZSkge1xuICAgICAgICB0aGlzLm92ZXJsYXkuc2V0KGtleSwgdmFsdWUpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZXRzIGEgY29sbGVjdGlvbiBvZiBrZXktdmFsdWUgcGFpcnMuXG4gICAgICovXG4gICAgc2V0VmFsdWVzKHZhbHVlcykge1xuICAgICAgICB0aGlzLm92ZXJsYXkuc2V0VmFsdWVzKHZhbHVlcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgYSBiaW5kaW5nLiBVbmJpbmRpbmcgd2lsbCBzZXQgdGhlIHVuYm91bmQgcHJvcGVydHkgdG8gdGhlIGN1cnJlbnRcbiAgICAgKiB2YWx1ZS4gVGhlIG9iamVjdCB3aWxsIG5vdCBiZSBub3RpZmllZCwgYXMgdGhlIHZhbHVlIGhhcyBub3QgY2hhbmdlZC5cbiAgICAgKi9cbiAgICB1bmJpbmQoa2V5KSB7XG4gICAgICAgIHRoaXMub3ZlcmxheS51bmJpbmQoa2V5KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBhbGwgYmluZGluZ3MuXG4gICAgICovXG4gICAgdW5iaW5kQWxsKCkge1xuICAgICAgICB0aGlzLm92ZXJsYXkudW5iaW5kQWxsKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgbGlnaHRzIChkaXJlY3Rpb25hbCBhbmQgaGVtaXNwaGVyZSBsaWdodCkgdG8gaWxsdW1pbmF0ZSB0aGUgbW9kZWxcbiAgICAgKiAocm91Z2hseSBhcHByb3hpbWF0ZXMgdGhlIGxpZ2h0aW5nIG9mIGJ1aWxkaW5ncyBpbiBtYXBzKVxuICAgICAqL1xuICAgIGluaXRTY2VuZUxpZ2h0cygpIHtcbiAgICAgICAgY29uc3QgaGVtaUxpZ2h0ID0gbmV3IEhlbWlzcGhlcmVMaWdodCgweGZmZmZmZiwgMHg0NDQ0NDQsIDEpO1xuICAgICAgICBoZW1pTGlnaHQucG9zaXRpb24uc2V0KDAsIC0wLjIsIDEpLm5vcm1hbGl6ZSgpO1xuICAgICAgICBjb25zdCBkaXJMaWdodCA9IG5ldyBEaXJlY3Rpb25hbExpZ2h0KDB4ZmZmZmZmKTtcbiAgICAgICAgZGlyTGlnaHQucG9zaXRpb24uc2V0KDAsIDEwLCAxMDApO1xuICAgICAgICB0aGlzLnNjZW5lLmFkZChoZW1pTGlnaHQsIGRpckxpZ2h0KTtcbiAgICB9XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD10aHJlZS5qcy5tYXAiLCIvKipcbiAqIENvcHlyaWdodCAyMDIxIEdvb2dsZSBMTENcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5pbXBvcnQgeyBMT0FERVJfT1BUSU9OUywgTUFQX0lEIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgeyBUaHJlZUpTT3ZlcmxheVZpZXcsIFdPUkxEX1NJWkUgfSBmcm9tIFwiLi4vc3JjXCI7XG5pbXBvcnQgeyBMb2FkZXIgfSBmcm9tIFwiQGdvb2dsZW1hcHMvanMtYXBpLWxvYWRlclwiO1xuaW1wb3J0IHsgQXhlc0hlbHBlciB9IGZyb20gXCJ0aHJlZVwiO1xuY29uc3QgbWFwT3B0aW9ucyA9IHtcbiAgICBjZW50ZXI6IHtcbiAgICAgICAgbGF0OiA0NSxcbiAgICAgICAgbG5nOiAwLFxuICAgIH0sXG4gICAgbWFwSWQ6IE1BUF9JRCxcbiAgICB6b29tOiA1LFxuICAgIGhlYWRpbmc6IC00NSxcbiAgICB0aWx0OiA0NSxcbn07XG5uZXcgTG9hZGVyKExPQURFUl9PUFRJT05TKS5sb2FkKCkudGhlbigoKSA9PiB7XG4gICAgY29uc3QgbWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1hcFwiKSwgbWFwT3B0aW9ucyk7XG4gICAgY29uc3Qgb3ZlcmxheSA9IG5ldyBUaHJlZUpTT3ZlcmxheVZpZXcoe1xuICAgICAgICBhbmNob3I6IHsgLi4ubWFwT3B0aW9ucy5jZW50ZXIsIGFsdGl0dWRlOiAwIH0sXG4gICAgICAgIG1hcCxcbiAgICB9KTtcbiAgICBvdmVybGF5LnNjZW5lLmFkZChuZXcgQXhlc0hlbHBlcihXT1JMRF9TSVpFKSk7XG59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
