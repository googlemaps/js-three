import { V as Vector3, M as MathUtils, Q as Quaternion, a as Matrix4, R as Raycaster, S as Scene, P as PerspectiveCamera, E as Euler, W as WebGLRenderer, b as PCFSoftShadowMap, c as REVISION, s as sRGBEncoding, H as HemisphereLight, D as DirectionalLight, L as Loader, d as Vector2, G as GridHelper, A as AxesHelper, e as Mesh, C as CylinderGeometry, f as MeshMatcapMaterial } from './vendor-209d9ec6.js';

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmF5Y2FzdGluZy5qcyIsInNvdXJjZXMiOlsiLi4vLi4vZXhhbXBsZXMvY29uZmlnLnRzIiwiLi4vLi4vc3JjL3V0aWwudHMiLCIuLi8uLi9zcmMvdGhyZWUudHMiLCIuLi8uLi9leGFtcGxlcy9yYXljYXN0aW5nLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IDIwMjEgR29vZ2xlIExMQ1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbmV4cG9ydCBjb25zdCBNQVBfSUQgPSBcIjdiOWE4OTdhY2QwYTYzYTRcIjtcbmV4cG9ydCBjb25zdCBMT0FERVJfT1BUSU9OUyA9IHtcbiAgICBhcGlLZXk6IFwiQUl6YVN5RDh4aWFWUFdCMDJPZVFrSk9lbkxpSnpkZVVIemxodTAwXCIsXG4gICAgdmVyc2lvbjogXCJiZXRhXCIsXG4gICAgbGlicmFyaWVzOiBbXSxcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1jb25maWcuanMubWFwIiwiLyoqXG4gKiBDb3B5cmlnaHQgMjAyMSBHb29nbGUgTExDLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbmltcG9ydCB7IE1hdGhVdGlscywgVmVjdG9yMyB9IGZyb20gXCJ0aHJlZVwiO1xuLy8gc2hvcnRoYW5kcyBmb3IgbWF0aC1mdW5jdGlvbnMsIG1ha2VzIGVxdWF0aW9ucyBtb3JlIHJlYWRhYmxlXG5jb25zdCB7IGF0YW4sIGNvcywgZXhwLCBsb2csIHRhbiwgUEkgfSA9IE1hdGg7XG5jb25zdCB7IGRlZ1RvUmFkLCByYWRUb0RlZyB9ID0gTWF0aFV0aWxzO1xuZXhwb3J0IGNvbnN0IEVBUlRIX1JBRElVUyA9IDYzNzEwMTAuMDtcbmV4cG9ydCBjb25zdCBXT1JMRF9TSVpFID0gTWF0aC5QSSAqIEVBUlRIX1JBRElVUztcbi8qKlxuICogQ29udmVydHMgYW55IG9mIHRoZSBzdXBwb3J0ZWQgcG9zaXRpb24gZm9ybWF0cyBpbnRvIHRoZVxuICogZ29vZ2xlLm1hcHMuTGF0TG5nQWx0aXR1ZGVMaXRlcmFsIGZvcm1hdCB1c2VkIGZvciB0aGUgY2FsY3VsYXRpb25zLlxuICogQHBhcmFtIHBvaW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b0xhdExuZ0FsdGl0dWRlTGl0ZXJhbChwb2ludCkge1xuICAgIGlmICh3aW5kb3cuZ29vZ2xlICYmXG4gICAgICAgIGdvb2dsZS5tYXBzICYmXG4gICAgICAgIChwb2ludCBpbnN0YW5jZW9mIGdvb2dsZS5tYXBzLkxhdExuZyB8fFxuICAgICAgICAgICAgcG9pbnQgaW5zdGFuY2VvZiBnb29nbGUubWFwcy5MYXRMbmdBbHRpdHVkZSkpIHtcbiAgICAgICAgcmV0dXJuIHsgYWx0aXR1ZGU6IDAsIC4uLnBvaW50LnRvSlNPTigpIH07XG4gICAgfVxuICAgIHJldHVybiB7IGFsdGl0dWRlOiAwLCAuLi5wb2ludCB9O1xufVxuLyoqXG4gKiBDb252ZXJ0cyBsYXRpdHVkZSBhbmQgbG9uZ2l0dWRlIHRvIHdvcmxkIHNwYWNlIGNvb3JkaW5hdGVzIHJlbGF0aXZlXG4gKiB0byBhIHJlZmVyZW5jZSBsb2NhdGlvbiB3aXRoIHkgdXAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsYXRMbmdUb1ZlY3RvcjNSZWxhdGl2ZShwb2ludCwgcmVmZXJlbmNlLCB0YXJnZXQgPSBuZXcgVmVjdG9yMygpKSB7XG4gICAgY29uc3QgW3B4LCBweV0gPSBsYXRMbmdUb1hZKHBvaW50KTtcbiAgICBjb25zdCBbcngsIHJ5XSA9IGxhdExuZ1RvWFkocmVmZXJlbmNlKTtcbiAgICB0YXJnZXQuc2V0KHB4IC0gcngsIHB5IC0gcnksIDApO1xuICAgIC8vIGFwcGx5IHRoZSBzcGhlcmljYWwgbWVyY2F0b3Igc2NhbGUtZmFjdG9yIGZvciB0aGUgcmVmZXJlbmNlIGxhdGl0dWRlXG4gICAgdGFyZ2V0Lm11bHRpcGx5U2NhbGFyKGNvcyhkZWdUb1JhZChyZWZlcmVuY2UubGF0KSkpO1xuICAgIHRhcmdldC56ID0gcG9pbnQuYWx0aXR1ZGUgLSByZWZlcmVuY2UuYWx0aXR1ZGU7XG4gICAgcmV0dXJuIHRhcmdldDtcbn1cbi8qKlxuICogQ29udmVydHMgV0dTODQgbGF0aXR1ZGUgYW5kIGxvbmdpdHVkZSB0byAodW5jb3JyZWN0ZWQpIFdlYk1lcmNhdG9yIG1ldGVycy5cbiAqIChXR1M4NCAtLT4gV2ViTWVyY2F0b3IgKEVQU0c6Mzg1NykpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsYXRMbmdUb1hZKHBvc2l0aW9uKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgRUFSVEhfUkFESVVTICogZGVnVG9SYWQocG9zaXRpb24ubG5nKSxcbiAgICAgICAgRUFSVEhfUkFESVVTICogbG9nKHRhbigwLjI1ICogUEkgKyAwLjUgKiBkZWdUb1JhZChwb3NpdGlvbi5sYXQpKSksXG4gICAgXTtcbn1cbi8qKlxuICogQ29udmVydHMgV2ViTWVyY2F0b3IgbWV0ZXJzIHRvIFdHUzg0IGxhdGl0dWRlL2xvbmdpdHVkZS5cbiAqIChXZWJNZXJjYXRvciAoRVBTRzozODU3KSAtLT4gV0dTODQpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB4eVRvTGF0TG5nKHApIHtcbiAgICBjb25zdCBbeCwgeV0gPSBwO1xuICAgIHJldHVybiB7XG4gICAgICAgIGxhdDogcmFkVG9EZWcoUEkgKiAwLjUgLSAyLjAgKiBhdGFuKGV4cCgteSAvIEVBUlRIX1JBRElVUykpKSxcbiAgICAgICAgbG5nOiByYWRUb0RlZyh4KSAvIEVBUlRIX1JBRElVUyxcbiAgICB9O1xufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dXRpbC5qcy5tYXAiLCIvKipcbiAqIENvcHlyaWdodCAyMDIxIEdvb2dsZSBMTENcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5pbXBvcnQgeyBEaXJlY3Rpb25hbExpZ2h0LCBFdWxlciwgSGVtaXNwaGVyZUxpZ2h0LCBNYXRoVXRpbHMsIE1hdHJpeDQsIFBDRlNvZnRTaGFkb3dNYXAsIFBlcnNwZWN0aXZlQ2FtZXJhLCBRdWF0ZXJuaW9uLCBSYXljYXN0ZXIsIFJFVklTSU9OLCBTY2VuZSwgc1JHQkVuY29kaW5nLCBWZWN0b3IzLCBXZWJHTFJlbmRlcmVyLCB9IGZyb20gXCJ0aHJlZVwiO1xuaW1wb3J0IHsgbGF0TG5nVG9WZWN0b3IzUmVsYXRpdmUsIHRvTGF0TG5nQWx0aXR1ZGVMaXRlcmFsIH0gZnJvbSBcIi4vdXRpbFwiO1xuY29uc3QgREVGQVVMVF9VUCA9IG5ldyBWZWN0b3IzKDAsIDAsIDEpO1xuLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWVtcHR5LWZ1bmN0aW9uICovXG4vKipcbiAqIEFkZCBhIFt0aHJlZS5qc10oaHR0cHM6Ly90aHJlZWpzLm9yZykgc2NlbmUgYXMgYSBbR29vZ2xlIE1hcHMgV2ViR0xPdmVybGF5Vmlld10oaHR0cDovL2dvby5nbGUvV2ViR0xPdmVybGF5Vmlldy1yZWYpLlxuICovXG5leHBvcnQgY2xhc3MgVGhyZWVKU092ZXJsYXlWaWV3IHtcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcbiAgICAgICAgLyoqIHtAaW5oZXJpdERvYyBUaHJlZUpTT3ZlcmxheVZpZXdPcHRpb25zLmFuaW1hdGlvbk1vZGV9ICovXG4gICAgICAgIHRoaXMuYW5pbWF0aW9uTW9kZSA9IFwib25kZW1hbmRcIjtcbiAgICAgICAgdGhpcy5yb3RhdGlvbkFycmF5ID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgICAgICAgdGhpcy5yb3RhdGlvbkludmVyc2UgPSBuZXcgUXVhdGVybmlvbigpO1xuICAgICAgICB0aGlzLnByb2plY3Rpb25NYXRyaXhJbnZlcnNlID0gbmV3IE1hdHJpeDQoKTtcbiAgICAgICAgdGhpcy5yYXljYXN0ZXIgPSBuZXcgUmF5Y2FzdGVyKCk7XG4gICAgICAgIGNvbnN0IHsgYW5jaG9yID0geyBsYXQ6IDAsIGxuZzogMCwgYWx0aXR1ZGU6IDAgfSwgdXBBeGlzID0gXCJaXCIsIHNjZW5lLCBtYXAsIGFuaW1hdGlvbk1vZGUgPSBcIm9uZGVtYW5kXCIsIGFkZERlZmF1bHRMaWdodGluZyA9IHRydWUsIH0gPSBvcHRpb25zO1xuICAgICAgICB0aGlzLm92ZXJsYXkgPSBuZXcgZ29vZ2xlLm1hcHMuV2ViR0xPdmVybGF5VmlldygpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5jYW1lcmEgPSBudWxsO1xuICAgICAgICB0aGlzLmFuaW1hdGlvbk1vZGUgPSBhbmltYXRpb25Nb2RlO1xuICAgICAgICB0aGlzLnNldEFuY2hvcihhbmNob3IpO1xuICAgICAgICB0aGlzLnNldFVwQXhpcyh1cEF4aXMpO1xuICAgICAgICB0aGlzLnNjZW5lID0gc2NlbmUgPz8gbmV3IFNjZW5lKCk7XG4gICAgICAgIGlmIChhZGREZWZhdWx0TGlnaHRpbmcpXG4gICAgICAgICAgICB0aGlzLmluaXRTY2VuZUxpZ2h0cygpO1xuICAgICAgICB0aGlzLm92ZXJsYXkub25BZGQgPSB0aGlzLm9uQWRkLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMub3ZlcmxheS5vblJlbW92ZSA9IHRoaXMub25SZW1vdmUuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5vdmVybGF5Lm9uQ29udGV4dExvc3QgPSB0aGlzLm9uQ29udGV4dExvc3QuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5vdmVybGF5Lm9uQ29udGV4dFJlc3RvcmVkID0gdGhpcy5vbkNvbnRleHRSZXN0b3JlZC5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLm92ZXJsYXkub25TdGF0ZVVwZGF0ZSA9IHRoaXMub25TdGF0ZVVwZGF0ZS5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLm92ZXJsYXkub25EcmF3ID0gdGhpcy5vbkRyYXcuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5jYW1lcmEgPSBuZXcgUGVyc3BlY3RpdmVDYW1lcmEoKTtcbiAgICAgICAgaWYgKG1hcCkge1xuICAgICAgICAgICAgdGhpcy5zZXRNYXAobWFwKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSBhbmNob3ItcG9pbnQuXG4gICAgICogQHBhcmFtIGFuY2hvclxuICAgICAqL1xuICAgIHNldEFuY2hvcihhbmNob3IpIHtcbiAgICAgICAgdGhpcy5hbmNob3IgPSB0b0xhdExuZ0FsdGl0dWRlTGl0ZXJhbChhbmNob3IpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSBheGlzIHRvIHVzZSBhcyBcInVwXCIgaW4gdGhlIHNjZW5lLlxuICAgICAqIEBwYXJhbSBheGlzXG4gICAgICovXG4gICAgc2V0VXBBeGlzKGF4aXMpIHtcbiAgICAgICAgY29uc3QgdXBWZWN0b3IgPSBuZXcgVmVjdG9yMygwLCAwLCAxKTtcbiAgICAgICAgaWYgKHR5cGVvZiBheGlzICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICB1cFZlY3Rvci5jb3B5KGF4aXMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKGF4aXMudG9Mb3dlckNhc2UoKSA9PT0gXCJ5XCIpIHtcbiAgICAgICAgICAgICAgICB1cFZlY3Rvci5zZXQoMCwgMSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChheGlzLnRvTG93ZXJDYXNlKCkgIT09IFwielwiKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBpbnZhbGlkIHZhbHVlICcke2F4aXN9JyBzcGVjaWZpZWQgYXMgdXBBeGlzYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdXBWZWN0b3Iubm9ybWFsaXplKCk7XG4gICAgICAgIGNvbnN0IHEgPSBuZXcgUXVhdGVybmlvbigpO1xuICAgICAgICBxLnNldEZyb21Vbml0VmVjdG9ycyh1cFZlY3RvciwgREVGQVVMVF9VUCk7XG4gICAgICAgIC8vIGludmVyc2Ugcm90YXRpb24gaXMgbmVlZGVkIGluIGxhdExuZ0FsdGl0dWRlVG9WZWN0b3IzKClcbiAgICAgICAgdGhpcy5yb3RhdGlvbkludmVyc2UuY29weShxKS5pbnZlcnQoKTtcbiAgICAgICAgLy8gY29weSB0byByb3RhdGlvbkFycmF5IGZvciB0cmFuc2Zvcm1lci5mcm9tTGF0TG5nQWx0aXR1ZGUoKVxuICAgICAgICBjb25zdCBldWxlciA9IG5ldyBFdWxlcigpLnNldEZyb21RdWF0ZXJuaW9uKHEsIFwiWFlaXCIpO1xuICAgICAgICB0aGlzLnJvdGF0aW9uQXJyYXlbMF0gPSBNYXRoVXRpbHMucmFkVG9EZWcoZXVsZXIueCk7XG4gICAgICAgIHRoaXMucm90YXRpb25BcnJheVsxXSA9IE1hdGhVdGlscy5yYWRUb0RlZyhldWxlci55KTtcbiAgICAgICAgdGhpcy5yb3RhdGlvbkFycmF5WzJdID0gTWF0aFV0aWxzLnJhZFRvRGVnKGV1bGVyLnopO1xuICAgIH1cbiAgICAvLyBpbXBsZW1ldGF0aW9uXG4gICAgcmF5Y2FzdChwLCBvcHRpb25zT3JPYmplY3RzLCBvcHRpb25zID0ge30pIHtcbiAgICAgICAgbGV0IG9iamVjdHM7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnNPck9iamVjdHMpKSB7XG4gICAgICAgICAgICBvYmplY3RzID0gb3B0aW9uc09yT2JqZWN0cyB8fCBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgb2JqZWN0cyA9IFt0aGlzLnNjZW5lXTtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7IC4uLm9wdGlvbnNPck9iamVjdHMsIHJlY3Vyc2l2ZTogdHJ1ZSB9O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHsgdXBkYXRlTWF0cml4ID0gdHJ1ZSwgcmVjdXJzaXZlID0gZmFsc2UsIHJheWNhc3RlclBhcmFtZXRlcnMsIH0gPSBvcHRpb25zO1xuICAgICAgICAvLyB3aGVuIGByYXljYXN0KClgIGlzIGNhbGxlZCBmcm9tIHdpdGhpbiB0aGUgYG9uQmVmb3JlUmVuZGVyKClgIGNhbGxiYWNrLFxuICAgICAgICAvLyB0aGUgbXZwLW1hdHJpeCBmb3IgdGhpcyBmcmFtZSBoYXMgYWxyZWFkeSBiZWVuIGNvbXB1dGVkIGFuZCBzdG9yZWQgaW5cbiAgICAgICAgLy8gYHRoaXMuY2FtZXJhLnByb2plY3Rpb25NYXRyaXhgLlxuICAgICAgICAvLyBUaGUgbXZwLW1hdHJpeCB0cmFuc2Zvcm1zIHdvcmxkLXNwYWNlIG1ldGVycyB0byBjbGlwLXNwYWNlXG4gICAgICAgIC8vIGNvb3JkaW5hdGVzLiBUaGUgaW52ZXJzZSBtYXRyaXggY3JlYXRlZCBoZXJlIGRvZXMgdGhlIGV4YWN0IG9wcG9zaXRlXG4gICAgICAgIC8vIGFuZCBjb252ZXJ0cyBjbGlwLXNwYWNlIGNvb3JkaW5hdGVzIHRvIHdvcmxkLXNwYWNlLlxuICAgICAgICBpZiAodXBkYXRlTWF0cml4KSB7XG4gICAgICAgICAgICB0aGlzLnByb2plY3Rpb25NYXRyaXhJbnZlcnNlLmNvcHkodGhpcy5jYW1lcmEucHJvamVjdGlvbk1hdHJpeCkuaW52ZXJ0KCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY3JlYXRlIHR3byBwb2ludHMgKHdpdGggZGlmZmVyZW50IGRlcHRoKSBmcm9tIHRoZSBtb3VzZS1wb3NpdGlvbiBhbmRcbiAgICAgICAgLy8gY29udmVydCB0aGVtIGludG8gd29ybGQtc3BhY2UgY29vcmRpbmF0ZXMgdG8gc2V0IHVwIHRoZSByYXkuXG4gICAgICAgIHRoaXMucmF5Y2FzdGVyLnJheS5vcmlnaW5cbiAgICAgICAgICAgIC5zZXQocC54LCBwLnksIDApXG4gICAgICAgICAgICAuYXBwbHlNYXRyaXg0KHRoaXMucHJvamVjdGlvbk1hdHJpeEludmVyc2UpO1xuICAgICAgICB0aGlzLnJheWNhc3Rlci5yYXkuZGlyZWN0aW9uXG4gICAgICAgICAgICAuc2V0KHAueCwgcC55LCAwLjUpXG4gICAgICAgICAgICAuYXBwbHlNYXRyaXg0KHRoaXMucHJvamVjdGlvbk1hdHJpeEludmVyc2UpXG4gICAgICAgICAgICAuc3ViKHRoaXMucmF5Y2FzdGVyLnJheS5vcmlnaW4pXG4gICAgICAgICAgICAubm9ybWFsaXplKCk7XG4gICAgICAgIC8vIGJhY2sgdXAgdGhlIHJheWNhc3RlciBwYXJhbWV0ZXJzXG4gICAgICAgIGNvbnN0IG9sZFJheWNhc3RlclBhcmFtcyA9IHRoaXMucmF5Y2FzdGVyLnBhcmFtcztcbiAgICAgICAgaWYgKHJheWNhc3RlclBhcmFtZXRlcnMpIHtcbiAgICAgICAgICAgIHRoaXMucmF5Y2FzdGVyLnBhcmFtcyA9IHJheWNhc3RlclBhcmFtZXRlcnM7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IHRoaXMucmF5Y2FzdGVyLmludGVyc2VjdE9iamVjdHMob2JqZWN0cywgcmVjdXJzaXZlKTtcbiAgICAgICAgLy8gcmVzZXQgcmF5Y2FzdGVyIHBhcmFtcyB0byB3aGF0ZXZlciB0aGV5IHdlcmUgYmVmb3JlXG4gICAgICAgIHRoaXMucmF5Y2FzdGVyLnBhcmFtcyA9IG9sZFJheWNhc3RlclBhcmFtcztcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfVxuICAgIG9uU3RhdGVVcGRhdGUoKSB7IH1cbiAgICAvKipcbiAgICAgKiBPdmVyd3JpdGUgdGhpcyBtZXRob2QgdG8gZmV0Y2ggb3IgY3JlYXRlIGludGVybWVkaWF0ZSBkYXRhIHN0cnVjdHVyZXNcbiAgICAgKiBiZWZvcmUgdGhlIG92ZXJsYXkgaXMgZHJhd24gdGhhdCBkb27igJl0IHJlcXVpcmUgaW1tZWRpYXRlIGFjY2VzcyB0byB0aGVcbiAgICAgKiBXZWJHTCByZW5kZXJpbmcgY29udGV4dC5cbiAgICAgKi9cbiAgICBvbkFkZCgpIHsgfVxuICAgIC8qKlxuICAgICAqIE92ZXJ3cml0ZSB0aGlzIG1ldGhvZCB0byB1cGRhdGUgeW91ciBzY2VuZSBqdXN0IGJlZm9yZSBhIG5ldyBmcmFtZSBpc1xuICAgICAqIGRyYXduLlxuICAgICAqL1xuICAgIG9uQmVmb3JlRHJhdygpIHsgfVxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIGNhbGxlZCB3aGVuIHRoZSBvdmVybGF5IGlzIHJlbW92ZWQgZnJvbSB0aGUgbWFwIHdpdGhcbiAgICAgKiBgb3ZlcmxheS5zZXRNYXAobnVsbClgLCBhbmQgaXMgd2hlcmUgeW91IGNhbiByZW1vdmUgYWxsIGludGVybWVkaWF0ZVxuICAgICAqIG9iamVjdHMgY3JlYXRlZCBpbiBvbkFkZC5cbiAgICAgKi9cbiAgICBvblJlbW92ZSgpIHsgfVxuICAgIC8qKlxuICAgICAqIFRyaWdnZXJzIHRoZSBtYXAgdG8gdXBkYXRlIEdMIHN0YXRlLlxuICAgICAqL1xuICAgIHJlcXVlc3RTdGF0ZVVwZGF0ZSgpIHtcbiAgICAgICAgdGhpcy5vdmVybGF5LnJlcXVlc3RTdGF0ZVVwZGF0ZSgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBUcmlnZ2VycyB0aGUgbWFwIHRvIHJlZHJhdyBhIGZyYW1lLlxuICAgICAqL1xuICAgIHJlcXVlc3RSZWRyYXcoKSB7XG4gICAgICAgIHRoaXMub3ZlcmxheS5yZXF1ZXN0UmVkcmF3KCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIG1hcCB0aGUgb3ZlcmxheSBpcyBhZGRlZCB0by5cbiAgICAgKi9cbiAgICBnZXRNYXAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm92ZXJsYXkuZ2V0TWFwKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgdGhlIG92ZXJsYXkgdG8gdGhlIG1hcC5cbiAgICAgKiBAcGFyYW0gbWFwIFRoZSBtYXAgdG8gYWNjZXNzIHRoZSBkaXYsIG1vZGVsIGFuZCB2aWV3IHN0YXRlLlxuICAgICAqL1xuICAgIHNldE1hcChtYXApIHtcbiAgICAgICAgdGhpcy5vdmVybGF5LnNldE1hcChtYXApO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIHRoZSBnaXZlbiBsaXN0ZW5lciBmdW5jdGlvbiB0byB0aGUgZ2l2ZW4gZXZlbnQgbmFtZS4gUmV0dXJucyBhblxuICAgICAqIGlkZW50aWZpZXIgZm9yIHRoaXMgbGlzdGVuZXIgdGhhdCBjYW4gYmUgdXNlZCB3aXRoXG4gICAgICogPGNvZGU+Z29vZ2xlLm1hcHMuZXZlbnQucmVtb3ZlTGlzdGVuZXI8L2NvZGU+LlxuICAgICAqL1xuICAgIGFkZExpc3RlbmVyKGV2ZW50TmFtZSwgaGFuZGxlcikge1xuICAgICAgICByZXR1cm4gdGhpcy5vdmVybGF5LmFkZExpc3RlbmVyKGV2ZW50TmFtZSwgaGFuZGxlcik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIGNhbGxlZCBvbmNlIHRoZSByZW5kZXJpbmcgY29udGV4dCBpcyBhdmFpbGFibGUuIFVzZSBpdCB0b1xuICAgICAqIGluaXRpYWxpemUgb3IgYmluZCBhbnkgV2ViR0wgc3RhdGUgc3VjaCBhcyBzaGFkZXJzIG9yIGJ1ZmZlciBvYmplY3RzLlxuICAgICAqIEBwYXJhbSBvcHRpb25zIHRoYXQgYWxsb3cgZGV2ZWxvcGVycyB0byByZXN0b3JlIHRoZSBHTCBjb250ZXh0LlxuICAgICAqL1xuICAgIG9uQ29udGV4dFJlc3RvcmVkKHsgZ2wgfSkge1xuICAgICAgICB0aGlzLnJlbmRlcmVyID0gbmV3IFdlYkdMUmVuZGVyZXIoe1xuICAgICAgICAgICAgY2FudmFzOiBnbC5jYW52YXMsXG4gICAgICAgICAgICBjb250ZXh0OiBnbCxcbiAgICAgICAgICAgIC4uLmdsLmdldENvbnRleHRBdHRyaWJ1dGVzKCksXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLmF1dG9DbGVhciA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLmF1dG9DbGVhckRlcHRoID0gZmFsc2U7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2hhZG93TWFwLmVuYWJsZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNoYWRvd01hcC50eXBlID0gUENGU29mdFNoYWRvd01hcDtcbiAgICAgICAgLy8gU2luY2UgcjE1MiwgZGVmYXVsdCBvdXRwdXRDb2xvclNwYWNlIGlzIFNSR0JcbiAgICAgICAgLy8gRGVwcmVjYXRlZCBvdXRwdXRFbmNvZGluZyBrZXB0IGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eVxuICAgICAgICBpZiAoTnVtYmVyKFJFVklTSU9OKSA8IDE1MilcbiAgICAgICAgICAgIHRoaXMucmVuZGVyZXIub3V0cHV0RW5jb2RpbmcgPSBzUkdCRW5jb2Rpbmc7XG4gICAgICAgIGNvbnN0IHsgd2lkdGgsIGhlaWdodCB9ID0gZ2wuY2FudmFzO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFZpZXdwb3J0KDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBpcyBjYWxsZWQgd2hlbiB0aGUgcmVuZGVyaW5nIGNvbnRleHQgaXMgbG9zdCBmb3IgYW55IHJlYXNvbixcbiAgICAgKiBhbmQgaXMgd2hlcmUgeW91IHNob3VsZCBjbGVhbiB1cCBhbnkgcHJlLWV4aXN0aW5nIEdMIHN0YXRlLCBzaW5jZSBpdCBpc1xuICAgICAqIG5vIGxvbmdlciBuZWVkZWQuXG4gICAgICovXG4gICAgb25Db250ZXh0TG9zdCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnJlbmRlcmVyKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZW5kZXJlci5kaXNwb3NlKCk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIgPSBudWxsO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBJbXBsZW1lbnQgdGhpcyBtZXRob2QgdG8gZHJhdyBXZWJHTCBjb250ZW50IGRpcmVjdGx5IG9uIHRoZSBtYXAuIE5vdGVcbiAgICAgKiB0aGF0IGlmIHRoZSBvdmVybGF5IG5lZWRzIGEgbmV3IGZyYW1lIGRyYXduIHRoZW4gY2FsbCB7QGxpbmtcbiAgICAgKiBUaHJlZUpTT3ZlcmxheVZpZXcucmVxdWVzdFJlZHJhd30uXG4gICAgICogQHBhcmFtIG9wdGlvbnMgdGhhdCBhbGxvdyBkZXZlbG9wZXJzIHRvIHJlbmRlciBjb250ZW50IHRvIGFuIGFzc29jaWF0ZWRcbiAgICAgKiAgICAgR29vZ2xlIGJhc2VtYXAuXG4gICAgICovXG4gICAgb25EcmF3KHsgZ2wsIHRyYW5zZm9ybWVyIH0pIHtcbiAgICAgICAgdGhpcy5jYW1lcmEucHJvamVjdGlvbk1hdHJpeC5mcm9tQXJyYXkodHJhbnNmb3JtZXIuZnJvbUxhdExuZ0FsdGl0dWRlKHRoaXMuYW5jaG9yLCB0aGlzLnJvdGF0aW9uQXJyYXkpKTtcbiAgICAgICAgZ2wuZGlzYWJsZShnbC5TQ0lTU09SX1RFU1QpO1xuICAgICAgICB0aGlzLm9uQmVmb3JlRHJhdygpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnJlbmRlcih0aGlzLnNjZW5lLCB0aGlzLmNhbWVyYSk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIucmVzZXRTdGF0ZSgpO1xuICAgICAgICBpZiAodGhpcy5hbmltYXRpb25Nb2RlID09PSBcImFsd2F5c1wiKVxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0UmVkcmF3KCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgY29vcmRpbmF0ZXMgZnJvbSBXR1M4NCBMYXRpdHVkZSBMb25naXR1ZGUgdG8gd29ybGQtc3BhY2VcbiAgICAgKiBjb29yZGluYXRlcyB3aGlsZSB0YWtpbmcgdGhlIG9yaWdpbiBhbmQgb3JpZW50YXRpb24gaW50byBhY2NvdW50LlxuICAgICAqL1xuICAgIGxhdExuZ0FsdGl0dWRlVG9WZWN0b3IzKHBvc2l0aW9uLCB0YXJnZXQgPSBuZXcgVmVjdG9yMygpKSB7XG4gICAgICAgIGxhdExuZ1RvVmVjdG9yM1JlbGF0aXZlKHRvTGF0TG5nQWx0aXR1ZGVMaXRlcmFsKHBvc2l0aW9uKSwgdGhpcy5hbmNob3IsIHRhcmdldCk7XG4gICAgICAgIHRhcmdldC5hcHBseVF1YXRlcm5pb24odGhpcy5yb3RhdGlvbkludmVyc2UpO1xuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH1cbiAgICAvLyBNVkNPYmplY3QgaW50ZXJmYWNlIGZvcndhcmRlZCB0byB0aGUgb3ZlcmxheVxuICAgIC8qKlxuICAgICAqIEJpbmRzIGEgVmlldyB0byBhIE1vZGVsLlxuICAgICAqL1xuICAgIGJpbmRUbyhrZXksIHRhcmdldCwgdGFyZ2V0S2V5LCBub05vdGlmeSkge1xuICAgICAgICB0aGlzLm92ZXJsYXkuYmluZFRvKGtleSwgdGFyZ2V0LCB0YXJnZXRLZXksIG5vTm90aWZ5KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogR2V0cyBhIHZhbHVlLlxuICAgICAqL1xuICAgIGdldChrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3ZlcmxheS5nZXQoa2V5KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogTm90aWZ5IGFsbCBvYnNlcnZlcnMgb2YgYSBjaGFuZ2Ugb24gdGhpcyBwcm9wZXJ0eS4gVGhpcyBub3RpZmllcyBib3RoXG4gICAgICogb2JqZWN0cyB0aGF0IGFyZSBib3VuZCB0byB0aGUgb2JqZWN0J3MgcHJvcGVydHkgYXMgd2VsbCBhcyB0aGUgb2JqZWN0XG4gICAgICogdGhhdCBpdCBpcyBib3VuZCB0by5cbiAgICAgKi9cbiAgICBub3RpZnkoa2V5KSB7XG4gICAgICAgIHRoaXMub3ZlcmxheS5ub3RpZnkoa2V5KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0cyBhIHZhbHVlLlxuICAgICAqL1xuICAgIHNldChrZXksIHZhbHVlKSB7XG4gICAgICAgIHRoaXMub3ZlcmxheS5zZXQoa2V5LCB2YWx1ZSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNldHMgYSBjb2xsZWN0aW9uIG9mIGtleS12YWx1ZSBwYWlycy5cbiAgICAgKi9cbiAgICBzZXRWYWx1ZXModmFsdWVzKSB7XG4gICAgICAgIHRoaXMub3ZlcmxheS5zZXRWYWx1ZXModmFsdWVzKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBhIGJpbmRpbmcuIFVuYmluZGluZyB3aWxsIHNldCB0aGUgdW5ib3VuZCBwcm9wZXJ0eSB0byB0aGUgY3VycmVudFxuICAgICAqIHZhbHVlLiBUaGUgb2JqZWN0IHdpbGwgbm90IGJlIG5vdGlmaWVkLCBhcyB0aGUgdmFsdWUgaGFzIG5vdCBjaGFuZ2VkLlxuICAgICAqL1xuICAgIHVuYmluZChrZXkpIHtcbiAgICAgICAgdGhpcy5vdmVybGF5LnVuYmluZChrZXkpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGFsbCBiaW5kaW5ncy5cbiAgICAgKi9cbiAgICB1bmJpbmRBbGwoKSB7XG4gICAgICAgIHRoaXMub3ZlcmxheS51bmJpbmRBbGwoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBsaWdodHMgKGRpcmVjdGlvbmFsIGFuZCBoZW1pc3BoZXJlIGxpZ2h0KSB0byBpbGx1bWluYXRlIHRoZSBtb2RlbFxuICAgICAqIChyb3VnaGx5IGFwcHJveGltYXRlcyB0aGUgbGlnaHRpbmcgb2YgYnVpbGRpbmdzIGluIG1hcHMpXG4gICAgICovXG4gICAgaW5pdFNjZW5lTGlnaHRzKCkge1xuICAgICAgICBjb25zdCBoZW1pTGlnaHQgPSBuZXcgSGVtaXNwaGVyZUxpZ2h0KDB4ZmZmZmZmLCAweDQ0NDQ0NCwgMSk7XG4gICAgICAgIGhlbWlMaWdodC5wb3NpdGlvbi5zZXQoMCwgLTAuMiwgMSkubm9ybWFsaXplKCk7XG4gICAgICAgIGNvbnN0IGRpckxpZ2h0ID0gbmV3IERpcmVjdGlvbmFsTGlnaHQoMHhmZmZmZmYpO1xuICAgICAgICBkaXJMaWdodC5wb3NpdGlvbi5zZXQoMCwgMTAsIDEwMCk7XG4gICAgICAgIHRoaXMuc2NlbmUuYWRkKGhlbWlMaWdodCwgZGlyTGlnaHQpO1xuICAgIH1cbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXRocmVlLmpzLm1hcCIsIi8qKlxuICogQ29weXJpZ2h0IDIwMjEgR29vZ2xlIExMQ1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbmltcG9ydCB7IExPQURFUl9PUFRJT05TIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgeyBUaHJlZUpTT3ZlcmxheVZpZXcgfSBmcm9tIFwiLi4vc3JjXCI7XG5pbXBvcnQgeyBMb2FkZXIgfSBmcm9tIFwiQGdvb2dsZW1hcHMvanMtYXBpLWxvYWRlclwiO1xuaW1wb3J0IHsgQXhlc0hlbHBlciwgQ3lsaW5kZXJHZW9tZXRyeSwgR3JpZEhlbHBlciwgTWF0aFV0aWxzLCBNZXNoLCBNZXNoTWF0Y2FwTWF0ZXJpYWwsIFZlY3RvcjIsIH0gZnJvbSBcInRocmVlXCI7XG4vLyB0aGUgY29ybmVycyBvZiB0aGUgZmllbGQgaW4gdGhlIExldmnigJlzIFN0YWRpdW0gaW4gU2FudGEgQ2xhcmFcbmNvbnN0IGNvb3JkaW5hdGVzID0gW1xuICAgIHsgbG5nOiAtMTIxLjk3MDI5MDQsIGxhdDogMzcuNDAzNDM2MiB9LFxuICAgIHsgbG5nOiAtMTIxLjk2OTgwMTgsIGxhdDogMzcuNDAyNzA5NSB9LFxuICAgIHsgbG5nOiAtMTIxLjk2OTMxMDksIGxhdDogMzcuNDAyOTE4IH0sXG4gICAgeyBsbmc6IC0xMjEuOTY5ODA0LCBsYXQ6IDM3LjQwMzY0NjUgfSxcbl07XG5jb25zdCBjZW50ZXIgPSB7IGxuZzogLTEyMS45Njk4MDMyLCBsYXQ6IDM3LjQwMzE3NzcsIGFsdGl0dWRlOiAwIH07XG5jb25zdCBERUZBVUxUX0NPTE9SID0gMHhmZmZmZmY7XG5jb25zdCBISUdITElHSFRfQ09MT1IgPSAweGZmMDAwMDtcbmNvbnN0IG1hcE9wdGlvbnMgPSB7XG4gICAgY2VudGVyLFxuICAgIG1hcElkOiBcIjcwNTc4ODZlMjEyMjZmZjdcIixcbiAgICB6b29tOiAxOCxcbiAgICB0aWx0OiA2Ny41LFxuICAgIGRpc2FibGVEZWZhdWx0VUk6IHRydWUsXG4gICAgYmFja2dyb3VuZENvbG9yOiBcInRyYW5zcGFyZW50XCIsXG4gICAgZ2VzdHVyZUhhbmRsaW5nOiBcImdyZWVkeVwiLFxufTtcbm5ldyBMb2FkZXIoTE9BREVSX09QVElPTlMpLmxvYWQoKS50aGVuKCgpID0+IHtcbiAgICAvLyBjcmVhdGUgdGhlIG1hcCBhbmQgb3ZlcmxheVxuICAgIGNvbnN0IG1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtYXBcIiksIG1hcE9wdGlvbnMpO1xuICAgIGNvbnN0IG92ZXJsYXkgPSBuZXcgVGhyZWVKU092ZXJsYXlWaWV3KHsgbWFwLCBhbmNob3I6IGNlbnRlciwgdXBBeGlzOiBcIllcIiB9KTtcbiAgICBjb25zdCBtYXBEaXYgPSBtYXAuZ2V0RGl2KCk7XG4gICAgY29uc3QgbW91c2VQb3NpdGlvbiA9IG5ldyBWZWN0b3IyKCk7XG4gICAgbWFwLmFkZExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIChldikgPT4ge1xuICAgICAgICBjb25zdCBkb21FdmVudCA9IGV2LmRvbUV2ZW50O1xuICAgICAgICBjb25zdCB7IGxlZnQsIHRvcCwgd2lkdGgsIGhlaWdodCB9ID0gbWFwRGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBjb25zdCB4ID0gZG9tRXZlbnQuY2xpZW50WCAtIGxlZnQ7XG4gICAgICAgIGNvbnN0IHkgPSBkb21FdmVudC5jbGllbnRZIC0gdG9wO1xuICAgICAgICBtb3VzZVBvc2l0aW9uLnggPSAyICogKHggLyB3aWR0aCkgLSAxO1xuICAgICAgICBtb3VzZVBvc2l0aW9uLnkgPSAxIC0gMiAqICh5IC8gaGVpZ2h0KTtcbiAgICAgICAgLy8gc2luY2UgdGhlIGFjdHVhbCByYXljYXN0aW5nIGlzIHBlcmZvcm1lZCB3aGVuIHRoZSBuZXh0IGZyYW1lIGlzXG4gICAgICAgIC8vIHJlbmRlcmVkLCB3ZSBoYXZlIHRvIG1ha2Ugc3VyZSB0aGF0IGl0IHdpbGwgYmUgY2FsbGVkIGZvciB0aGUgbmV4dCBmcmFtZS5cbiAgICAgICAgb3ZlcmxheS5yZXF1ZXN0UmVkcmF3KCk7XG4gICAgfSk7XG4gICAgLy8gZ3JpZC0gYW5kIGF4ZXMgaGVscGVycyB0byBoZWxwIHdpdGggdGhlIG9yaWVudGF0aW9uXG4gICAgY29uc3QgZ3JpZCA9IG5ldyBHcmlkSGVscGVyKDEpO1xuICAgIGdyaWQucm90YXRpb24ueSA9IE1hdGhVdGlscy5kZWdUb1JhZCgyOC4xKTtcbiAgICBncmlkLnNjYWxlLnNldCg0OC44LCAwLCA5MS40NCk7XG4gICAgb3ZlcmxheS5zY2VuZS5hZGQoZ3JpZCk7XG4gICAgb3ZlcmxheS5zY2VuZS5hZGQobmV3IEF4ZXNIZWxwZXIoMjApKTtcbiAgICBjb25zdCBtZXNoZXMgPSBjb29yZGluYXRlcy5tYXAoKHApID0+IHtcbiAgICAgICAgY29uc3QgbWVzaCA9IG5ldyBNZXNoKG5ldyBDeWxpbmRlckdlb21ldHJ5KDIsIDEsIDIwLCAyNCwgMSksIG5ldyBNZXNoTWF0Y2FwTWF0ZXJpYWwoKSk7XG4gICAgICAgIG1lc2guZ2VvbWV0cnkudHJhbnNsYXRlKDAsIG1lc2guZ2VvbWV0cnkucGFyYW1ldGVycy5oZWlnaHQgLyAyLCAwKTtcbiAgICAgICAgb3ZlcmxheS5sYXRMbmdBbHRpdHVkZVRvVmVjdG9yMyhwLCBtZXNoLnBvc2l0aW9uKTtcbiAgICAgICAgb3ZlcmxheS5zY2VuZS5hZGQobWVzaCk7XG4gICAgICAgIHJldHVybiBtZXNoO1xuICAgIH0pO1xuICAgIGxldCBoaWdobGlnaHRlZE9iamVjdCA9IG51bGw7XG4gICAgb3ZlcmxheS5vbkJlZm9yZURyYXcgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGludGVyc2VjdGlvbnMgPSBvdmVybGF5LnJheWNhc3QobW91c2VQb3NpdGlvbiwgbWVzaGVzLCB7XG4gICAgICAgICAgICByZWN1cnNpdmU6IGZhbHNlLFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGhpZ2hsaWdodGVkT2JqZWN0KSB7XG4gICAgICAgICAgICAvLyB3aGVuIHRoZXJlJ3MgYSBwcmV2aW91c2x5IGhpZ2hsaWdodGVkIG9iamVjdCwgcmVzZXQgdGhlIGhpZ2hsaWdodGluZ1xuICAgICAgICAgICAgaGlnaGxpZ2h0ZWRPYmplY3QubWF0ZXJpYWwuY29sb3Iuc2V0SGV4KERFRkFVTFRfQ09MT1IpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnRlcnNlY3Rpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgLy8gcmVzZXQgZGVmYXVsdCBjdXJzb3Igd2hlbiBubyBvYmplY3QgaXMgdW5kZXIgdGhlIGN1cnNvclxuICAgICAgICAgICAgbWFwLnNldE9wdGlvbnMoeyBkcmFnZ2FibGVDdXJzb3I6IG51bGwgfSk7XG4gICAgICAgICAgICBoaWdobGlnaHRlZE9iamVjdCA9IG51bGw7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gY2hhbmdlIHRoZSBjb2xvciBvZiB0aGUgb2JqZWN0IGFuZCB1cGRhdGUgdGhlIG1hcC1jdXJzb3IgdG8gaW5kaWNhdGVcbiAgICAgICAgLy8gdGhlIG9iamVjdCBpcyBjbGlja2FibGUuXG4gICAgICAgIGhpZ2hsaWdodGVkT2JqZWN0ID0gaW50ZXJzZWN0aW9uc1swXS5vYmplY3Q7XG4gICAgICAgIGhpZ2hsaWdodGVkT2JqZWN0Lm1hdGVyaWFsLmNvbG9yLnNldEhleChISUdITElHSFRfQ09MT1IpO1xuICAgICAgICBtYXAuc2V0T3B0aW9ucyh7IGRyYWdnYWJsZUN1cnNvcjogXCJwb2ludGVyXCIgfSk7XG4gICAgfTtcbn0pO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cmF5Y2FzdGluZy5qcy5tYXAiXSwibmFtZXMiOltdLCJtYXBwaW5n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
