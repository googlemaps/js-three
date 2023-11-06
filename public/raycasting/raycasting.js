import { V as Vector3, M as MathUtils, Q as Quaternion, a as Matrix4, R as Raycaster, S as Scene, P as PerspectiveCamera, E as Euler, W as WebGLRenderer, b as PCFSoftShadowMap, c as REVISION, s as sRGBEncoding, H as HemisphereLight, D as DirectionalLight, L as Loader, d as Vector2, G as GridHelper, A as AxesHelper, e as Mesh, C as CylinderGeometry, f as MeshMatcapMaterial } from './vendor-yBasRX1v.js';

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmF5Y2FzdGluZy5qcyIsInNvdXJjZXMiOlsiLi4vLi4vZXhhbXBsZXMvY29uZmlnLnRzIiwiLi4vLi4vc3JjL3V0aWwudHMiLCIuLi8uLi9zcmMvdGhyZWUudHMiLCIuLi8uLi9leGFtcGxlcy9yYXljYXN0aW5nLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IDIwMjEgR29vZ2xlIExMQ1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHsgTG9hZGVyT3B0aW9ucyB9IGZyb20gXCJAZ29vZ2xlbWFwcy9qcy1hcGktbG9hZGVyXCI7XG5cbmV4cG9ydCBjb25zdCBNQVBfSUQgPSBcIjdiOWE4OTdhY2QwYTYzYTRcIjtcblxuZXhwb3J0IGNvbnN0IExPQURFUl9PUFRJT05TOiBMb2FkZXJPcHRpb25zID0ge1xuICBhcGlLZXk6IFwiQUl6YVN5RDh4aWFWUFdCMDJPZVFrSk9lbkxpSnpkZVVIemxodTAwXCIsXG4gIHZlcnNpb246IFwiYmV0YVwiLFxuICBsaWJyYXJpZXM6IFtdLFxufTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IDIwMjEgR29vZ2xlIExMQy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7IE1hdGhVdGlscywgVmVjdG9yMyB9IGZyb20gXCJ0aHJlZVwiO1xuXG5leHBvcnQgdHlwZSBMYXRMbmdUeXBlcyA9XG4gIHwgZ29vZ2xlLm1hcHMuTGF0TG5nTGl0ZXJhbFxuICB8IGdvb2dsZS5tYXBzLkxhdExuZ1xuICB8IGdvb2dsZS5tYXBzLkxhdExuZ0FsdGl0dWRlTGl0ZXJhbFxuICB8IGdvb2dsZS5tYXBzLkxhdExuZ0FsdGl0dWRlO1xuXG4vLyBzaG9ydGhhbmRzIGZvciBtYXRoLWZ1bmN0aW9ucywgbWFrZXMgZXF1YXRpb25zIG1vcmUgcmVhZGFibGVcbmNvbnN0IHsgYXRhbiwgY29zLCBleHAsIGxvZywgdGFuLCBQSSB9ID0gTWF0aDtcbmNvbnN0IHsgZGVnVG9SYWQsIHJhZFRvRGVnIH0gPSBNYXRoVXRpbHM7XG5cbmV4cG9ydCBjb25zdCBFQVJUSF9SQURJVVMgPSA2MzcxMDEwLjA7XG5leHBvcnQgY29uc3QgV09STERfU0laRSA9IE1hdGguUEkgKiBFQVJUSF9SQURJVVM7XG5cbi8qKlxuICogQ29udmVydHMgYW55IG9mIHRoZSBzdXBwb3J0ZWQgcG9zaXRpb24gZm9ybWF0cyBpbnRvIHRoZVxuICogZ29vZ2xlLm1hcHMuTGF0TG5nQWx0aXR1ZGVMaXRlcmFsIGZvcm1hdCB1c2VkIGZvciB0aGUgY2FsY3VsYXRpb25zLlxuICogQHBhcmFtIHBvaW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b0xhdExuZ0FsdGl0dWRlTGl0ZXJhbChcbiAgcG9pbnQ6IExhdExuZ1R5cGVzXG4pOiBnb29nbGUubWFwcy5MYXRMbmdBbHRpdHVkZUxpdGVyYWwge1xuICBpZiAoXG4gICAgd2luZG93Lmdvb2dsZSAmJlxuICAgIGdvb2dsZS5tYXBzICYmXG4gICAgKHBvaW50IGluc3RhbmNlb2YgZ29vZ2xlLm1hcHMuTGF0TG5nIHx8XG4gICAgICBwb2ludCBpbnN0YW5jZW9mIGdvb2dsZS5tYXBzLkxhdExuZ0FsdGl0dWRlKVxuICApIHtcbiAgICByZXR1cm4geyBhbHRpdHVkZTogMCwgLi4ucG9pbnQudG9KU09OKCkgfTtcbiAgfVxuXG4gIHJldHVybiB7IGFsdGl0dWRlOiAwLCAuLi4ocG9pbnQgYXMgZ29vZ2xlLm1hcHMuTGF0TG5nTGl0ZXJhbCkgfTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBsYXRpdHVkZSBhbmQgbG9uZ2l0dWRlIHRvIHdvcmxkIHNwYWNlIGNvb3JkaW5hdGVzIHJlbGF0aXZlXG4gKiB0byBhIHJlZmVyZW5jZSBsb2NhdGlvbiB3aXRoIHkgdXAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsYXRMbmdUb1ZlY3RvcjNSZWxhdGl2ZShcbiAgcG9pbnQ6IGdvb2dsZS5tYXBzLkxhdExuZ0FsdGl0dWRlTGl0ZXJhbCxcbiAgcmVmZXJlbmNlOiBnb29nbGUubWFwcy5MYXRMbmdBbHRpdHVkZUxpdGVyYWwsXG4gIHRhcmdldCA9IG5ldyBWZWN0b3IzKClcbikge1xuICBjb25zdCBbcHgsIHB5XSA9IGxhdExuZ1RvWFkocG9pbnQpO1xuICBjb25zdCBbcngsIHJ5XSA9IGxhdExuZ1RvWFkocmVmZXJlbmNlKTtcblxuICB0YXJnZXQuc2V0KHB4IC0gcngsIHB5IC0gcnksIDApO1xuXG4gIC8vIGFwcGx5IHRoZSBzcGhlcmljYWwgbWVyY2F0b3Igc2NhbGUtZmFjdG9yIGZvciB0aGUgcmVmZXJlbmNlIGxhdGl0dWRlXG4gIHRhcmdldC5tdWx0aXBseVNjYWxhcihjb3MoZGVnVG9SYWQocmVmZXJlbmNlLmxhdCkpKTtcblxuICB0YXJnZXQueiA9IHBvaW50LmFsdGl0dWRlIC0gcmVmZXJlbmNlLmFsdGl0dWRlO1xuXG4gIHJldHVybiB0YXJnZXQ7XG59XG5cbi8qKlxuICogQ29udmVydHMgV0dTODQgbGF0aXR1ZGUgYW5kIGxvbmdpdHVkZSB0byAodW5jb3JyZWN0ZWQpIFdlYk1lcmNhdG9yIG1ldGVycy5cbiAqIChXR1M4NCAtLT4gV2ViTWVyY2F0b3IgKEVQU0c6Mzg1NykpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsYXRMbmdUb1hZKHBvc2l0aW9uOiBnb29nbGUubWFwcy5MYXRMbmdMaXRlcmFsKTogbnVtYmVyW10ge1xuICByZXR1cm4gW1xuICAgIEVBUlRIX1JBRElVUyAqIGRlZ1RvUmFkKHBvc2l0aW9uLmxuZyksXG4gICAgRUFSVEhfUkFESVVTICogbG9nKHRhbigwLjI1ICogUEkgKyAwLjUgKiBkZWdUb1JhZChwb3NpdGlvbi5sYXQpKSksXG4gIF07XG59XG5cbi8qKlxuICogQ29udmVydHMgV2ViTWVyY2F0b3IgbWV0ZXJzIHRvIFdHUzg0IGxhdGl0dWRlL2xvbmdpdHVkZS5cbiAqIChXZWJNZXJjYXRvciAoRVBTRzozODU3KSAtLT4gV0dTODQpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB4eVRvTGF0TG5nKHA6IG51bWJlcltdKTogZ29vZ2xlLm1hcHMuTGF0TG5nTGl0ZXJhbCB7XG4gIGNvbnN0IFt4LCB5XSA9IHA7XG5cbiAgcmV0dXJuIHtcbiAgICBsYXQ6IHJhZFRvRGVnKFBJICogMC41IC0gMi4wICogYXRhbihleHAoLXkgLyBFQVJUSF9SQURJVVMpKSksXG4gICAgbG5nOiByYWRUb0RlZyh4KSAvIEVBUlRIX1JBRElVUyxcbiAgfTtcbn1cbiIsIi8qKlxuICogQ29weXJpZ2h0IDIwMjEgR29vZ2xlIExMQ1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHtcbiAgRGlyZWN0aW9uYWxMaWdodCxcbiAgRXVsZXIsXG4gIEhlbWlzcGhlcmVMaWdodCxcbiAgSW50ZXJzZWN0aW9uLFxuICBNYXRoVXRpbHMsXG4gIE1hdHJpeDQsXG4gIE9iamVjdDNELFxuICBQQ0ZTb2Z0U2hhZG93TWFwLFxuICBQZXJzcGVjdGl2ZUNhbWVyYSxcbiAgUXVhdGVybmlvbixcbiAgUmF5Y2FzdGVyLFxuICBSYXljYXN0ZXJQYXJhbWV0ZXJzLFxuICBSRVZJU0lPTixcbiAgU2NlbmUsXG4gIHNSR0JFbmNvZGluZyxcbiAgVmVjdG9yMixcbiAgVmVjdG9yMyxcbiAgV2ViR0xSZW5kZXJlcixcbn0gZnJvbSBcInRocmVlXCI7XG5pbXBvcnQgeyBsYXRMbmdUb1ZlY3RvcjNSZWxhdGl2ZSwgdG9MYXRMbmdBbHRpdHVkZUxpdGVyYWwgfSBmcm9tIFwiLi91dGlsXCI7XG5cbmltcG9ydCB0eXBlIHsgTGF0TG5nVHlwZXMgfSBmcm9tIFwiLi91dGlsXCI7XG5cbmNvbnN0IERFRkFVTFRfVVAgPSBuZXcgVmVjdG9yMygwLCAwLCAxKTtcblxuZXhwb3J0IGludGVyZmFjZSBSYXljYXN0T3B0aW9ucyB7XG4gIC8qKlxuICAgKiBTZXQgdG8gdHJ1ZSB0byBhbHNvIHRlc3QgY2hpbGRyZW4gb2YgdGhlIHNwZWNpZmllZCBvYmplY3RzIGZvclxuICAgKiBpbnRlcnNlY3Rpb25zLlxuICAgKlxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgcmVjdXJzaXZlPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBpbnZlcnNlLXByb2plY3Rpb24tbWF0cml4IGJlZm9yZSBjYXN0aW5nIHRoZSByYXkgKHNldCB0aGlzXG4gICAqIHRvIGZhbHNlIGlmIHlvdSBuZWVkIHRvIHJ1biBtdWx0aXBsZSByYXljYXN0cyBmb3IgdGhlIHNhbWUgZnJhbWUpLlxuICAgKlxuICAgKiBAZGVmYXVsdCB0cnVlXG4gICAqL1xuICB1cGRhdGVNYXRyaXg/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBBZGRpdGlvbmFsIHBhcmFtZXRlcnMgdG8gcGFzcyB0byB0aGUgdGhyZWUuanMgcmF5Y2FzdGVyLlxuICAgKlxuICAgKiBAc2VlIGh0dHBzOi8vdGhyZWVqcy5vcmcvZG9jcy8jYXBpL2VuL2NvcmUvUmF5Y2FzdGVyLnBhcmFtc1xuICAgKi9cbiAgcmF5Y2FzdGVyUGFyYW1ldGVycz86IFJheWNhc3RlclBhcmFtZXRlcnM7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGhyZWVKU092ZXJsYXlWaWV3T3B0aW9ucyB7XG4gIC8qKlxuICAgKiBUaGUgYW5jaG9yIGZvciB0aGUgc2NlbmUuXG4gICAqXG4gICAqIEBkZWZhdWx0IHtsYXQ6IDAsIGxuZzogMCwgYWx0aXR1ZGU6IDB9XG4gICAqL1xuICBhbmNob3I/OiBMYXRMbmdUeXBlcztcblxuICAvKipcbiAgICogVGhlIGF4aXMgcG9pbnRpbmcgdXAgaW4gdGhlIHNjZW5lLiBDYW4gYmUgc3BlY2lmaWVkIGFzIFwiWlwiLCBcIllcIiBvciBhXG4gICAqIFZlY3RvcjMsIGluIHdoaWNoIGNhc2UgdGhlIG5vcm1hbGl6ZWQgdmVjdG9yIHdpbGwgYmVjb21lIHRoZSB1cC1heGlzLlxuICAgKlxuICAgKiBAZGVmYXVsdCBcIlpcIlxuICAgKi9cbiAgdXBBeGlzPzogXCJaXCIgfCBcIllcIiB8IFZlY3RvcjM7XG5cbiAgLyoqXG4gICAqIFRoZSBtYXAgdGhlIG92ZXJsYXkgd2lsbCBiZSBhZGRlZCB0by5cbiAgICogQ2FuIGJlIHNldCBhdCBpbml0aWFsaXphdGlvbiBvciBieSBjYWxsaW5nIGBzZXRNYXAobWFwKWAuXG4gICAqL1xuICBtYXA/OiBnb29nbGUubWFwcy5NYXA7XG5cbiAgLyoqXG4gICAqIFRoZSBzY2VuZSBvYmplY3QgdG8gcmVuZGVyIGluIHRoZSBvdmVybGF5LiBJZiBubyBzY2VuZSBpcyBzcGVjaWZpZWQsIGFcbiAgICogbmV3IHNjZW5lIGlzIGNyZWF0ZWQgYW5kIGNhbiBiZSBhY2Nlc3NlZCB2aWEgYG92ZXJsYXkuc2NlbmVgLlxuICAgKi9cbiAgc2NlbmU/OiBTY2VuZTtcblxuICAvKipcbiAgICogVGhlIGFuaW1hdGlvbiBtb2RlIGNvbnRyb2xzIHdoZW4gdGhlIG92ZXJsYXkgd2lsbCByZWRyYXcsIGVpdGhlclxuICAgKiBjb250aW51b3VzbHkgKGBhbHdheXNgKSBvciBvbiBkZW1hbmQgKGBvbmRlbWFuZGApLiBXaGVuIHVzaW5nIHRoZVxuICAgKiBvbiBkZW1hbmQgbW9kZSwgdGhlIG92ZXJsYXkgd2lsbCByZS1yZW5kZXIgd2hlbmV2ZXIgdGhlIG1hcCByZW5kZXJzXG4gICAqIChjYW1lcmEgbW92ZW1lbnRzKSBvciB3aGVuIGByZXF1ZXN0UmVkcmF3KClgIGlzIGNhbGxlZC5cbiAgICpcbiAgICogVG8gYWNoaWV2ZSBhbmltYXRpb25zIGluIHRoaXMgbW9kZSwgeW91IGNhbiBlaXRoZXIgdXNlIGFuIG91dHNpZGVcbiAgICogYW5pbWF0aW9uLWxvb3AgdGhhdCBjYWxscyBgcmVxdWVzdFJlZHJhdygpYCBhcyBsb25nIGFzIG5lZWRlZCBvciBjYWxsXG4gICAqIGByZXF1ZXN0UmVkcmF3KClgIGZyb20gd2l0aGluIHRoZSBgb25CZWZvcmVSZW5kZXJgIGZ1bmN0aW9uIHRvXG4gICAqXG4gICAqIEBkZWZhdWx0IFwib25kZW1hbmRcIlxuICAgKi9cbiAgYW5pbWF0aW9uTW9kZT86IFwiYWx3YXlzXCIgfCBcIm9uZGVtYW5kXCI7XG5cbiAgLyoqXG4gICAqIEFkZCBkZWZhdWx0IGxpZ2h0aW5nIHRvIHRoZSBzY2VuZS5cbiAgICogQGRlZmF1bHQgdHJ1ZVxuICAgKi9cbiAgYWRkRGVmYXVsdExpZ2h0aW5nPzogYm9vbGVhbjtcbn1cblxuLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWVtcHR5LWZ1bmN0aW9uICovXG5cbi8qKlxuICogQWRkIGEgW3RocmVlLmpzXShodHRwczovL3RocmVlanMub3JnKSBzY2VuZSBhcyBhIFtHb29nbGUgTWFwcyBXZWJHTE92ZXJsYXlWaWV3XShodHRwOi8vZ29vLmdsZS9XZWJHTE92ZXJsYXlWaWV3LXJlZikuXG4gKi9cbmV4cG9ydCBjbGFzcyBUaHJlZUpTT3ZlcmxheVZpZXcgaW1wbGVtZW50cyBnb29nbGUubWFwcy5XZWJHTE92ZXJsYXlWaWV3IHtcbiAgLyoqIHtAaW5oZXJpdERvYyBUaHJlZUpTT3ZlcmxheVZpZXdPcHRpb25zLnNjZW5lfSAqL1xuICBwdWJsaWMgcmVhZG9ubHkgc2NlbmU6IFNjZW5lO1xuXG4gIC8qKiB7QGluaGVyaXREb2MgVGhyZWVKU092ZXJsYXlWaWV3T3B0aW9ucy5hbmltYXRpb25Nb2RlfSAqL1xuICBwdWJsaWMgYW5pbWF0aW9uTW9kZTogXCJhbHdheXNcIiB8IFwib25kZW1hbmRcIiA9IFwib25kZW1hbmRcIjtcblxuICAvKioge0Bpbmhlcml0RG9jIFRocmVlSlNPdmVybGF5Vmlld09wdGlvbnMuYW5jaG9yfSAqL1xuICBwcm90ZWN0ZWQgYW5jaG9yOiBnb29nbGUubWFwcy5MYXRMbmdBbHRpdHVkZUxpdGVyYWw7XG4gIHByb3RlY3RlZCByZWFkb25seSBjYW1lcmE6IFBlcnNwZWN0aXZlQ2FtZXJhO1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgcm90YXRpb25BcnJheTogRmxvYXQzMkFycmF5ID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgcHJvdGVjdGVkIHJlYWRvbmx5IHJvdGF0aW9uSW52ZXJzZTogUXVhdGVybmlvbiA9IG5ldyBRdWF0ZXJuaW9uKCk7XG4gIHByb3RlY3RlZCByZWFkb25seSBwcm9qZWN0aW9uTWF0cml4SW52ZXJzZSA9IG5ldyBNYXRyaXg0KCk7XG5cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IG92ZXJsYXk6IGdvb2dsZS5tYXBzLldlYkdMT3ZlcmxheVZpZXc7XG4gIHByb3RlY3RlZCByZW5kZXJlcjogV2ViR0xSZW5kZXJlcjtcbiAgcHJvdGVjdGVkIHJheWNhc3RlcjogUmF5Y2FzdGVyID0gbmV3IFJheWNhc3RlcigpO1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IFRocmVlSlNPdmVybGF5Vmlld09wdGlvbnMgPSB7fSkge1xuICAgIGNvbnN0IHtcbiAgICAgIGFuY2hvciA9IHsgbGF0OiAwLCBsbmc6IDAsIGFsdGl0dWRlOiAwIH0sXG4gICAgICB1cEF4aXMgPSBcIlpcIixcbiAgICAgIHNjZW5lLFxuICAgICAgbWFwLFxuICAgICAgYW5pbWF0aW9uTW9kZSA9IFwib25kZW1hbmRcIixcbiAgICAgIGFkZERlZmF1bHRMaWdodGluZyA9IHRydWUsXG4gICAgfSA9IG9wdGlvbnM7XG5cbiAgICB0aGlzLm92ZXJsYXkgPSBuZXcgZ29vZ2xlLm1hcHMuV2ViR0xPdmVybGF5VmlldygpO1xuICAgIHRoaXMucmVuZGVyZXIgPSBudWxsO1xuICAgIHRoaXMuY2FtZXJhID0gbnVsbDtcbiAgICB0aGlzLmFuaW1hdGlvbk1vZGUgPSBhbmltYXRpb25Nb2RlO1xuXG4gICAgdGhpcy5zZXRBbmNob3IoYW5jaG9yKTtcbiAgICB0aGlzLnNldFVwQXhpcyh1cEF4aXMpO1xuXG4gICAgdGhpcy5zY2VuZSA9IHNjZW5lID8/IG5ldyBTY2VuZSgpO1xuICAgIGlmIChhZGREZWZhdWx0TGlnaHRpbmcpIHRoaXMuaW5pdFNjZW5lTGlnaHRzKCk7XG5cbiAgICB0aGlzLm92ZXJsYXkub25BZGQgPSB0aGlzLm9uQWRkLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vdmVybGF5Lm9uUmVtb3ZlID0gdGhpcy5vblJlbW92ZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMub3ZlcmxheS5vbkNvbnRleHRMb3N0ID0gdGhpcy5vbkNvbnRleHRMb3N0LmJpbmQodGhpcyk7XG4gICAgdGhpcy5vdmVybGF5Lm9uQ29udGV4dFJlc3RvcmVkID0gdGhpcy5vbkNvbnRleHRSZXN0b3JlZC5iaW5kKHRoaXMpO1xuICAgIHRoaXMub3ZlcmxheS5vblN0YXRlVXBkYXRlID0gdGhpcy5vblN0YXRlVXBkYXRlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vdmVybGF5Lm9uRHJhdyA9IHRoaXMub25EcmF3LmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLmNhbWVyYSA9IG5ldyBQZXJzcGVjdGl2ZUNhbWVyYSgpO1xuXG4gICAgaWYgKG1hcCkge1xuICAgICAgdGhpcy5zZXRNYXAobWFwKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgYW5jaG9yLXBvaW50LlxuICAgKiBAcGFyYW0gYW5jaG9yXG4gICAqL1xuICBwdWJsaWMgc2V0QW5jaG9yKGFuY2hvcjogTGF0TG5nVHlwZXMpIHtcbiAgICB0aGlzLmFuY2hvciA9IHRvTGF0TG5nQWx0aXR1ZGVMaXRlcmFsKGFuY2hvcik7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgYXhpcyB0byB1c2UgYXMgXCJ1cFwiIGluIHRoZSBzY2VuZS5cbiAgICogQHBhcmFtIGF4aXNcbiAgICovXG4gIHB1YmxpYyBzZXRVcEF4aXMoYXhpczogXCJZXCIgfCBcIlpcIiB8IFZlY3RvcjMpOiB2b2lkIHtcbiAgICBjb25zdCB1cFZlY3RvciA9IG5ldyBWZWN0b3IzKDAsIDAsIDEpO1xuICAgIGlmICh0eXBlb2YgYXhpcyAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgdXBWZWN0b3IuY29weShheGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGF4aXMudG9Mb3dlckNhc2UoKSA9PT0gXCJ5XCIpIHtcbiAgICAgICAgdXBWZWN0b3Iuc2V0KDAsIDEsIDApO1xuICAgICAgfSBlbHNlIGlmIChheGlzLnRvTG93ZXJDYXNlKCkgIT09IFwielwiKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihgaW52YWxpZCB2YWx1ZSAnJHtheGlzfScgc3BlY2lmaWVkIGFzIHVwQXhpc2ApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHVwVmVjdG9yLm5vcm1hbGl6ZSgpO1xuXG4gICAgY29uc3QgcSA9IG5ldyBRdWF0ZXJuaW9uKCk7XG4gICAgcS5zZXRGcm9tVW5pdFZlY3RvcnModXBWZWN0b3IsIERFRkFVTFRfVVApO1xuXG4gICAgLy8gaW52ZXJzZSByb3RhdGlvbiBpcyBuZWVkZWQgaW4gbGF0TG5nQWx0aXR1ZGVUb1ZlY3RvcjMoKVxuICAgIHRoaXMucm90YXRpb25JbnZlcnNlLmNvcHkocSkuaW52ZXJ0KCk7XG5cbiAgICAvLyBjb3B5IHRvIHJvdGF0aW9uQXJyYXkgZm9yIHRyYW5zZm9ybWVyLmZyb21MYXRMbmdBbHRpdHVkZSgpXG4gICAgY29uc3QgZXVsZXIgPSBuZXcgRXVsZXIoKS5zZXRGcm9tUXVhdGVybmlvbihxLCBcIlhZWlwiKTtcbiAgICB0aGlzLnJvdGF0aW9uQXJyYXlbMF0gPSBNYXRoVXRpbHMucmFkVG9EZWcoZXVsZXIueCk7XG4gICAgdGhpcy5yb3RhdGlvbkFycmF5WzFdID0gTWF0aFV0aWxzLnJhZFRvRGVnKGV1bGVyLnkpO1xuICAgIHRoaXMucm90YXRpb25BcnJheVsyXSA9IE1hdGhVdGlscy5yYWRUb0RlZyhldWxlci56KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIHJheWNhc3RpbmcgZm9yIHRoZSBzcGVjaWZpZWQgc2NyZWVuLWNvb3JkaW5hdGVzIGFnYWluc3QgYWxsIG9iamVjdHNcbiAgICogaW4gdGhlIHNjZW5lLlxuICAgKlxuICAgKiBAcGFyYW0gcCBub3JtYWxpemVkIHNjcmVlbnNwYWNlIGNvb3JkaW5hdGVzIG9mIHRoZVxuICAgKiAgIG1vdXNlLWN1cnNvci4geC95IGFyZSBpbiByYW5nZSBbLTEsIDFdLCB5IGlzIHBvaW50aW5nIHVwLlxuICAgKiBAcGFyYW0gb3B0aW9ucyByYXljYXN0aW5nIG9wdGlvbnMuIEluIHRoaXMgY2FzZSB0aGUgYHJlY3Vyc2l2ZWAgb3B0aW9uXG4gICAqICAgaGFzIG5vIGVmZmVjdCBhcyBpdCBpcyBhbHdheXMgcmVjdXJzaXZlLlxuICAgKiBAcmV0dXJuIHRoZSBsaXN0IG9mIGludGVyc2VjdGlvbnNcbiAgICovXG4gIHB1YmxpYyByYXljYXN0KHA6IFZlY3RvcjIsIG9wdGlvbnM/OiBSYXljYXN0T3B0aW9ucyk6IEludGVyc2VjdGlvbltdO1xuXG4gIC8qKlxuICAgKiBSdW5zIHJheWNhc3RpbmcgZm9yIHRoZSBzcGVjaWZpZWQgc2NyZWVuLWNvb3JkaW5hdGVzIGFnYWluc3QgdGhlIHNwZWNpZmllZFxuICAgKiBsaXN0IG9mIG9iamVjdHMuXG4gICAqXG4gICAqIE5vdGUgZm9yIHR5cGVzY3JpcHQgdXNlcnM6IHRoZSByZXR1cm5lZCBJbnRlcnNlY3Rpb24gb2JqZWN0cyBjYW4gb25seSBiZVxuICAgKiBwcm9wZXJseSB0eXBlZCBmb3Igbm9uLXJlY3Vyc2l2ZSBsb29rdXBzICh0aGlzIGlzIGhhbmRsZWQgYnkgdGhlIGludGVybmFsXG4gICAqIHNpZ25hdHVyZSBiZWxvdykuXG4gICAqXG4gICAqIEBwYXJhbSBwIG5vcm1hbGl6ZWQgc2NyZWVuc3BhY2UgY29vcmRpbmF0ZXMgb2YgdGhlXG4gICAqICAgbW91c2UtY3Vyc29yLiB4L3kgYXJlIGluIHJhbmdlIFstMSwgMV0sIHkgaXMgcG9pbnRpbmcgdXAuXG4gICAqIEBwYXJhbSBvYmplY3RzIGxpc3Qgb2Ygb2JqZWN0cyB0byB0ZXN0XG4gICAqIEBwYXJhbSBvcHRpb25zIHJheWNhc3Rpbmcgb3B0aW9ucy5cbiAgICovXG4gIHB1YmxpYyByYXljYXN0KFxuICAgIHA6IFZlY3RvcjIsXG4gICAgb2JqZWN0czogT2JqZWN0M0RbXSxcbiAgICBvcHRpb25zPzogUmF5Y2FzdE9wdGlvbnMgJiB7IHJlY3Vyc2l2ZTogdHJ1ZSB9XG4gICk6IEludGVyc2VjdGlvbltdO1xuXG4gIC8vIGFkZGl0aW9uYWwgc2lnbmF0dXJlIHRvIGVuYWJsZSB0eXBpbmdzIGluIHJldHVybmVkIG9iamVjdHMgd2hlbiBwb3NzaWJsZVxuICBwdWJsaWMgcmF5Y2FzdDxUIGV4dGVuZHMgT2JqZWN0M0Q+KFxuICAgIHA6IFZlY3RvcjIsXG4gICAgb2JqZWN0czogVFtdLFxuICAgIG9wdGlvbnM/OlxuICAgICAgfCBPbWl0PFJheWNhc3RPcHRpb25zLCBcInJlY3Vyc2l2ZVwiPlxuICAgICAgfCAoUmF5Y2FzdE9wdGlvbnMgJiB7IHJlY3Vyc2l2ZTogZmFsc2UgfSlcbiAgKTogSW50ZXJzZWN0aW9uPFQ+W107XG5cbiAgLy8gaW1wbGVtZXRhdGlvblxuICBwdWJsaWMgcmF5Y2FzdChcbiAgICBwOiBWZWN0b3IyLFxuICAgIG9wdGlvbnNPck9iamVjdHM/OiBPYmplY3QzRFtdIHwgUmF5Y2FzdE9wdGlvbnMsXG4gICAgb3B0aW9uczogUmF5Y2FzdE9wdGlvbnMgPSB7fVxuICApOiBJbnRlcnNlY3Rpb25bXSB7XG4gICAgbGV0IG9iamVjdHM6IE9iamVjdDNEW107XG4gICAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9uc09yT2JqZWN0cykpIHtcbiAgICAgIG9iamVjdHMgPSBvcHRpb25zT3JPYmplY3RzIHx8IG51bGw7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9iamVjdHMgPSBbdGhpcy5zY2VuZV07XG4gICAgICBvcHRpb25zID0geyAuLi5vcHRpb25zT3JPYmplY3RzLCByZWN1cnNpdmU6IHRydWUgfTtcbiAgICB9XG5cbiAgICBjb25zdCB7XG4gICAgICB1cGRhdGVNYXRyaXggPSB0cnVlLFxuICAgICAgcmVjdXJzaXZlID0gZmFsc2UsXG4gICAgICByYXljYXN0ZXJQYXJhbWV0ZXJzLFxuICAgIH0gPSBvcHRpb25zO1xuXG4gICAgLy8gd2hlbiBgcmF5Y2FzdCgpYCBpcyBjYWxsZWQgZnJvbSB3aXRoaW4gdGhlIGBvbkJlZm9yZVJlbmRlcigpYCBjYWxsYmFjayxcbiAgICAvLyB0aGUgbXZwLW1hdHJpeCBmb3IgdGhpcyBmcmFtZSBoYXMgYWxyZWFkeSBiZWVuIGNvbXB1dGVkIGFuZCBzdG9yZWQgaW5cbiAgICAvLyBgdGhpcy5jYW1lcmEucHJvamVjdGlvbk1hdHJpeGAuXG4gICAgLy8gVGhlIG12cC1tYXRyaXggdHJhbnNmb3JtcyB3b3JsZC1zcGFjZSBtZXRlcnMgdG8gY2xpcC1zcGFjZVxuICAgIC8vIGNvb3JkaW5hdGVzLiBUaGUgaW52ZXJzZSBtYXRyaXggY3JlYXRlZCBoZXJlIGRvZXMgdGhlIGV4YWN0IG9wcG9zaXRlXG4gICAgLy8gYW5kIGNvbnZlcnRzIGNsaXAtc3BhY2UgY29vcmRpbmF0ZXMgdG8gd29ybGQtc3BhY2UuXG4gICAgaWYgKHVwZGF0ZU1hdHJpeCkge1xuICAgICAgdGhpcy5wcm9qZWN0aW9uTWF0cml4SW52ZXJzZS5jb3B5KHRoaXMuY2FtZXJhLnByb2plY3Rpb25NYXRyaXgpLmludmVydCgpO1xuICAgIH1cblxuICAgIC8vIGNyZWF0ZSB0d28gcG9pbnRzICh3aXRoIGRpZmZlcmVudCBkZXB0aCkgZnJvbSB0aGUgbW91c2UtcG9zaXRpb24gYW5kXG4gICAgLy8gY29udmVydCB0aGVtIGludG8gd29ybGQtc3BhY2UgY29vcmRpbmF0ZXMgdG8gc2V0IHVwIHRoZSByYXkuXG4gICAgdGhpcy5yYXljYXN0ZXIucmF5Lm9yaWdpblxuICAgICAgLnNldChwLngsIHAueSwgMClcbiAgICAgIC5hcHBseU1hdHJpeDQodGhpcy5wcm9qZWN0aW9uTWF0cml4SW52ZXJzZSk7XG5cbiAgICB0aGlzLnJheWNhc3Rlci5yYXkuZGlyZWN0aW9uXG4gICAgICAuc2V0KHAueCwgcC55LCAwLjUpXG4gICAgICAuYXBwbHlNYXRyaXg0KHRoaXMucHJvamVjdGlvbk1hdHJpeEludmVyc2UpXG4gICAgICAuc3ViKHRoaXMucmF5Y2FzdGVyLnJheS5vcmlnaW4pXG4gICAgICAubm9ybWFsaXplKCk7XG5cbiAgICAvLyBiYWNrIHVwIHRoZSByYXljYXN0ZXIgcGFyYW1ldGVyc1xuICAgIGNvbnN0IG9sZFJheWNhc3RlclBhcmFtcyA9IHRoaXMucmF5Y2FzdGVyLnBhcmFtcztcbiAgICBpZiAocmF5Y2FzdGVyUGFyYW1ldGVycykge1xuICAgICAgdGhpcy5yYXljYXN0ZXIucGFyYW1zID0gcmF5Y2FzdGVyUGFyYW1ldGVycztcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHRzID0gdGhpcy5yYXljYXN0ZXIuaW50ZXJzZWN0T2JqZWN0cyhvYmplY3RzLCByZWN1cnNpdmUpO1xuXG4gICAgLy8gcmVzZXQgcmF5Y2FzdGVyIHBhcmFtcyB0byB3aGF0ZXZlciB0aGV5IHdlcmUgYmVmb3JlXG4gICAgdGhpcy5yYXljYXN0ZXIucGFyYW1zID0gb2xkUmF5Y2FzdGVyUGFyYW1zO1xuXG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cblxuICAvKipcbiAgICogT3ZlcndyaXRlIHRoaXMgbWV0aG9kIHRvIGhhbmRsZSBhbnkgR0wgc3RhdGUgdXBkYXRlcyBvdXRzaWRlIHRoZVxuICAgKiByZW5kZXIgYW5pbWF0aW9uIGZyYW1lLlxuICAgKiBAcGFyYW0gb3B0aW9uc1xuICAgKi9cbiAgcHVibGljIG9uU3RhdGVVcGRhdGUob3B0aW9uczogZ29vZ2xlLm1hcHMuV2ViR0xTdGF0ZU9wdGlvbnMpOiB2b2lkO1xuICBwdWJsaWMgb25TdGF0ZVVwZGF0ZSgpOiB2b2lkIHt9XG5cbiAgLyoqXG4gICAqIE92ZXJ3cml0ZSB0aGlzIG1ldGhvZCB0byBmZXRjaCBvciBjcmVhdGUgaW50ZXJtZWRpYXRlIGRhdGEgc3RydWN0dXJlc1xuICAgKiBiZWZvcmUgdGhlIG92ZXJsYXkgaXMgZHJhd24gdGhhdCBkb27igJl0IHJlcXVpcmUgaW1tZWRpYXRlIGFjY2VzcyB0byB0aGVcbiAgICogV2ViR0wgcmVuZGVyaW5nIGNvbnRleHQuXG4gICAqL1xuICBwdWJsaWMgb25BZGQoKTogdm9pZCB7fVxuXG4gIC8qKlxuICAgKiBPdmVyd3JpdGUgdGhpcyBtZXRob2QgdG8gdXBkYXRlIHlvdXIgc2NlbmUganVzdCBiZWZvcmUgYSBuZXcgZnJhbWUgaXNcbiAgICogZHJhd24uXG4gICAqL1xuICBwdWJsaWMgb25CZWZvcmVEcmF3KCk6IHZvaWQge31cblxuICAvKipcbiAgICogVGhpcyBtZXRob2QgaXMgY2FsbGVkIHdoZW4gdGhlIG92ZXJsYXkgaXMgcmVtb3ZlZCBmcm9tIHRoZSBtYXAgd2l0aFxuICAgKiBgb3ZlcmxheS5zZXRNYXAobnVsbClgLCBhbmQgaXMgd2hlcmUgeW91IGNhbiByZW1vdmUgYWxsIGludGVybWVkaWF0ZVxuICAgKiBvYmplY3RzIGNyZWF0ZWQgaW4gb25BZGQuXG4gICAqL1xuICBwdWJsaWMgb25SZW1vdmUoKTogdm9pZCB7fVxuXG4gIC8qKlxuICAgKiBUcmlnZ2VycyB0aGUgbWFwIHRvIHVwZGF0ZSBHTCBzdGF0ZS5cbiAgICovXG4gIHB1YmxpYyByZXF1ZXN0U3RhdGVVcGRhdGUoKTogdm9pZCB7XG4gICAgdGhpcy5vdmVybGF5LnJlcXVlc3RTdGF0ZVVwZGF0ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyaWdnZXJzIHRoZSBtYXAgdG8gcmVkcmF3IGEgZnJhbWUuXG4gICAqL1xuICBwdWJsaWMgcmVxdWVzdFJlZHJhdygpOiB2b2lkIHtcbiAgICB0aGlzLm92ZXJsYXkucmVxdWVzdFJlZHJhdygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG1hcCB0aGUgb3ZlcmxheSBpcyBhZGRlZCB0by5cbiAgICovXG4gIHB1YmxpYyBnZXRNYXAoKTogZ29vZ2xlLm1hcHMuTWFwIHtcbiAgICByZXR1cm4gdGhpcy5vdmVybGF5LmdldE1hcCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdGhlIG92ZXJsYXkgdG8gdGhlIG1hcC5cbiAgICogQHBhcmFtIG1hcCBUaGUgbWFwIHRvIGFjY2VzcyB0aGUgZGl2LCBtb2RlbCBhbmQgdmlldyBzdGF0ZS5cbiAgICovXG4gIHB1YmxpYyBzZXRNYXAobWFwOiBnb29nbGUubWFwcy5NYXApOiB2b2lkIHtcbiAgICB0aGlzLm92ZXJsYXkuc2V0TWFwKG1hcCk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0aGUgZ2l2ZW4gbGlzdGVuZXIgZnVuY3Rpb24gdG8gdGhlIGdpdmVuIGV2ZW50IG5hbWUuIFJldHVybnMgYW5cbiAgICogaWRlbnRpZmllciBmb3IgdGhpcyBsaXN0ZW5lciB0aGF0IGNhbiBiZSB1c2VkIHdpdGhcbiAgICogPGNvZGU+Z29vZ2xlLm1hcHMuZXZlbnQucmVtb3ZlTGlzdGVuZXI8L2NvZGU+LlxuICAgKi9cbiAgcHVibGljIGFkZExpc3RlbmVyKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nLFxuICAgIGhhbmRsZXI6ICguLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWRcbiAgKTogZ29vZ2xlLm1hcHMuTWFwc0V2ZW50TGlzdGVuZXIge1xuICAgIHJldHVybiB0aGlzLm92ZXJsYXkuYWRkTGlzdGVuZXIoZXZlbnROYW1lLCBoYW5kbGVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIG1ldGhvZCBpcyBjYWxsZWQgb25jZSB0aGUgcmVuZGVyaW5nIGNvbnRleHQgaXMgYXZhaWxhYmxlLiBVc2UgaXQgdG9cbiAgICogaW5pdGlhbGl6ZSBvciBiaW5kIGFueSBXZWJHTCBzdGF0ZSBzdWNoIGFzIHNoYWRlcnMgb3IgYnVmZmVyIG9iamVjdHMuXG4gICAqIEBwYXJhbSBvcHRpb25zIHRoYXQgYWxsb3cgZGV2ZWxvcGVycyB0byByZXN0b3JlIHRoZSBHTCBjb250ZXh0LlxuICAgKi9cbiAgcHVibGljIG9uQ29udGV4dFJlc3RvcmVkKHsgZ2wgfTogZ29vZ2xlLm1hcHMuV2ViR0xTdGF0ZU9wdGlvbnMpIHtcbiAgICB0aGlzLnJlbmRlcmVyID0gbmV3IFdlYkdMUmVuZGVyZXIoe1xuICAgICAgY2FudmFzOiBnbC5jYW52YXMsXG4gICAgICBjb250ZXh0OiBnbCxcbiAgICAgIC4uLmdsLmdldENvbnRleHRBdHRyaWJ1dGVzKCksXG4gICAgfSk7XG4gICAgdGhpcy5yZW5kZXJlci5hdXRvQ2xlYXIgPSBmYWxzZTtcbiAgICB0aGlzLnJlbmRlcmVyLmF1dG9DbGVhckRlcHRoID0gZmFsc2U7XG4gICAgdGhpcy5yZW5kZXJlci5zaGFkb3dNYXAuZW5hYmxlZCA9IHRydWU7XG4gICAgdGhpcy5yZW5kZXJlci5zaGFkb3dNYXAudHlwZSA9IFBDRlNvZnRTaGFkb3dNYXA7XG5cbiAgICAvLyBTaW5jZSByMTUyLCBkZWZhdWx0IG91dHB1dENvbG9yU3BhY2UgaXMgU1JHQlxuICAgIC8vIERlcHJlY2F0ZWQgb3V0cHV0RW5jb2Rpbmcga2VwdCBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHlcbiAgICBpZiAoTnVtYmVyKFJFVklTSU9OKSA8IDE1MikgdGhpcy5yZW5kZXJlci5vdXRwdXRFbmNvZGluZyA9IHNSR0JFbmNvZGluZztcblxuICAgIGNvbnN0IHsgd2lkdGgsIGhlaWdodCB9ID0gZ2wuY2FudmFzO1xuICAgIHRoaXMucmVuZGVyZXIuc2V0Vmlld3BvcnQoMCwgMCwgd2lkdGgsIGhlaWdodCk7XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBtZXRob2QgaXMgY2FsbGVkIHdoZW4gdGhlIHJlbmRlcmluZyBjb250ZXh0IGlzIGxvc3QgZm9yIGFueSByZWFzb24sXG4gICAqIGFuZCBpcyB3aGVyZSB5b3Ugc2hvdWxkIGNsZWFuIHVwIGFueSBwcmUtZXhpc3RpbmcgR0wgc3RhdGUsIHNpbmNlIGl0IGlzXG4gICAqIG5vIGxvbmdlciBuZWVkZWQuXG4gICAqL1xuICBwdWJsaWMgb25Db250ZXh0TG9zdCgpIHtcbiAgICBpZiAoIXRoaXMucmVuZGVyZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnJlbmRlcmVyLmRpc3Bvc2UoKTtcbiAgICB0aGlzLnJlbmRlcmVyID0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbXBsZW1lbnQgdGhpcyBtZXRob2QgdG8gZHJhdyBXZWJHTCBjb250ZW50IGRpcmVjdGx5IG9uIHRoZSBtYXAuIE5vdGVcbiAgICogdGhhdCBpZiB0aGUgb3ZlcmxheSBuZWVkcyBhIG5ldyBmcmFtZSBkcmF3biB0aGVuIGNhbGwge0BsaW5rXG4gICAqIFRocmVlSlNPdmVybGF5Vmlldy5yZXF1ZXN0UmVkcmF3fS5cbiAgICogQHBhcmFtIG9wdGlvbnMgdGhhdCBhbGxvdyBkZXZlbG9wZXJzIHRvIHJlbmRlciBjb250ZW50IHRvIGFuIGFzc29jaWF0ZWRcbiAgICogICAgIEdvb2dsZSBiYXNlbWFwLlxuICAgKi9cbiAgcHVibGljIG9uRHJhdyh7IGdsLCB0cmFuc2Zvcm1lciB9OiBnb29nbGUubWFwcy5XZWJHTERyYXdPcHRpb25zKTogdm9pZCB7XG4gICAgdGhpcy5jYW1lcmEucHJvamVjdGlvbk1hdHJpeC5mcm9tQXJyYXkoXG4gICAgICB0cmFuc2Zvcm1lci5mcm9tTGF0TG5nQWx0aXR1ZGUodGhpcy5hbmNob3IsIHRoaXMucm90YXRpb25BcnJheSlcbiAgICApO1xuXG4gICAgZ2wuZGlzYWJsZShnbC5TQ0lTU09SX1RFU1QpO1xuXG4gICAgdGhpcy5vbkJlZm9yZURyYXcoKTtcblxuICAgIHRoaXMucmVuZGVyZXIucmVuZGVyKHRoaXMuc2NlbmUsIHRoaXMuY2FtZXJhKTtcbiAgICB0aGlzLnJlbmRlcmVyLnJlc2V0U3RhdGUoKTtcblxuICAgIGlmICh0aGlzLmFuaW1hdGlvbk1vZGUgPT09IFwiYWx3YXlzXCIpIHRoaXMucmVxdWVzdFJlZHJhdygpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnQgY29vcmRpbmF0ZXMgZnJvbSBXR1M4NCBMYXRpdHVkZSBMb25naXR1ZGUgdG8gd29ybGQtc3BhY2VcbiAgICogY29vcmRpbmF0ZXMgd2hpbGUgdGFraW5nIHRoZSBvcmlnaW4gYW5kIG9yaWVudGF0aW9uIGludG8gYWNjb3VudC5cbiAgICovXG4gIHB1YmxpYyBsYXRMbmdBbHRpdHVkZVRvVmVjdG9yMyhcbiAgICBwb3NpdGlvbjogTGF0TG5nVHlwZXMsXG4gICAgdGFyZ2V0ID0gbmV3IFZlY3RvcjMoKVxuICApIHtcbiAgICBsYXRMbmdUb1ZlY3RvcjNSZWxhdGl2ZShcbiAgICAgIHRvTGF0TG5nQWx0aXR1ZGVMaXRlcmFsKHBvc2l0aW9uKSxcbiAgICAgIHRoaXMuYW5jaG9yLFxuICAgICAgdGFyZ2V0XG4gICAgKTtcblxuICAgIHRhcmdldC5hcHBseVF1YXRlcm5pb24odGhpcy5yb3RhdGlvbkludmVyc2UpO1xuXG4gICAgcmV0dXJuIHRhcmdldDtcbiAgfVxuXG4gIC8vIE1WQ09iamVjdCBpbnRlcmZhY2UgZm9yd2FyZGVkIHRvIHRoZSBvdmVybGF5XG5cbiAgLyoqXG4gICAqIEJpbmRzIGEgVmlldyB0byBhIE1vZGVsLlxuICAgKi9cbiAgcHVibGljIGJpbmRUbyhcbiAgICBrZXk6IHN0cmluZyxcbiAgICB0YXJnZXQ6IGdvb2dsZS5tYXBzLk1WQ09iamVjdCxcbiAgICB0YXJnZXRLZXk/OiBzdHJpbmcsXG4gICAgbm9Ob3RpZnk/OiBib29sZWFuXG4gICk6IHZvaWQge1xuICAgIHRoaXMub3ZlcmxheS5iaW5kVG8oa2V5LCB0YXJnZXQsIHRhcmdldEtleSwgbm9Ob3RpZnkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSB2YWx1ZS5cbiAgICovXG4gIHB1YmxpYyBnZXQoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5vdmVybGF5LmdldChrZXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIE5vdGlmeSBhbGwgb2JzZXJ2ZXJzIG9mIGEgY2hhbmdlIG9uIHRoaXMgcHJvcGVydHkuIFRoaXMgbm90aWZpZXMgYm90aFxuICAgKiBvYmplY3RzIHRoYXQgYXJlIGJvdW5kIHRvIHRoZSBvYmplY3QncyBwcm9wZXJ0eSBhcyB3ZWxsIGFzIHRoZSBvYmplY3RcbiAgICogdGhhdCBpdCBpcyBib3VuZCB0by5cbiAgICovXG4gIHB1YmxpYyBub3RpZnkoa2V5OiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLm92ZXJsYXkubm90aWZ5KGtleSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIHZhbHVlLlxuICAgKi9cbiAgcHVibGljIHNldChrZXk6IHN0cmluZywgdmFsdWU6IHVua25vd24pOiB2b2lkIHtcbiAgICB0aGlzLm92ZXJsYXkuc2V0KGtleSwgdmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYSBjb2xsZWN0aW9uIG9mIGtleS12YWx1ZSBwYWlycy5cbiAgICovXG4gIHB1YmxpYyBzZXRWYWx1ZXModmFsdWVzPzogb2JqZWN0KTogdm9pZCB7XG4gICAgdGhpcy5vdmVybGF5LnNldFZhbHVlcyh2YWx1ZXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYSBiaW5kaW5nLiBVbmJpbmRpbmcgd2lsbCBzZXQgdGhlIHVuYm91bmQgcHJvcGVydHkgdG8gdGhlIGN1cnJlbnRcbiAgICogdmFsdWUuIFRoZSBvYmplY3Qgd2lsbCBub3QgYmUgbm90aWZpZWQsIGFzIHRoZSB2YWx1ZSBoYXMgbm90IGNoYW5nZWQuXG4gICAqL1xuICBwdWJsaWMgdW5iaW5kKGtleTogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5vdmVybGF5LnVuYmluZChrZXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYWxsIGJpbmRpbmdzLlxuICAgKi9cbiAgcHVibGljIHVuYmluZEFsbCgpOiB2b2lkIHtcbiAgICB0aGlzLm92ZXJsYXkudW5iaW5kQWxsKCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBsaWdodHMgKGRpcmVjdGlvbmFsIGFuZCBoZW1pc3BoZXJlIGxpZ2h0KSB0byBpbGx1bWluYXRlIHRoZSBtb2RlbFxuICAgKiAocm91Z2hseSBhcHByb3hpbWF0ZXMgdGhlIGxpZ2h0aW5nIG9mIGJ1aWxkaW5ncyBpbiBtYXBzKVxuICAgKi9cbiAgcHJpdmF0ZSBpbml0U2NlbmVMaWdodHMoKSB7XG4gICAgY29uc3QgaGVtaUxpZ2h0ID0gbmV3IEhlbWlzcGhlcmVMaWdodCgweGZmZmZmZiwgMHg0NDQ0NDQsIDEpO1xuICAgIGhlbWlMaWdodC5wb3NpdGlvbi5zZXQoMCwgLTAuMiwgMSkubm9ybWFsaXplKCk7XG5cbiAgICBjb25zdCBkaXJMaWdodCA9IG5ldyBEaXJlY3Rpb25hbExpZ2h0KDB4ZmZmZmZmKTtcbiAgICBkaXJMaWdodC5wb3NpdGlvbi5zZXQoMCwgMTAsIDEwMCk7XG5cbiAgICB0aGlzLnNjZW5lLmFkZChoZW1pTGlnaHQsIGRpckxpZ2h0KTtcbiAgfVxufVxuIiwiLyoqXG4gKiBDb3B5cmlnaHQgMjAyMSBHb29nbGUgTExDXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgeyBMT0FERVJfT1BUSU9OUyB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IHsgVGhyZWVKU092ZXJsYXlWaWV3IH0gZnJvbSBcIi4uL3NyY1wiO1xuXG5pbXBvcnQgeyBMb2FkZXIgfSBmcm9tIFwiQGdvb2dsZW1hcHMvanMtYXBpLWxvYWRlclwiO1xuaW1wb3J0IHtcbiAgQXhlc0hlbHBlcixcbiAgQ3lsaW5kZXJHZW9tZXRyeSxcbiAgR3JpZEhlbHBlcixcbiAgTWF0aFV0aWxzLFxuICBNZXNoLFxuICBNZXNoTWF0Y2FwTWF0ZXJpYWwsXG4gIFZlY3RvcjIsXG59IGZyb20gXCJ0aHJlZVwiO1xuXG4vLyB0aGUgY29ybmVycyBvZiB0aGUgZmllbGQgaW4gdGhlIExldmnigJlzIFN0YWRpdW0gaW4gU2FudGEgQ2xhcmFcbmNvbnN0IGNvb3JkaW5hdGVzID0gW1xuICB7IGxuZzogLTEyMS45NzAyOTA0LCBsYXQ6IDM3LjQwMzQzNjIgfSxcbiAgeyBsbmc6IC0xMjEuOTY5ODAxOCwgbGF0OiAzNy40MDI3MDk1IH0sXG4gIHsgbG5nOiAtMTIxLjk2OTMxMDksIGxhdDogMzcuNDAyOTE4IH0sXG4gIHsgbG5nOiAtMTIxLjk2OTgwNCwgbGF0OiAzNy40MDM2NDY1IH0sXG5dO1xuY29uc3QgY2VudGVyID0geyBsbmc6IC0xMjEuOTY5ODAzMiwgbGF0OiAzNy40MDMxNzc3LCBhbHRpdHVkZTogMCB9O1xuXG5jb25zdCBERUZBVUxUX0NPTE9SID0gMHhmZmZmZmY7XG5jb25zdCBISUdITElHSFRfQ09MT1IgPSAweGZmMDAwMDtcblxuY29uc3QgbWFwT3B0aW9ucyA9IHtcbiAgY2VudGVyLFxuICBtYXBJZDogXCI3MDU3ODg2ZTIxMjI2ZmY3XCIsXG4gIHpvb206IDE4LFxuICB0aWx0OiA2Ny41LFxuICBkaXNhYmxlRGVmYXVsdFVJOiB0cnVlLFxuICBiYWNrZ3JvdW5kQ29sb3I6IFwidHJhbnNwYXJlbnRcIixcbiAgZ2VzdHVyZUhhbmRsaW5nOiBcImdyZWVkeVwiLFxufTtcblxubmV3IExvYWRlcihMT0FERVJfT1BUSU9OUykubG9hZCgpLnRoZW4oKCkgPT4ge1xuICAvLyBjcmVhdGUgdGhlIG1hcCBhbmQgb3ZlcmxheVxuICBjb25zdCBtYXAgPSBuZXcgZ29vZ2xlLm1hcHMuTWFwKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibWFwXCIpLCBtYXBPcHRpb25zKTtcbiAgY29uc3Qgb3ZlcmxheSA9IG5ldyBUaHJlZUpTT3ZlcmxheVZpZXcoeyBtYXAsIGFuY2hvcjogY2VudGVyLCB1cEF4aXM6IFwiWVwiIH0pO1xuXG4gIGNvbnN0IG1hcERpdiA9IG1hcC5nZXREaXYoKTtcbiAgY29uc3QgbW91c2VQb3NpdGlvbiA9IG5ldyBWZWN0b3IyKCk7XG5cbiAgbWFwLmFkZExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIChldjogZ29vZ2xlLm1hcHMuTWFwTW91c2VFdmVudCkgPT4ge1xuICAgIGNvbnN0IGRvbUV2ZW50ID0gZXYuZG9tRXZlbnQgYXMgTW91c2VFdmVudDtcbiAgICBjb25zdCB7IGxlZnQsIHRvcCwgd2lkdGgsIGhlaWdodCB9ID0gbWFwRGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgY29uc3QgeCA9IGRvbUV2ZW50LmNsaWVudFggLSBsZWZ0O1xuICAgIGNvbnN0IHkgPSBkb21FdmVudC5jbGllbnRZIC0gdG9wO1xuXG4gICAgbW91c2VQb3NpdGlvbi54ID0gMiAqICh4IC8gd2lkdGgpIC0gMTtcbiAgICBtb3VzZVBvc2l0aW9uLnkgPSAxIC0gMiAqICh5IC8gaGVpZ2h0KTtcblxuICAgIC8vIHNpbmNlIHRoZSBhY3R1YWwgcmF5Y2FzdGluZyBpcyBwZXJmb3JtZWQgd2hlbiB0aGUgbmV4dCBmcmFtZSBpc1xuICAgIC8vIHJlbmRlcmVkLCB3ZSBoYXZlIHRvIG1ha2Ugc3VyZSB0aGF0IGl0IHdpbGwgYmUgY2FsbGVkIGZvciB0aGUgbmV4dCBmcmFtZS5cbiAgICBvdmVybGF5LnJlcXVlc3RSZWRyYXcoKTtcbiAgfSk7XG5cbiAgLy8gZ3JpZC0gYW5kIGF4ZXMgaGVscGVycyB0byBoZWxwIHdpdGggdGhlIG9yaWVudGF0aW9uXG4gIGNvbnN0IGdyaWQgPSBuZXcgR3JpZEhlbHBlcigxKTtcblxuICBncmlkLnJvdGF0aW9uLnkgPSBNYXRoVXRpbHMuZGVnVG9SYWQoMjguMSk7XG4gIGdyaWQuc2NhbGUuc2V0KDQ4LjgsIDAsIDkxLjQ0KTtcbiAgb3ZlcmxheS5zY2VuZS5hZGQoZ3JpZCk7XG4gIG92ZXJsYXkuc2NlbmUuYWRkKG5ldyBBeGVzSGVscGVyKDIwKSk7XG5cbiAgY29uc3QgbWVzaGVzID0gY29vcmRpbmF0ZXMubWFwKChwKSA9PiB7XG4gICAgY29uc3QgbWVzaCA9IG5ldyBNZXNoKFxuICAgICAgbmV3IEN5bGluZGVyR2VvbWV0cnkoMiwgMSwgMjAsIDI0LCAxKSxcbiAgICAgIG5ldyBNZXNoTWF0Y2FwTWF0ZXJpYWwoKVxuICAgICk7XG4gICAgbWVzaC5nZW9tZXRyeS50cmFuc2xhdGUoMCwgbWVzaC5nZW9tZXRyeS5wYXJhbWV0ZXJzLmhlaWdodCAvIDIsIDApO1xuICAgIG92ZXJsYXkubGF0TG5nQWx0aXR1ZGVUb1ZlY3RvcjMocCwgbWVzaC5wb3NpdGlvbik7XG5cbiAgICBvdmVybGF5LnNjZW5lLmFkZChtZXNoKTtcblxuICAgIHJldHVybiBtZXNoO1xuICB9KTtcblxuICBsZXQgaGlnaGxpZ2h0ZWRPYmplY3Q6ICh0eXBlb2YgbWVzaGVzKVtudW1iZXJdIHwgbnVsbCA9IG51bGw7XG5cbiAgb3ZlcmxheS5vbkJlZm9yZURyYXcgPSAoKSA9PiB7XG4gICAgY29uc3QgaW50ZXJzZWN0aW9ucyA9IG92ZXJsYXkucmF5Y2FzdChtb3VzZVBvc2l0aW9uLCBtZXNoZXMsIHtcbiAgICAgIHJlY3Vyc2l2ZTogZmFsc2UsXG4gICAgfSk7XG5cbiAgICBpZiAoaGlnaGxpZ2h0ZWRPYmplY3QpIHtcbiAgICAgIC8vIHdoZW4gdGhlcmUncyBhIHByZXZpb3VzbHkgaGlnaGxpZ2h0ZWQgb2JqZWN0LCByZXNldCB0aGUgaGlnaGxpZ2h0aW5nXG4gICAgICBoaWdobGlnaHRlZE9iamVjdC5tYXRlcmlhbC5jb2xvci5zZXRIZXgoREVGQVVMVF9DT0xPUik7XG4gICAgfVxuXG4gICAgaWYgKGludGVyc2VjdGlvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAvLyByZXNldCBkZWZhdWx0IGN1cnNvciB3aGVuIG5vIG9iamVjdCBpcyB1bmRlciB0aGUgY3Vyc29yXG4gICAgICBtYXAuc2V0T3B0aW9ucyh7IGRyYWdnYWJsZUN1cnNvcjogbnVsbCB9KTtcbiAgICAgIGhpZ2hsaWdodGVkT2JqZWN0ID0gbnVsbDtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBjaGFuZ2UgdGhlIGNvbG9yIG9mIHRoZSBvYmplY3QgYW5kIHVwZGF0ZSB0aGUgbWFwLWN1cnNvciB0byBpbmRpY2F0ZVxuICAgIC8vIHRoZSBvYmplY3QgaXMgY2xpY2thYmxlLlxuICAgIGhpZ2hsaWdodGVkT2JqZWN0ID0gaW50ZXJzZWN0aW9uc1swXS5vYmplY3Q7XG4gICAgaGlnaGxpZ2h0ZWRPYmplY3QubWF0ZXJpYWwuY29sb3Iuc2V0SGV4KEhJR0hMSUdIVF9DT0xPUik7XG4gICAgbWFwLnNldE9wdGlvbnMoeyBkcmFnZ2FibGVDdXJzb3I6IFwicG9pbnRlclwiIH0pO1xuICB9O1xufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7QUFjRztBQU1JLE1BQU0sY0FBYyxHQUFrQjtBQUMzQyxJQUFBLE1BQU0sRUFBRSx5Q0FBeUM7QUFDakQsSUFBQSxPQUFPLEVBQUUsTUFBTTtBQUNmLElBQUEsU0FBUyxFQUFFLEVBQUU7Q0FDZDs7QUN4QkQ7Ozs7Ozs7Ozs7Ozs7O0FBY0c7QUFVSDtBQUNBLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQztBQUM5QyxNQUFNLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxHQUFHLFNBQVMsQ0FBQztBQUVsQyxNQUFNLFlBQVksR0FBRyxTQUFTLENBQUM7QUFHdEM7Ozs7QUFJRztBQUNHLFNBQVUsdUJBQXVCLENBQ3JDLEtBQWtCLEVBQUE7SUFFbEIsSUFDRSxNQUFNLENBQUMsTUFBTTtBQUNiLFFBQUEsTUFBTSxDQUFDLElBQUk7QUFDWCxTQUFDLEtBQUssWUFBWSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU07QUFDbEMsWUFBQSxLQUFLLFlBQVksTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsRUFDOUM7UUFDQSxPQUFPLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO0FBQzNDLEtBQUE7SUFFRCxPQUFPLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxHQUFJLEtBQW1DLEVBQUUsQ0FBQztBQUNsRSxDQUFDO0FBRUQ7OztBQUdH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
