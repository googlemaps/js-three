import { V as Vector3, M as MathUtils, Q as Quaternion, a as Matrix4, R as Raycaster, S as Scene, P as PerspectiveCamera, E as Euler, W as WebGLRenderer, b as PCFSoftShadowMap, c as REVISION, H as HemisphereLight, D as DirectionalLight, L as Loader, G as GridHelper, A as AxesHelper, d as Mesh, C as CylinderGeometry, e as MeshMatcapMaterial, f as Vector2 } from './vendor-DnAe2kDy.js';

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
// the corners of the field in the Levi’s Stadium in Santa Clara
const coordinates = [
    { lng: -121.9702904, lat: 37.4034362 },
    { lng: -121.9698018, lat: 37.4027095 },
    { lng: -121.9693109, lat: 37.402918 },
    { lng: -121.969804, lat: 37.4036465 },
];
const center = { lng: -121.9698032, lat: 37.4031777, altitude: 0 };
const DEFAULT_COLOR = 0xffffff;
const HIGHLIGHT_COLOR = 0xff0000;
const mapOptions = {
    center,
    mapId: "7057886e21226ff7",
    zoom: 18,
    tilt: 67.5,
    disableDefaultUI: true,
    backgroundColor: "transparent",
    gestureHandling: "greedy",
};
new Loader(LOADER_OPTIONS).load().then(() => {
    // create the map and overlay
    const map = new google.maps.Map(document.getElementById("map"), mapOptions);
    const overlay = new ThreeJSOverlayView({ map, anchor: center, upAxis: "Y" });
    const mapDiv = map.getDiv();
    const mousePosition = new Vector2();
    map.addListener("mousemove", (ev) => {
        const domEvent = ev.domEvent;
        const { left, top, width, height } = mapDiv.getBoundingClientRect();
        const x = domEvent.clientX - left;
        const y = domEvent.clientY - top;
        mousePosition.x = 2 * (x / width) - 1;
        mousePosition.y = 1 - 2 * (y / height);
        // since the actual raycasting is performed when the next frame is
        // rendered, we have to make sure that it will be called for the next frame.
        overlay.requestRedraw();
    });
    // grid- and axes helpers to help with the orientation
    const grid = new GridHelper(1);
    grid.rotation.y = MathUtils.degToRad(28.1);
    grid.scale.set(48.8, 0, 91.44);
    overlay.scene.add(grid);
    overlay.scene.add(new AxesHelper(20));
    const meshes = coordinates.map((p) => {
        const mesh = new Mesh(new CylinderGeometry(2, 1, 20, 24, 1), new MeshMatcapMaterial());
        mesh.geometry.translate(0, mesh.geometry.parameters.height / 2, 0);
        overlay.latLngAltitudeToVector3(p, mesh.position);
        overlay.scene.add(mesh);
        return mesh;
    });
    let highlightedObject = null;
    overlay.onBeforeDraw = () => {
        const intersections = overlay.raycast(mousePosition, meshes, {
            recursive: false,
        });
        if (highlightedObject) {
            // when there's a previously highlighted object, reset the highlighting
            highlightedObject.material.color.setHex(DEFAULT_COLOR);
        }
        if (intersections.length === 0) {
            // reset default cursor when no object is under the cursor
            map.setOptions({ draggableCursor: null });
            highlightedObject = null;
            return;
        }
        // change the color of the object and update the map-cursor to indicate
        // the object is clickable.
        highlightedObject = intersections[0].object;
        highlightedObject.material.color.setHex(HIGHLIGHT_COLOR);
        map.setOptions({ draggableCursor: "pointer" });
    };
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmF5Y2FzdGluZy5qcyIsInNvdXJjZXMiOlsiLi4vLi4vZXhhbXBsZXMvY29uZmlnLnRzIiwiLi4vLi4vc3JjL3V0aWwudHMiLCIuLi8uLi9zcmMvdGhyZWUudHMiLCIuLi8uLi9leGFtcGxlcy9yYXljYXN0aW5nLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IDIwMjEgR29vZ2xlIExMQ1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHsgTG9hZGVyT3B0aW9ucyB9IGZyb20gXCJAZ29vZ2xlbWFwcy9qcy1hcGktbG9hZGVyXCI7XG5cbmV4cG9ydCBjb25zdCBNQVBfSUQgPSBcIjdiOWE4OTdhY2QwYTYzYTRcIjtcblxuZXhwb3J0IGNvbnN0IExPQURFUl9PUFRJT05TOiBMb2FkZXJPcHRpb25zID0ge1xuICBhcGlLZXk6IFwiQUl6YVN5RDh4aWFWUFdCMDJPZVFrSk9lbkxpSnpkZVVIemxodTAwXCIsXG4gIHZlcnNpb246IFwiYmV0YVwiLFxuICBsaWJyYXJpZXM6IFtdLFxufTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IDIwMjEgR29vZ2xlIExMQy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7IE1hdGhVdGlscywgVmVjdG9yMyB9IGZyb20gXCJ0aHJlZVwiO1xuXG5leHBvcnQgdHlwZSBMYXRMbmdUeXBlcyA9XG4gIHwgZ29vZ2xlLm1hcHMuTGF0TG5nTGl0ZXJhbFxuICB8IGdvb2dsZS5tYXBzLkxhdExuZ1xuICB8IGdvb2dsZS5tYXBzLkxhdExuZ0FsdGl0dWRlTGl0ZXJhbFxuICB8IGdvb2dsZS5tYXBzLkxhdExuZ0FsdGl0dWRlO1xuXG4vLyBzaG9ydGhhbmRzIGZvciBtYXRoLWZ1bmN0aW9ucywgbWFrZXMgZXF1YXRpb25zIG1vcmUgcmVhZGFibGVcbmNvbnN0IHsgYXRhbiwgY29zLCBleHAsIGxvZywgdGFuLCBQSSB9ID0gTWF0aDtcbmNvbnN0IHsgZGVnVG9SYWQsIHJhZFRvRGVnIH0gPSBNYXRoVXRpbHM7XG5cbmV4cG9ydCBjb25zdCBFQVJUSF9SQURJVVMgPSA2MzcxMDEwLjA7XG5leHBvcnQgY29uc3QgV09STERfU0laRSA9IE1hdGguUEkgKiBFQVJUSF9SQURJVVM7XG5cbi8qKlxuICogQ29udmVydHMgYW55IG9mIHRoZSBzdXBwb3J0ZWQgcG9zaXRpb24gZm9ybWF0cyBpbnRvIHRoZVxuICogZ29vZ2xlLm1hcHMuTGF0TG5nQWx0aXR1ZGVMaXRlcmFsIGZvcm1hdCB1c2VkIGZvciB0aGUgY2FsY3VsYXRpb25zLlxuICogQHBhcmFtIHBvaW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b0xhdExuZ0FsdGl0dWRlTGl0ZXJhbChcbiAgcG9pbnQ6IExhdExuZ1R5cGVzXG4pOiBnb29nbGUubWFwcy5MYXRMbmdBbHRpdHVkZUxpdGVyYWwge1xuICBpZiAoXG4gICAgd2luZG93Lmdvb2dsZSAmJlxuICAgIGdvb2dsZS5tYXBzICYmXG4gICAgKHBvaW50IGluc3RhbmNlb2YgZ29vZ2xlLm1hcHMuTGF0TG5nIHx8XG4gICAgICBwb2ludCBpbnN0YW5jZW9mIGdvb2dsZS5tYXBzLkxhdExuZ0FsdGl0dWRlKVxuICApIHtcbiAgICByZXR1cm4geyBhbHRpdHVkZTogMCwgLi4ucG9pbnQudG9KU09OKCkgfTtcbiAgfVxuXG4gIHJldHVybiB7IGFsdGl0dWRlOiAwLCAuLi4ocG9pbnQgYXMgZ29vZ2xlLm1hcHMuTGF0TG5nTGl0ZXJhbCkgfTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBsYXRpdHVkZSBhbmQgbG9uZ2l0dWRlIHRvIHdvcmxkIHNwYWNlIGNvb3JkaW5hdGVzIHJlbGF0aXZlXG4gKiB0byBhIHJlZmVyZW5jZSBsb2NhdGlvbiB3aXRoIHkgdXAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsYXRMbmdUb1ZlY3RvcjNSZWxhdGl2ZShcbiAgcG9pbnQ6IGdvb2dsZS5tYXBzLkxhdExuZ0FsdGl0dWRlTGl0ZXJhbCxcbiAgcmVmZXJlbmNlOiBnb29nbGUubWFwcy5MYXRMbmdBbHRpdHVkZUxpdGVyYWwsXG4gIHRhcmdldCA9IG5ldyBWZWN0b3IzKClcbikge1xuICBjb25zdCBbcHgsIHB5XSA9IGxhdExuZ1RvWFkocG9pbnQpO1xuICBjb25zdCBbcngsIHJ5XSA9IGxhdExuZ1RvWFkocmVmZXJlbmNlKTtcblxuICB0YXJnZXQuc2V0KHB4IC0gcngsIHB5IC0gcnksIDApO1xuXG4gIC8vIGFwcGx5IHRoZSBzcGhlcmljYWwgbWVyY2F0b3Igc2NhbGUtZmFjdG9yIGZvciB0aGUgcmVmZXJlbmNlIGxhdGl0dWRlXG4gIHRhcmdldC5tdWx0aXBseVNjYWxhcihjb3MoZGVnVG9SYWQocmVmZXJlbmNlLmxhdCkpKTtcblxuICB0YXJnZXQueiA9IHBvaW50LmFsdGl0dWRlIC0gcmVmZXJlbmNlLmFsdGl0dWRlO1xuXG4gIHJldHVybiB0YXJnZXQ7XG59XG5cbi8qKlxuICogQ29udmVydHMgV0dTODQgbGF0aXR1ZGUgYW5kIGxvbmdpdHVkZSB0byAodW5jb3JyZWN0ZWQpIFdlYk1lcmNhdG9yIG1ldGVycy5cbiAqIChXR1M4NCAtLT4gV2ViTWVyY2F0b3IgKEVQU0c6Mzg1NykpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsYXRMbmdUb1hZKHBvc2l0aW9uOiBnb29nbGUubWFwcy5MYXRMbmdMaXRlcmFsKTogbnVtYmVyW10ge1xuICByZXR1cm4gW1xuICAgIEVBUlRIX1JBRElVUyAqIGRlZ1RvUmFkKHBvc2l0aW9uLmxuZyksXG4gICAgRUFSVEhfUkFESVVTICogbG9nKHRhbigwLjI1ICogUEkgKyAwLjUgKiBkZWdUb1JhZChwb3NpdGlvbi5sYXQpKSksXG4gIF07XG59XG5cbi8qKlxuICogQ29udmVydHMgV2ViTWVyY2F0b3IgbWV0ZXJzIHRvIFdHUzg0IGxhdGl0dWRlL2xvbmdpdHVkZS5cbiAqIChXZWJNZXJjYXRvciAoRVBTRzozODU3KSAtLT4gV0dTODQpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB4eVRvTGF0TG5nKHA6IG51bWJlcltdKTogZ29vZ2xlLm1hcHMuTGF0TG5nTGl0ZXJhbCB7XG4gIGNvbnN0IFt4LCB5XSA9IHA7XG5cbiAgcmV0dXJuIHtcbiAgICBsYXQ6IHJhZFRvRGVnKFBJICogMC41IC0gMi4wICogYXRhbihleHAoLXkgLyBFQVJUSF9SQURJVVMpKSksXG4gICAgbG5nOiByYWRUb0RlZyh4KSAvIEVBUlRIX1JBRElVUyxcbiAgfTtcbn1cbiIsIi8qKlxuICogQ29weXJpZ2h0IDIwMjEgR29vZ2xlIExMQ1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHtcbiAgRGlyZWN0aW9uYWxMaWdodCxcbiAgRXVsZXIsXG4gIEhlbWlzcGhlcmVMaWdodCxcbiAgSW50ZXJzZWN0aW9uLFxuICBNYXRoVXRpbHMsXG4gIE1hdHJpeDQsXG4gIE9iamVjdDNELFxuICBQQ0ZTb2Z0U2hhZG93TWFwLFxuICBQZXJzcGVjdGl2ZUNhbWVyYSxcbiAgUXVhdGVybmlvbixcbiAgUmF5Y2FzdGVyLFxuICBSYXljYXN0ZXJQYXJhbWV0ZXJzLFxuICBSRVZJU0lPTixcbiAgU2NlbmUsXG4gIFZlY3RvcjIsXG4gIFZlY3RvcjMsXG4gIFdlYkdMUmVuZGVyZXIsXG59IGZyb20gXCJ0aHJlZVwiO1xuaW1wb3J0IHsgbGF0TG5nVG9WZWN0b3IzUmVsYXRpdmUsIHRvTGF0TG5nQWx0aXR1ZGVMaXRlcmFsIH0gZnJvbSBcIi4vdXRpbFwiO1xuXG5pbXBvcnQgdHlwZSB7IExhdExuZ1R5cGVzIH0gZnJvbSBcIi4vdXRpbFwiO1xuXG4vLyBTaW5jZSByMTYyLCB0aGUgc1JHQkVuY29kaW5nIGNvbnN0YW50IGlzIG5vIGxvbmdlciBleHBvcnRlZCBmcm9tIHRocmVlLlxuLy8gVGhlIHZhbHVlIGlzIGtlcHQgaGVyZSB0byBrZWVwIGNvbXBhdGliaWxpdHkgd2l0aCBvbGRlciB0aHJlZS5qcyB2ZXJzaW9ucy5cbi8vIFRoaXMgd2lsbCBiZSByZW1vdmVkIHdpdGggdGhlIG5leHQgbWFqb3IgcmVsZWFzZS5cbmNvbnN0IHNSR0JFbmNvZGluZyA9IDMwMDE7XG5cbmNvbnN0IERFRkFVTFRfVVAgPSBuZXcgVmVjdG9yMygwLCAwLCAxKTtcblxuZXhwb3J0IGludGVyZmFjZSBSYXljYXN0T3B0aW9ucyB7XG4gIC8qKlxuICAgKiBTZXQgdG8gdHJ1ZSB0byBhbHNvIHRlc3QgY2hpbGRyZW4gb2YgdGhlIHNwZWNpZmllZCBvYmplY3RzIGZvclxuICAgKiBpbnRlcnNlY3Rpb25zLlxuICAgKlxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgcmVjdXJzaXZlPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBpbnZlcnNlLXByb2plY3Rpb24tbWF0cml4IGJlZm9yZSBjYXN0aW5nIHRoZSByYXkgKHNldCB0aGlzXG4gICAqIHRvIGZhbHNlIGlmIHlvdSBuZWVkIHRvIHJ1biBtdWx0aXBsZSByYXljYXN0cyBmb3IgdGhlIHNhbWUgZnJhbWUpLlxuICAgKlxuICAgKiBAZGVmYXVsdCB0cnVlXG4gICAqL1xuICB1cGRhdGVNYXRyaXg/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBBZGRpdGlvbmFsIHBhcmFtZXRlcnMgdG8gcGFzcyB0byB0aGUgdGhyZWUuanMgcmF5Y2FzdGVyLlxuICAgKlxuICAgKiBAc2VlIGh0dHBzOi8vdGhyZWVqcy5vcmcvZG9jcy8jYXBpL2VuL2NvcmUvUmF5Y2FzdGVyLnBhcmFtc1xuICAgKi9cbiAgcmF5Y2FzdGVyUGFyYW1ldGVycz86IFJheWNhc3RlclBhcmFtZXRlcnM7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGhyZWVKU092ZXJsYXlWaWV3T3B0aW9ucyB7XG4gIC8qKlxuICAgKiBUaGUgYW5jaG9yIGZvciB0aGUgc2NlbmUuXG4gICAqXG4gICAqIEBkZWZhdWx0IHtsYXQ6IDAsIGxuZzogMCwgYWx0aXR1ZGU6IDB9XG4gICAqL1xuICBhbmNob3I/OiBMYXRMbmdUeXBlcztcblxuICAvKipcbiAgICogVGhlIGF4aXMgcG9pbnRpbmcgdXAgaW4gdGhlIHNjZW5lLiBDYW4gYmUgc3BlY2lmaWVkIGFzIFwiWlwiLCBcIllcIiBvciBhXG4gICAqIFZlY3RvcjMsIGluIHdoaWNoIGNhc2UgdGhlIG5vcm1hbGl6ZWQgdmVjdG9yIHdpbGwgYmVjb21lIHRoZSB1cC1heGlzLlxuICAgKlxuICAgKiBAZGVmYXVsdCBcIlpcIlxuICAgKi9cbiAgdXBBeGlzPzogXCJaXCIgfCBcIllcIiB8IFZlY3RvcjM7XG5cbiAgLyoqXG4gICAqIFRoZSBtYXAgdGhlIG92ZXJsYXkgd2lsbCBiZSBhZGRlZCB0by5cbiAgICogQ2FuIGJlIHNldCBhdCBpbml0aWFsaXphdGlvbiBvciBieSBjYWxsaW5nIGBzZXRNYXAobWFwKWAuXG4gICAqL1xuICBtYXA/OiBnb29nbGUubWFwcy5NYXA7XG5cbiAgLyoqXG4gICAqIFRoZSBzY2VuZSBvYmplY3QgdG8gcmVuZGVyIGluIHRoZSBvdmVybGF5LiBJZiBubyBzY2VuZSBpcyBzcGVjaWZpZWQsIGFcbiAgICogbmV3IHNjZW5lIGlzIGNyZWF0ZWQgYW5kIGNhbiBiZSBhY2Nlc3NlZCB2aWEgYG92ZXJsYXkuc2NlbmVgLlxuICAgKi9cbiAgc2NlbmU/OiBTY2VuZTtcblxuICAvKipcbiAgICogVGhlIGFuaW1hdGlvbiBtb2RlIGNvbnRyb2xzIHdoZW4gdGhlIG92ZXJsYXkgd2lsbCByZWRyYXcsIGVpdGhlclxuICAgKiBjb250aW51b3VzbHkgKGBhbHdheXNgKSBvciBvbiBkZW1hbmQgKGBvbmRlbWFuZGApLiBXaGVuIHVzaW5nIHRoZVxuICAgKiBvbiBkZW1hbmQgbW9kZSwgdGhlIG92ZXJsYXkgd2lsbCByZS1yZW5kZXIgd2hlbmV2ZXIgdGhlIG1hcCByZW5kZXJzXG4gICAqIChjYW1lcmEgbW92ZW1lbnRzKSBvciB3aGVuIGByZXF1ZXN0UmVkcmF3KClgIGlzIGNhbGxlZC5cbiAgICpcbiAgICogVG8gYWNoaWV2ZSBhbmltYXRpb25zIGluIHRoaXMgbW9kZSwgeW91IGNhbiBlaXRoZXIgdXNlIGFuIG91dHNpZGVcbiAgICogYW5pbWF0aW9uLWxvb3AgdGhhdCBjYWxscyBgcmVxdWVzdFJlZHJhdygpYCBhcyBsb25nIGFzIG5lZWRlZCBvciBjYWxsXG4gICAqIGByZXF1ZXN0UmVkcmF3KClgIGZyb20gd2l0aGluIHRoZSBgb25CZWZvcmVSZW5kZXJgIGZ1bmN0aW9uIHRvXG4gICAqXG4gICAqIEBkZWZhdWx0IFwib25kZW1hbmRcIlxuICAgKi9cbiAgYW5pbWF0aW9uTW9kZT86IFwiYWx3YXlzXCIgfCBcIm9uZGVtYW5kXCI7XG5cbiAgLyoqXG4gICAqIEFkZCBkZWZhdWx0IGxpZ2h0aW5nIHRvIHRoZSBzY2VuZS5cbiAgICogQGRlZmF1bHQgdHJ1ZVxuICAgKi9cbiAgYWRkRGVmYXVsdExpZ2h0aW5nPzogYm9vbGVhbjtcbn1cblxuLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWVtcHR5LWZ1bmN0aW9uICovXG5cbi8qKlxuICogQWRkIGEgW3RocmVlLmpzXShodHRwczovL3RocmVlanMub3JnKSBzY2VuZSBhcyBhIFtHb29nbGUgTWFwcyBXZWJHTE92ZXJsYXlWaWV3XShodHRwOi8vZ29vLmdsZS9XZWJHTE92ZXJsYXlWaWV3LXJlZikuXG4gKi9cbmV4cG9ydCBjbGFzcyBUaHJlZUpTT3ZlcmxheVZpZXcgaW1wbGVtZW50cyBnb29nbGUubWFwcy5XZWJHTE92ZXJsYXlWaWV3IHtcbiAgLyoqIHtAaW5oZXJpdERvYyBUaHJlZUpTT3ZlcmxheVZpZXdPcHRpb25zLnNjZW5lfSAqL1xuICBwdWJsaWMgcmVhZG9ubHkgc2NlbmU6IFNjZW5lO1xuXG4gIC8qKiB7QGluaGVyaXREb2MgVGhyZWVKU092ZXJsYXlWaWV3T3B0aW9ucy5hbmltYXRpb25Nb2RlfSAqL1xuICBwdWJsaWMgYW5pbWF0aW9uTW9kZTogXCJhbHdheXNcIiB8IFwib25kZW1hbmRcIiA9IFwib25kZW1hbmRcIjtcblxuICAvKioge0Bpbmhlcml0RG9jIFRocmVlSlNPdmVybGF5Vmlld09wdGlvbnMuYW5jaG9yfSAqL1xuICBwcm90ZWN0ZWQgYW5jaG9yOiBnb29nbGUubWFwcy5MYXRMbmdBbHRpdHVkZUxpdGVyYWw7XG4gIHByb3RlY3RlZCByZWFkb25seSBjYW1lcmE6IFBlcnNwZWN0aXZlQ2FtZXJhO1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgcm90YXRpb25BcnJheTogRmxvYXQzMkFycmF5ID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgcHJvdGVjdGVkIHJlYWRvbmx5IHJvdGF0aW9uSW52ZXJzZTogUXVhdGVybmlvbiA9IG5ldyBRdWF0ZXJuaW9uKCk7XG4gIHByb3RlY3RlZCByZWFkb25seSBwcm9qZWN0aW9uTWF0cml4SW52ZXJzZSA9IG5ldyBNYXRyaXg0KCk7XG5cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IG92ZXJsYXk6IGdvb2dsZS5tYXBzLldlYkdMT3ZlcmxheVZpZXc7XG4gIHByb3RlY3RlZCByZW5kZXJlcjogV2ViR0xSZW5kZXJlcjtcbiAgcHJvdGVjdGVkIHJheWNhc3RlcjogUmF5Y2FzdGVyID0gbmV3IFJheWNhc3RlcigpO1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IFRocmVlSlNPdmVybGF5Vmlld09wdGlvbnMgPSB7fSkge1xuICAgIGNvbnN0IHtcbiAgICAgIGFuY2hvciA9IHsgbGF0OiAwLCBsbmc6IDAsIGFsdGl0dWRlOiAwIH0sXG4gICAgICB1cEF4aXMgPSBcIlpcIixcbiAgICAgIHNjZW5lLFxuICAgICAgbWFwLFxuICAgICAgYW5pbWF0aW9uTW9kZSA9IFwib25kZW1hbmRcIixcbiAgICAgIGFkZERlZmF1bHRMaWdodGluZyA9IHRydWUsXG4gICAgfSA9IG9wdGlvbnM7XG5cbiAgICB0aGlzLm92ZXJsYXkgPSBuZXcgZ29vZ2xlLm1hcHMuV2ViR0xPdmVybGF5VmlldygpO1xuICAgIHRoaXMucmVuZGVyZXIgPSBudWxsO1xuICAgIHRoaXMuY2FtZXJhID0gbnVsbDtcbiAgICB0aGlzLmFuaW1hdGlvbk1vZGUgPSBhbmltYXRpb25Nb2RlO1xuXG4gICAgdGhpcy5zZXRBbmNob3IoYW5jaG9yKTtcbiAgICB0aGlzLnNldFVwQXhpcyh1cEF4aXMpO1xuXG4gICAgdGhpcy5zY2VuZSA9IHNjZW5lID8/IG5ldyBTY2VuZSgpO1xuICAgIGlmIChhZGREZWZhdWx0TGlnaHRpbmcpIHRoaXMuaW5pdFNjZW5lTGlnaHRzKCk7XG5cbiAgICB0aGlzLm92ZXJsYXkub25BZGQgPSB0aGlzLm9uQWRkLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vdmVybGF5Lm9uUmVtb3ZlID0gdGhpcy5vblJlbW92ZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMub3ZlcmxheS5vbkNvbnRleHRMb3N0ID0gdGhpcy5vbkNvbnRleHRMb3N0LmJpbmQodGhpcyk7XG4gICAgdGhpcy5vdmVybGF5Lm9uQ29udGV4dFJlc3RvcmVkID0gdGhpcy5vbkNvbnRleHRSZXN0b3JlZC5iaW5kKHRoaXMpO1xuICAgIHRoaXMub3ZlcmxheS5vblN0YXRlVXBkYXRlID0gdGhpcy5vblN0YXRlVXBkYXRlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vdmVybGF5Lm9uRHJhdyA9IHRoaXMub25EcmF3LmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLmNhbWVyYSA9IG5ldyBQZXJzcGVjdGl2ZUNhbWVyYSgpO1xuXG4gICAgaWYgKG1hcCkge1xuICAgICAgdGhpcy5zZXRNYXAobWFwKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgYW5jaG9yLXBvaW50LlxuICAgKiBAcGFyYW0gYW5jaG9yXG4gICAqL1xuICBwdWJsaWMgc2V0QW5jaG9yKGFuY2hvcjogTGF0TG5nVHlwZXMpIHtcbiAgICB0aGlzLmFuY2hvciA9IHRvTGF0TG5nQWx0aXR1ZGVMaXRlcmFsKGFuY2hvcik7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgYXhpcyB0byB1c2UgYXMgXCJ1cFwiIGluIHRoZSBzY2VuZS5cbiAgICogQHBhcmFtIGF4aXNcbiAgICovXG4gIHB1YmxpYyBzZXRVcEF4aXMoYXhpczogXCJZXCIgfCBcIlpcIiB8IFZlY3RvcjMpOiB2b2lkIHtcbiAgICBjb25zdCB1cFZlY3RvciA9IG5ldyBWZWN0b3IzKDAsIDAsIDEpO1xuICAgIGlmICh0eXBlb2YgYXhpcyAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgdXBWZWN0b3IuY29weShheGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGF4aXMudG9Mb3dlckNhc2UoKSA9PT0gXCJ5XCIpIHtcbiAgICAgICAgdXBWZWN0b3Iuc2V0KDAsIDEsIDApO1xuICAgICAgfSBlbHNlIGlmIChheGlzLnRvTG93ZXJDYXNlKCkgIT09IFwielwiKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihgaW52YWxpZCB2YWx1ZSAnJHtheGlzfScgc3BlY2lmaWVkIGFzIHVwQXhpc2ApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHVwVmVjdG9yLm5vcm1hbGl6ZSgpO1xuXG4gICAgY29uc3QgcSA9IG5ldyBRdWF0ZXJuaW9uKCk7XG4gICAgcS5zZXRGcm9tVW5pdFZlY3RvcnModXBWZWN0b3IsIERFRkFVTFRfVVApO1xuXG4gICAgLy8gaW52ZXJzZSByb3RhdGlvbiBpcyBuZWVkZWQgaW4gbGF0TG5nQWx0aXR1ZGVUb1ZlY3RvcjMoKVxuICAgIHRoaXMucm90YXRpb25JbnZlcnNlLmNvcHkocSkuaW52ZXJ0KCk7XG5cbiAgICAvLyBjb3B5IHRvIHJvdGF0aW9uQXJyYXkgZm9yIHRyYW5zZm9ybWVyLmZyb21MYXRMbmdBbHRpdHVkZSgpXG4gICAgY29uc3QgZXVsZXIgPSBuZXcgRXVsZXIoKS5zZXRGcm9tUXVhdGVybmlvbihxLCBcIlhZWlwiKTtcbiAgICB0aGlzLnJvdGF0aW9uQXJyYXlbMF0gPSBNYXRoVXRpbHMucmFkVG9EZWcoZXVsZXIueCk7XG4gICAgdGhpcy5yb3RhdGlvbkFycmF5WzFdID0gTWF0aFV0aWxzLnJhZFRvRGVnKGV1bGVyLnkpO1xuICAgIHRoaXMucm90YXRpb25BcnJheVsyXSA9IE1hdGhVdGlscy5yYWRUb0RlZyhldWxlci56KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIHJheWNhc3RpbmcgZm9yIHRoZSBzcGVjaWZpZWQgc2NyZWVuLWNvb3JkaW5hdGVzIGFnYWluc3QgYWxsIG9iamVjdHNcbiAgICogaW4gdGhlIHNjZW5lLlxuICAgKlxuICAgKiBAcGFyYW0gcCBub3JtYWxpemVkIHNjcmVlbnNwYWNlIGNvb3JkaW5hdGVzIG9mIHRoZVxuICAgKiAgIG1vdXNlLWN1cnNvci4geC95IGFyZSBpbiByYW5nZSBbLTEsIDFdLCB5IGlzIHBvaW50aW5nIHVwLlxuICAgKiBAcGFyYW0gb3B0aW9ucyByYXljYXN0aW5nIG9wdGlvbnMuIEluIHRoaXMgY2FzZSB0aGUgYHJlY3Vyc2l2ZWAgb3B0aW9uXG4gICAqICAgaGFzIG5vIGVmZmVjdCBhcyBpdCBpcyBhbHdheXMgcmVjdXJzaXZlLlxuICAgKiBAcmV0dXJuIHRoZSBsaXN0IG9mIGludGVyc2VjdGlvbnNcbiAgICovXG4gIHB1YmxpYyByYXljYXN0KHA6IFZlY3RvcjIsIG9wdGlvbnM/OiBSYXljYXN0T3B0aW9ucyk6IEludGVyc2VjdGlvbltdO1xuXG4gIC8qKlxuICAgKiBSdW5zIHJheWNhc3RpbmcgZm9yIHRoZSBzcGVjaWZpZWQgc2NyZWVuLWNvb3JkaW5hdGVzIGFnYWluc3QgdGhlIHNwZWNpZmllZFxuICAgKiBsaXN0IG9mIG9iamVjdHMuXG4gICAqXG4gICAqIE5vdGUgZm9yIHR5cGVzY3JpcHQgdXNlcnM6IHRoZSByZXR1cm5lZCBJbnRlcnNlY3Rpb24gb2JqZWN0cyBjYW4gb25seSBiZVxuICAgKiBwcm9wZXJseSB0eXBlZCBmb3Igbm9uLXJlY3Vyc2l2ZSBsb29rdXBzICh0aGlzIGlzIGhhbmRsZWQgYnkgdGhlIGludGVybmFsXG4gICAqIHNpZ25hdHVyZSBiZWxvdykuXG4gICAqXG4gICAqIEBwYXJhbSBwIG5vcm1hbGl6ZWQgc2NyZWVuc3BhY2UgY29vcmRpbmF0ZXMgb2YgdGhlXG4gICAqICAgbW91c2UtY3Vyc29yLiB4L3kgYXJlIGluIHJhbmdlIFstMSwgMV0sIHkgaXMgcG9pbnRpbmcgdXAuXG4gICAqIEBwYXJhbSBvYmplY3RzIGxpc3Qgb2Ygb2JqZWN0cyB0byB0ZXN0XG4gICAqIEBwYXJhbSBvcHRpb25zIHJheWNhc3Rpbmcgb3B0aW9ucy5cbiAgICovXG4gIHB1YmxpYyByYXljYXN0KFxuICAgIHA6IFZlY3RvcjIsXG4gICAgb2JqZWN0czogT2JqZWN0M0RbXSxcbiAgICBvcHRpb25zPzogUmF5Y2FzdE9wdGlvbnMgJiB7IHJlY3Vyc2l2ZTogdHJ1ZSB9XG4gICk6IEludGVyc2VjdGlvbltdO1xuXG4gIC8vIGFkZGl0aW9uYWwgc2lnbmF0dXJlIHRvIGVuYWJsZSB0eXBpbmdzIGluIHJldHVybmVkIG9iamVjdHMgd2hlbiBwb3NzaWJsZVxuICBwdWJsaWMgcmF5Y2FzdDxUIGV4dGVuZHMgT2JqZWN0M0Q+KFxuICAgIHA6IFZlY3RvcjIsXG4gICAgb2JqZWN0czogVFtdLFxuICAgIG9wdGlvbnM/OlxuICAgICAgfCBPbWl0PFJheWNhc3RPcHRpb25zLCBcInJlY3Vyc2l2ZVwiPlxuICAgICAgfCAoUmF5Y2FzdE9wdGlvbnMgJiB7IHJlY3Vyc2l2ZTogZmFsc2UgfSlcbiAgKTogSW50ZXJzZWN0aW9uPFQ+W107XG5cbiAgLy8gaW1wbGVtZXRhdGlvblxuICBwdWJsaWMgcmF5Y2FzdChcbiAgICBwOiBWZWN0b3IyLFxuICAgIG9wdGlvbnNPck9iamVjdHM/OiBPYmplY3QzRFtdIHwgUmF5Y2FzdE9wdGlvbnMsXG4gICAgb3B0aW9uczogUmF5Y2FzdE9wdGlvbnMgPSB7fVxuICApOiBJbnRlcnNlY3Rpb25bXSB7XG4gICAgbGV0IG9iamVjdHM6IE9iamVjdDNEW107XG4gICAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9uc09yT2JqZWN0cykpIHtcbiAgICAgIG9iamVjdHMgPSBvcHRpb25zT3JPYmplY3RzIHx8IG51bGw7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9iamVjdHMgPSBbdGhpcy5zY2VuZV07XG4gICAgICBvcHRpb25zID0geyAuLi5vcHRpb25zT3JPYmplY3RzLCByZWN1cnNpdmU6IHRydWUgfTtcbiAgICB9XG5cbiAgICBjb25zdCB7XG4gICAgICB1cGRhdGVNYXRyaXggPSB0cnVlLFxuICAgICAgcmVjdXJzaXZlID0gZmFsc2UsXG4gICAgICByYXljYXN0ZXJQYXJhbWV0ZXJzLFxuICAgIH0gPSBvcHRpb25zO1xuXG4gICAgLy8gd2hlbiBgcmF5Y2FzdCgpYCBpcyBjYWxsZWQgZnJvbSB3aXRoaW4gdGhlIGBvbkJlZm9yZVJlbmRlcigpYCBjYWxsYmFjayxcbiAgICAvLyB0aGUgbXZwLW1hdHJpeCBmb3IgdGhpcyBmcmFtZSBoYXMgYWxyZWFkeSBiZWVuIGNvbXB1dGVkIGFuZCBzdG9yZWQgaW5cbiAgICAvLyBgdGhpcy5jYW1lcmEucHJvamVjdGlvbk1hdHJpeGAuXG4gICAgLy8gVGhlIG12cC1tYXRyaXggdHJhbnNmb3JtcyB3b3JsZC1zcGFjZSBtZXRlcnMgdG8gY2xpcC1zcGFjZVxuICAgIC8vIGNvb3JkaW5hdGVzLiBUaGUgaW52ZXJzZSBtYXRyaXggY3JlYXRlZCBoZXJlIGRvZXMgdGhlIGV4YWN0IG9wcG9zaXRlXG4gICAgLy8gYW5kIGNvbnZlcnRzIGNsaXAtc3BhY2UgY29vcmRpbmF0ZXMgdG8gd29ybGQtc3BhY2UuXG4gICAgaWYgKHVwZGF0ZU1hdHJpeCkge1xuICAgICAgdGhpcy5wcm9qZWN0aW9uTWF0cml4SW52ZXJzZS5jb3B5KHRoaXMuY2FtZXJhLnByb2plY3Rpb25NYXRyaXgpLmludmVydCgpO1xuICAgIH1cblxuICAgIC8vIGNyZWF0ZSB0d28gcG9pbnRzICh3aXRoIGRpZmZlcmVudCBkZXB0aCkgZnJvbSB0aGUgbW91c2UtcG9zaXRpb24gYW5kXG4gICAgLy8gY29udmVydCB0aGVtIGludG8gd29ybGQtc3BhY2UgY29vcmRpbmF0ZXMgdG8gc2V0IHVwIHRoZSByYXkuXG4gICAgdGhpcy5yYXljYXN0ZXIucmF5Lm9yaWdpblxuICAgICAgLnNldChwLngsIHAueSwgMClcbiAgICAgIC5hcHBseU1hdHJpeDQodGhpcy5wcm9qZWN0aW9uTWF0cml4SW52ZXJzZSk7XG5cbiAgICB0aGlzLnJheWNhc3Rlci5yYXkuZGlyZWN0aW9uXG4gICAgICAuc2V0KHAueCwgcC55LCAwLjUpXG4gICAgICAuYXBwbHlNYXRyaXg0KHRoaXMucHJvamVjdGlvbk1hdHJpeEludmVyc2UpXG4gICAgICAuc3ViKHRoaXMucmF5Y2FzdGVyLnJheS5vcmlnaW4pXG4gICAgICAubm9ybWFsaXplKCk7XG5cbiAgICAvLyBiYWNrIHVwIHRoZSByYXljYXN0ZXIgcGFyYW1ldGVyc1xuICAgIGNvbnN0IG9sZFJheWNhc3RlclBhcmFtcyA9IHRoaXMucmF5Y2FzdGVyLnBhcmFtcztcbiAgICBpZiAocmF5Y2FzdGVyUGFyYW1ldGVycykge1xuICAgICAgdGhpcy5yYXljYXN0ZXIucGFyYW1zID0gcmF5Y2FzdGVyUGFyYW1ldGVycztcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHRzID0gdGhpcy5yYXljYXN0ZXIuaW50ZXJzZWN0T2JqZWN0cyhvYmplY3RzLCByZWN1cnNpdmUpO1xuXG4gICAgLy8gcmVzZXQgcmF5Y2FzdGVyIHBhcmFtcyB0byB3aGF0ZXZlciB0aGV5IHdlcmUgYmVmb3JlXG4gICAgdGhpcy5yYXljYXN0ZXIucGFyYW1zID0gb2xkUmF5Y2FzdGVyUGFyYW1zO1xuXG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cblxuICAvKipcbiAgICogT3ZlcndyaXRlIHRoaXMgbWV0aG9kIHRvIGhhbmRsZSBhbnkgR0wgc3RhdGUgdXBkYXRlcyBvdXRzaWRlIHRoZVxuICAgKiByZW5kZXIgYW5pbWF0aW9uIGZyYW1lLlxuICAgKiBAcGFyYW0gb3B0aW9uc1xuICAgKi9cbiAgcHVibGljIG9uU3RhdGVVcGRhdGUob3B0aW9uczogZ29vZ2xlLm1hcHMuV2ViR0xTdGF0ZU9wdGlvbnMpOiB2b2lkO1xuICBwdWJsaWMgb25TdGF0ZVVwZGF0ZSgpOiB2b2lkIHt9XG5cbiAgLyoqXG4gICAqIE92ZXJ3cml0ZSB0aGlzIG1ldGhvZCB0byBmZXRjaCBvciBjcmVhdGUgaW50ZXJtZWRpYXRlIGRhdGEgc3RydWN0dXJlc1xuICAgKiBiZWZvcmUgdGhlIG92ZXJsYXkgaXMgZHJhd24gdGhhdCBkb27igJl0IHJlcXVpcmUgaW1tZWRpYXRlIGFjY2VzcyB0byB0aGVcbiAgICogV2ViR0wgcmVuZGVyaW5nIGNvbnRleHQuXG4gICAqL1xuICBwdWJsaWMgb25BZGQoKTogdm9pZCB7fVxuXG4gIC8qKlxuICAgKiBPdmVyd3JpdGUgdGhpcyBtZXRob2QgdG8gdXBkYXRlIHlvdXIgc2NlbmUganVzdCBiZWZvcmUgYSBuZXcgZnJhbWUgaXNcbiAgICogZHJhd24uXG4gICAqL1xuICBwdWJsaWMgb25CZWZvcmVEcmF3KCk6IHZvaWQge31cblxuICAvKipcbiAgICogVGhpcyBtZXRob2QgaXMgY2FsbGVkIHdoZW4gdGhlIG92ZXJsYXkgaXMgcmVtb3ZlZCBmcm9tIHRoZSBtYXAgd2l0aFxuICAgKiBgb3ZlcmxheS5zZXRNYXAobnVsbClgLCBhbmQgaXMgd2hlcmUgeW91IGNhbiByZW1vdmUgYWxsIGludGVybWVkaWF0ZVxuICAgKiBvYmplY3RzIGNyZWF0ZWQgaW4gb25BZGQuXG4gICAqL1xuICBwdWJsaWMgb25SZW1vdmUoKTogdm9pZCB7fVxuXG4gIC8qKlxuICAgKiBUcmlnZ2VycyB0aGUgbWFwIHRvIHVwZGF0ZSBHTCBzdGF0ZS5cbiAgICovXG4gIHB1YmxpYyByZXF1ZXN0U3RhdGVVcGRhdGUoKTogdm9pZCB7XG4gICAgdGhpcy5vdmVybGF5LnJlcXVlc3RTdGF0ZVVwZGF0ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyaWdnZXJzIHRoZSBtYXAgdG8gcmVkcmF3IGEgZnJhbWUuXG4gICAqL1xuICBwdWJsaWMgcmVxdWVzdFJlZHJhdygpOiB2b2lkIHtcbiAgICB0aGlzLm92ZXJsYXkucmVxdWVzdFJlZHJhdygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG1hcCB0aGUgb3ZlcmxheSBpcyBhZGRlZCB0by5cbiAgICovXG4gIHB1YmxpYyBnZXRNYXAoKTogZ29vZ2xlLm1hcHMuTWFwIHtcbiAgICByZXR1cm4gdGhpcy5vdmVybGF5LmdldE1hcCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdGhlIG92ZXJsYXkgdG8gdGhlIG1hcC5cbiAgICogQHBhcmFtIG1hcCBUaGUgbWFwIHRvIGFjY2VzcyB0aGUgZGl2LCBtb2RlbCBhbmQgdmlldyBzdGF0ZS5cbiAgICovXG4gIHB1YmxpYyBzZXRNYXAobWFwOiBnb29nbGUubWFwcy5NYXApOiB2b2lkIHtcbiAgICB0aGlzLm92ZXJsYXkuc2V0TWFwKG1hcCk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0aGUgZ2l2ZW4gbGlzdGVuZXIgZnVuY3Rpb24gdG8gdGhlIGdpdmVuIGV2ZW50IG5hbWUuIFJldHVybnMgYW5cbiAgICogaWRlbnRpZmllciBmb3IgdGhpcyBsaXN0ZW5lciB0aGF0IGNhbiBiZSB1c2VkIHdpdGhcbiAgICogPGNvZGU+Z29vZ2xlLm1hcHMuZXZlbnQucmVtb3ZlTGlzdGVuZXI8L2NvZGU+LlxuICAgKi9cbiAgcHVibGljIGFkZExpc3RlbmVyKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nLFxuICAgIGhhbmRsZXI6ICguLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWRcbiAgKTogZ29vZ2xlLm1hcHMuTWFwc0V2ZW50TGlzdGVuZXIge1xuICAgIHJldHVybiB0aGlzLm92ZXJsYXkuYWRkTGlzdGVuZXIoZXZlbnROYW1lLCBoYW5kbGVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIG1ldGhvZCBpcyBjYWxsZWQgb25jZSB0aGUgcmVuZGVyaW5nIGNvbnRleHQgaXMgYXZhaWxhYmxlLiBVc2UgaXQgdG9cbiAgICogaW5pdGlhbGl6ZSBvciBiaW5kIGFueSBXZWJHTCBzdGF0ZSBzdWNoIGFzIHNoYWRlcnMgb3IgYnVmZmVyIG9iamVjdHMuXG4gICAqIEBwYXJhbSBvcHRpb25zIHRoYXQgYWxsb3cgZGV2ZWxvcGVycyB0byByZXN0b3JlIHRoZSBHTCBjb250ZXh0LlxuICAgKi9cbiAgcHVibGljIG9uQ29udGV4dFJlc3RvcmVkKHsgZ2wgfTogZ29vZ2xlLm1hcHMuV2ViR0xTdGF0ZU9wdGlvbnMpIHtcbiAgICB0aGlzLnJlbmRlcmVyID0gbmV3IFdlYkdMUmVuZGVyZXIoe1xuICAgICAgY2FudmFzOiBnbC5jYW52YXMsXG4gICAgICBjb250ZXh0OiBnbCxcbiAgICAgIC4uLmdsLmdldENvbnRleHRBdHRyaWJ1dGVzKCksXG4gICAgfSk7XG4gICAgdGhpcy5yZW5kZXJlci5hdXRvQ2xlYXIgPSBmYWxzZTtcbiAgICB0aGlzLnJlbmRlcmVyLmF1dG9DbGVhckRlcHRoID0gZmFsc2U7XG4gICAgdGhpcy5yZW5kZXJlci5zaGFkb3dNYXAuZW5hYmxlZCA9IHRydWU7XG4gICAgdGhpcy5yZW5kZXJlci5zaGFkb3dNYXAudHlwZSA9IFBDRlNvZnRTaGFkb3dNYXA7XG5cbiAgICAvLyBTaW5jZSByMTUyLCBkZWZhdWx0IG91dHB1dENvbG9yU3BhY2UgaXMgU1JHQlxuICAgIC8vIERlcHJlY2F0ZWQgb3V0cHV0RW5jb2Rpbmcga2VwdCBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHlcbiAgICBpZiAoTnVtYmVyKFJFVklTSU9OKSA8IDE1Mikge1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICAgICh0aGlzLnJlbmRlcmVyIGFzIGFueSkub3V0cHV0RW5jb2RpbmcgPSBzUkdCRW5jb2Rpbmc7XG4gICAgfVxuXG4gICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0IH0gPSBnbC5jYW52YXM7XG4gICAgdGhpcy5yZW5kZXJlci5zZXRWaWV3cG9ydCgwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIG1ldGhvZCBpcyBjYWxsZWQgd2hlbiB0aGUgcmVuZGVyaW5nIGNvbnRleHQgaXMgbG9zdCBmb3IgYW55IHJlYXNvbixcbiAgICogYW5kIGlzIHdoZXJlIHlvdSBzaG91bGQgY2xlYW4gdXAgYW55IHByZS1leGlzdGluZyBHTCBzdGF0ZSwgc2luY2UgaXQgaXNcbiAgICogbm8gbG9uZ2VyIG5lZWRlZC5cbiAgICovXG4gIHB1YmxpYyBvbkNvbnRleHRMb3N0KCkge1xuICAgIGlmICghdGhpcy5yZW5kZXJlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMucmVuZGVyZXIuZGlzcG9zZSgpO1xuICAgIHRoaXMucmVuZGVyZXIgPSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEltcGxlbWVudCB0aGlzIG1ldGhvZCB0byBkcmF3IFdlYkdMIGNvbnRlbnQgZGlyZWN0bHkgb24gdGhlIG1hcC4gTm90ZVxuICAgKiB0aGF0IGlmIHRoZSBvdmVybGF5IG5lZWRzIGEgbmV3IGZyYW1lIGRyYXduIHRoZW4gY2FsbCB7QGxpbmtcbiAgICogVGhyZWVKU092ZXJsYXlWaWV3LnJlcXVlc3RSZWRyYXd9LlxuICAgKiBAcGFyYW0gb3B0aW9ucyB0aGF0IGFsbG93IGRldmVsb3BlcnMgdG8gcmVuZGVyIGNvbnRlbnQgdG8gYW4gYXNzb2NpYXRlZFxuICAgKiAgICAgR29vZ2xlIGJhc2VtYXAuXG4gICAqL1xuICBwdWJsaWMgb25EcmF3KHsgZ2wsIHRyYW5zZm9ybWVyIH06IGdvb2dsZS5tYXBzLldlYkdMRHJhd09wdGlvbnMpOiB2b2lkIHtcbiAgICB0aGlzLmNhbWVyYS5wcm9qZWN0aW9uTWF0cml4LmZyb21BcnJheShcbiAgICAgIHRyYW5zZm9ybWVyLmZyb21MYXRMbmdBbHRpdHVkZSh0aGlzLmFuY2hvciwgdGhpcy5yb3RhdGlvbkFycmF5KVxuICAgICk7XG5cbiAgICBnbC5kaXNhYmxlKGdsLlNDSVNTT1JfVEVTVCk7XG5cbiAgICB0aGlzLm9uQmVmb3JlRHJhdygpO1xuXG4gICAgdGhpcy5yZW5kZXJlci5yZW5kZXIodGhpcy5zY2VuZSwgdGhpcy5jYW1lcmEpO1xuICAgIHRoaXMucmVuZGVyZXIucmVzZXRTdGF0ZSgpO1xuXG4gICAgaWYgKHRoaXMuYW5pbWF0aW9uTW9kZSA9PT0gXCJhbHdheXNcIikgdGhpcy5yZXF1ZXN0UmVkcmF3KCk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydCBjb29yZGluYXRlcyBmcm9tIFdHUzg0IExhdGl0dWRlIExvbmdpdHVkZSB0byB3b3JsZC1zcGFjZVxuICAgKiBjb29yZGluYXRlcyB3aGlsZSB0YWtpbmcgdGhlIG9yaWdpbiBhbmQgb3JpZW50YXRpb24gaW50byBhY2NvdW50LlxuICAgKi9cbiAgcHVibGljIGxhdExuZ0FsdGl0dWRlVG9WZWN0b3IzKFxuICAgIHBvc2l0aW9uOiBMYXRMbmdUeXBlcyxcbiAgICB0YXJnZXQgPSBuZXcgVmVjdG9yMygpXG4gICkge1xuICAgIGxhdExuZ1RvVmVjdG9yM1JlbGF0aXZlKFxuICAgICAgdG9MYXRMbmdBbHRpdHVkZUxpdGVyYWwocG9zaXRpb24pLFxuICAgICAgdGhpcy5hbmNob3IsXG4gICAgICB0YXJnZXRcbiAgICApO1xuXG4gICAgdGFyZ2V0LmFwcGx5UXVhdGVybmlvbih0aGlzLnJvdGF0aW9uSW52ZXJzZSk7XG5cbiAgICByZXR1cm4gdGFyZ2V0O1xuICB9XG5cbiAgLy8gTVZDT2JqZWN0IGludGVyZmFjZSBmb3J3YXJkZWQgdG8gdGhlIG92ZXJsYXlcblxuICAvKipcbiAgICogQmluZHMgYSBWaWV3IHRvIGEgTW9kZWwuXG4gICAqL1xuICBwdWJsaWMgYmluZFRvKFxuICAgIGtleTogc3RyaW5nLFxuICAgIHRhcmdldDogZ29vZ2xlLm1hcHMuTVZDT2JqZWN0LFxuICAgIHRhcmdldEtleT86IHN0cmluZyxcbiAgICBub05vdGlmeT86IGJvb2xlYW5cbiAgKTogdm9pZCB7XG4gICAgdGhpcy5vdmVybGF5LmJpbmRUbyhrZXksIHRhcmdldCwgdGFyZ2V0S2V5LCBub05vdGlmeSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIHZhbHVlLlxuICAgKi9cbiAgcHVibGljIGdldChrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLm92ZXJsYXkuZ2V0KGtleSk7XG4gIH1cblxuICAvKipcbiAgICogTm90aWZ5IGFsbCBvYnNlcnZlcnMgb2YgYSBjaGFuZ2Ugb24gdGhpcyBwcm9wZXJ0eS4gVGhpcyBub3RpZmllcyBib3RoXG4gICAqIG9iamVjdHMgdGhhdCBhcmUgYm91bmQgdG8gdGhlIG9iamVjdCdzIHByb3BlcnR5IGFzIHdlbGwgYXMgdGhlIG9iamVjdFxuICAgKiB0aGF0IGl0IGlzIGJvdW5kIHRvLlxuICAgKi9cbiAgcHVibGljIG5vdGlmeShrZXk6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMub3ZlcmxheS5ub3RpZnkoa2V5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGEgdmFsdWUuXG4gICAqL1xuICBwdWJsaWMgc2V0KGtleTogc3RyaW5nLCB2YWx1ZTogdW5rbm93bik6IHZvaWQge1xuICAgIHRoaXMub3ZlcmxheS5zZXQoa2V5LCB2YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIGNvbGxlY3Rpb24gb2Yga2V5LXZhbHVlIHBhaXJzLlxuICAgKi9cbiAgcHVibGljIHNldFZhbHVlcyh2YWx1ZXM/OiBvYmplY3QpOiB2b2lkIHtcbiAgICB0aGlzLm92ZXJsYXkuc2V0VmFsdWVzKHZhbHVlcyk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhIGJpbmRpbmcuIFVuYmluZGluZyB3aWxsIHNldCB0aGUgdW5ib3VuZCBwcm9wZXJ0eSB0byB0aGUgY3VycmVudFxuICAgKiB2YWx1ZS4gVGhlIG9iamVjdCB3aWxsIG5vdCBiZSBub3RpZmllZCwgYXMgdGhlIHZhbHVlIGhhcyBub3QgY2hhbmdlZC5cbiAgICovXG4gIHB1YmxpYyB1bmJpbmQoa2V5OiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLm92ZXJsYXkudW5iaW5kKGtleSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhbGwgYmluZGluZ3MuXG4gICAqL1xuICBwdWJsaWMgdW5iaW5kQWxsKCk6IHZvaWQge1xuICAgIHRoaXMub3ZlcmxheS51bmJpbmRBbGwoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGxpZ2h0cyAoZGlyZWN0aW9uYWwgYW5kIGhlbWlzcGhlcmUgbGlnaHQpIHRvIGlsbHVtaW5hdGUgdGhlIG1vZGVsXG4gICAqIChyb3VnaGx5IGFwcHJveGltYXRlcyB0aGUgbGlnaHRpbmcgb2YgYnVpbGRpbmdzIGluIG1hcHMpXG4gICAqL1xuICBwcml2YXRlIGluaXRTY2VuZUxpZ2h0cygpIHtcbiAgICBjb25zdCBoZW1pTGlnaHQgPSBuZXcgSGVtaXNwaGVyZUxpZ2h0KDB4ZmZmZmZmLCAweDQ0NDQ0NCwgMSk7XG4gICAgaGVtaUxpZ2h0LnBvc2l0aW9uLnNldCgwLCAtMC4yLCAxKS5ub3JtYWxpemUoKTtcblxuICAgIGNvbnN0IGRpckxpZ2h0ID0gbmV3IERpcmVjdGlvbmFsTGlnaHQoMHhmZmZmZmYpO1xuICAgIGRpckxpZ2h0LnBvc2l0aW9uLnNldCgwLCAxMCwgMTAwKTtcblxuICAgIHRoaXMuc2NlbmUuYWRkKGhlbWlMaWdodCwgZGlyTGlnaHQpO1xuICB9XG59XG4iLCIvKipcbiAqIENvcHlyaWdodCAyMDIxIEdvb2dsZSBMTENcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7IExPQURFUl9PUFRJT05TIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgeyBUaHJlZUpTT3ZlcmxheVZpZXcgfSBmcm9tIFwiLi4vc3JjXCI7XG5cbmltcG9ydCB7IExvYWRlciB9IGZyb20gXCJAZ29vZ2xlbWFwcy9qcy1hcGktbG9hZGVyXCI7XG5pbXBvcnQge1xuICBBeGVzSGVscGVyLFxuICBDeWxpbmRlckdlb21ldHJ5LFxuICBHcmlkSGVscGVyLFxuICBNYXRoVXRpbHMsXG4gIE1lc2gsXG4gIE1lc2hNYXRjYXBNYXRlcmlhbCxcbiAgVmVjdG9yMixcbn0gZnJvbSBcInRocmVlXCI7XG5cbi8vIHRoZSBjb3JuZXJzIG9mIHRoZSBmaWVsZCBpbiB0aGUgTGV2aeKAmXMgU3RhZGl1bSBpbiBTYW50YSBDbGFyYVxuY29uc3QgY29vcmRpbmF0ZXMgPSBbXG4gIHsgbG5nOiAtMTIxLjk3MDI5MDQsIGxhdDogMzcuNDAzNDM2MiB9LFxuICB7IGxuZzogLTEyMS45Njk4MDE4LCBsYXQ6IDM3LjQwMjcwOTUgfSxcbiAgeyBsbmc6IC0xMjEuOTY5MzEwOSwgbGF0OiAzNy40MDI5MTggfSxcbiAgeyBsbmc6IC0xMjEuOTY5ODA0LCBsYXQ6IDM3LjQwMzY0NjUgfSxcbl07XG5jb25zdCBjZW50ZXIgPSB7IGxuZzogLTEyMS45Njk4MDMyLCBsYXQ6IDM3LjQwMzE3NzcsIGFsdGl0dWRlOiAwIH07XG5cbmNvbnN0IERFRkFVTFRfQ09MT1IgPSAweGZmZmZmZjtcbmNvbnN0IEhJR0hMSUdIVF9DT0xPUiA9IDB4ZmYwMDAwO1xuXG5jb25zdCBtYXBPcHRpb25zID0ge1xuICBjZW50ZXIsXG4gIG1hcElkOiBcIjcwNTc4ODZlMjEyMjZmZjdcIixcbiAgem9vbTogMTgsXG4gIHRpbHQ6IDY3LjUsXG4gIGRpc2FibGVEZWZhdWx0VUk6IHRydWUsXG4gIGJhY2tncm91bmRDb2xvcjogXCJ0cmFuc3BhcmVudFwiLFxuICBnZXN0dXJlSGFuZGxpbmc6IFwiZ3JlZWR5XCIsXG59O1xuXG5uZXcgTG9hZGVyKExPQURFUl9PUFRJT05TKS5sb2FkKCkudGhlbigoKSA9PiB7XG4gIC8vIGNyZWF0ZSB0aGUgbWFwIGFuZCBvdmVybGF5XG4gIGNvbnN0IG1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtYXBcIiksIG1hcE9wdGlvbnMpO1xuICBjb25zdCBvdmVybGF5ID0gbmV3IFRocmVlSlNPdmVybGF5Vmlldyh7IG1hcCwgYW5jaG9yOiBjZW50ZXIsIHVwQXhpczogXCJZXCIgfSk7XG5cbiAgY29uc3QgbWFwRGl2ID0gbWFwLmdldERpdigpO1xuICBjb25zdCBtb3VzZVBvc2l0aW9uID0gbmV3IFZlY3RvcjIoKTtcblxuICBtYXAuYWRkTGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgKGV2OiBnb29nbGUubWFwcy5NYXBNb3VzZUV2ZW50KSA9PiB7XG4gICAgY29uc3QgZG9tRXZlbnQgPSBldi5kb21FdmVudCBhcyBNb3VzZUV2ZW50O1xuICAgIGNvbnN0IHsgbGVmdCwgdG9wLCB3aWR0aCwgaGVpZ2h0IH0gPSBtYXBEaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICBjb25zdCB4ID0gZG9tRXZlbnQuY2xpZW50WCAtIGxlZnQ7XG4gICAgY29uc3QgeSA9IGRvbUV2ZW50LmNsaWVudFkgLSB0b3A7XG5cbiAgICBtb3VzZVBvc2l0aW9uLnggPSAyICogKHggLyB3aWR0aCkgLSAxO1xuICAgIG1vdXNlUG9zaXRpb24ueSA9IDEgLSAyICogKHkgLyBoZWlnaHQpO1xuXG4gICAgLy8gc2luY2UgdGhlIGFjdHVhbCByYXljYXN0aW5nIGlzIHBlcmZvcm1lZCB3aGVuIHRoZSBuZXh0IGZyYW1lIGlzXG4gICAgLy8gcmVuZGVyZWQsIHdlIGhhdmUgdG8gbWFrZSBzdXJlIHRoYXQgaXQgd2lsbCBiZSBjYWxsZWQgZm9yIHRoZSBuZXh0IGZyYW1lLlxuICAgIG92ZXJsYXkucmVxdWVzdFJlZHJhdygpO1xuICB9KTtcblxuICAvLyBncmlkLSBhbmQgYXhlcyBoZWxwZXJzIHRvIGhlbHAgd2l0aCB0aGUgb3JpZW50YXRpb25cbiAgY29uc3QgZ3JpZCA9IG5ldyBHcmlkSGVscGVyKDEpO1xuXG4gIGdyaWQucm90YXRpb24ueSA9IE1hdGhVdGlscy5kZWdUb1JhZCgyOC4xKTtcbiAgZ3JpZC5zY2FsZS5zZXQoNDguOCwgMCwgOTEuNDQpO1xuICBvdmVybGF5LnNjZW5lLmFkZChncmlkKTtcbiAgb3ZlcmxheS5zY2VuZS5hZGQobmV3IEF4ZXNIZWxwZXIoMjApKTtcblxuICBjb25zdCBtZXNoZXMgPSBjb29yZGluYXRlcy5tYXAoKHApID0+IHtcbiAgICBjb25zdCBtZXNoID0gbmV3IE1lc2goXG4gICAgICBuZXcgQ3lsaW5kZXJHZW9tZXRyeSgyLCAxLCAyMCwgMjQsIDEpLFxuICAgICAgbmV3IE1lc2hNYXRjYXBNYXRlcmlhbCgpXG4gICAgKTtcbiAgICBtZXNoLmdlb21ldHJ5LnRyYW5zbGF0ZSgwLCBtZXNoLmdlb21ldHJ5LnBhcmFtZXRlcnMuaGVpZ2h0IC8gMiwgMCk7XG4gICAgb3ZlcmxheS5sYXRMbmdBbHRpdHVkZVRvVmVjdG9yMyhwLCBtZXNoLnBvc2l0aW9uKTtcblxuICAgIG92ZXJsYXkuc2NlbmUuYWRkKG1lc2gpO1xuXG4gICAgcmV0dXJuIG1lc2g7XG4gIH0pO1xuXG4gIGxldCBoaWdobGlnaHRlZE9iamVjdDogKHR5cGVvZiBtZXNoZXMpW251bWJlcl0gfCBudWxsID0gbnVsbDtcblxuICBvdmVybGF5Lm9uQmVmb3JlRHJhdyA9ICgpID0+IHtcbiAgICBjb25zdCBpbnRlcnNlY3Rpb25zID0gb3ZlcmxheS5yYXljYXN0KG1vdXNlUG9zaXRpb24sIG1lc2hlcywge1xuICAgICAgcmVjdXJzaXZlOiBmYWxzZSxcbiAgICB9KTtcblxuICAgIGlmIChoaWdobGlnaHRlZE9iamVjdCkge1xuICAgICAgLy8gd2hlbiB0aGVyZSdzIGEgcHJldmlvdXNseSBoaWdobGlnaHRlZCBvYmplY3QsIHJlc2V0IHRoZSBoaWdobGlnaHRpbmdcbiAgICAgIGhpZ2hsaWdodGVkT2JqZWN0Lm1hdGVyaWFsLmNvbG9yLnNldEhleChERUZBVUxUX0NPTE9SKTtcbiAgICB9XG5cbiAgICBpZiAoaW50ZXJzZWN0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgIC8vIHJlc2V0IGRlZmF1bHQgY3Vyc29yIHdoZW4gbm8gb2JqZWN0IGlzIHVuZGVyIHRoZSBjdXJzb3JcbiAgICAgIG1hcC5zZXRPcHRpb25zKHsgZHJhZ2dhYmxlQ3Vyc29yOiBudWxsIH0pO1xuICAgICAgaGlnaGxpZ2h0ZWRPYmplY3QgPSBudWxsO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGNoYW5nZSB0aGUgY29sb3Igb2YgdGhlIG9iamVjdCBhbmQgdXBkYXRlIHRoZSBtYXAtY3Vyc29yIHRvIGluZGljYXRlXG4gICAgLy8gdGhlIG9iamVjdCBpcyBjbGlja2FibGUuXG4gICAgaGlnaGxpZ2h0ZWRPYmplY3QgPSBpbnRlcnNlY3Rpb25zWzBdLm9iamVjdDtcbiAgICBoaWdobGlnaHRlZE9iamVjdC5tYXRlcmlhbC5jb2xvci5zZXRIZXgoSElHSExJR0hUX0NPTE9SKTtcbiAgICBtYXAuc2V0T3B0aW9ucyh7IGRyYWdnYWJsZUN1cnNvcjogXCJwb2ludGVyXCIgfSk7XG4gIH07XG59KTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7Ozs7Ozs7OztBQWNHO0FBTUksTUFBTSxjQUFjLEdBQWtCO0FBQzNDLElBQUEsTUFBTSxFQUFFLHlDQUF5QztBQUNqRCxJQUFBLE9BQU8sRUFBRSxNQUFNO0FBQ2YsSUFBQSxTQUFTLEVBQUUsRUFBRTtDQUNkOztBQ3hCRDs7Ozs7Ozs7Ozs7Ozs7QUFjRztBQVVIO0FBQ0EsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDO0FBQzlDLE1BQU0sRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLEdBQUcsU0FBUyxDQUFDO0FBRWxDLE1BQU0sWUFBWSxHQUFHLFNBQVMsQ0FBQztBQUd0Qzs7OztBQUlHO0FBQ0csU0FBVSx1QkFBdUIsQ0FDckMsS0FBa0Is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
