/**
 * @typedef {import('three')} THREE
 * @typedef {import('../../input/Mouse').default} Mouse
 * @typedef {import('../../input/Keyboard').default} Keyboard
 * @typedef {import('./CameraManager').default} CameraManager
 * @typedef {import('../../../Engine').default} Engine
 */

import * as THREE from "three";
import FlyingObject from "../../../physics/object/FlyingObject";
import browserKeycodes from "../../../util/browser-keycodes";
import AbstractControls from "../AbstractControls";
import {createQuaternionForRotation} from "../../../util/math";

export default class FlyingObjectControls extends AbstractControls {

    /** determines how fast yaw and pitch speeds are converge to their target values
     * target values are calculated based on current mouse position */
    static angularVelocityConvergeSpeed = 0.000001;

    /** @type {Engine} */
    engine;

    /** @type {Mouse} */
    mouse;

    /** @type {Keyboard} */
    keyboard;

    /** @type {FlyingObject} */
    gameObject

    /** @type {THREE.Vector3} */
    gameObjectPrevDirection;

    /** user can change yaw and pitch by moving cursor to desired direction,
     * but only in specified limits */
    controlCircleRadius;
    controlCircleRadiusSq;

    /** @type {THREE.Vector3} */
    controlX = new THREE.Vector3();
    /** @type {THREE.Vector3} */
    controlY = new THREE.Vector3();
    /** @type {THREE.Vector3} */
    controlZ = new THREE.Vector3();

    /** @type {THREE.Quaternion} */
    controlQuaternion = new THREE.Quaternion();

    /** @type {CameraManager} */
    cameraManager;

    /** @type {number} */
    wPitchTarget = 0;
    /** @type {number} */
    wYawTarget = 0;

    rotationSpeed = 0;

     /**
      * @param {Mouse} mouseInterface 
      * @param {Keyboard} keyboardInterface
      * @param {CameraManager} flyingObjectCameraManager
      */
    constructor(mouseInterface, keyboardInterface, flyingObjectCameraManager) {
        super();

        this.mouse = mouseInterface;
        this.keyboard = keyboardInterface;
        this.cameraManager = flyingObjectCameraManager;

        this.controlCircleRadius = Math.min(window.innerWidth, window.innerHeight) * 0.2;
        this.controlCircleRadiusSq = this.controlCircleRadius ** 2;
    }

    postConstruct({enableAxesHelper} = {}) {
        this.enableAxesHelper = enableAxesHelper;
    }

    /**
     * @param {THREE.PerspectiveCamera} camera 
     * @param {FlyingObject} gameObject
     * @param {Engine} engine
     */
    init(camera, gameObject, engine) {
        super.init(camera, gameObject);
        this.cameraManager.init(camera, gameObject, this);
        this.controlX = gameObject.nx;
        this.controlY = gameObject.ny;
        this.controlZ = gameObject.nz;
        this.engine = engine;

        if (this.enableAxesHelper) {
            const size = 8;
            this._initializeAxesHelper(size);
            this._onUpdated = () => {
                this._updateAxesHelper(size);
            };
        }
    }

    /**
     * @param {number} delta
     */
    updateCameraAndControlParams(delta) {
        this._updateControlAxes(delta);
        this._updateYawAndPitchVelocities(delta);
        // TODO move next call to other component because this class will be also used on backend
        this.cameraManager.updateCamera(this.wYawTarget, this.wPitchTarget, delta);

        this.camera.matrixWorldInverse.getInverse(this.camera.matrixWorld);

        this._onUpdated();
    }

    _onUpdated() {}

    _updateControlAxes(delta) {
        this._adjustControlsToObjectDirection();
        this._applyUserInputForRotation(delta);

        this.controlQuaternion.normalize();
        this.controlX.set(1, 0, 0).applyQuaternion(this.controlQuaternion);
        this.controlY.set(0, 1, 0).applyQuaternion(this.controlQuaternion);
        this.controlZ.set(0, 0, 1).applyQuaternion(this.controlQuaternion);
    }

    _adjustControlsToObjectDirection() {
        // No need to update this, make control axes be represented in spaceship coordinates
        this.controlQuaternion.multiplyQuaternions(createQuaternionForRotation(this.controlZ, this.gameObject.nz), this.controlQuaternion);
    }

    _applyUserInputForRotation(delta) {
        const pressedKey = this.keyboard.getFirstPressedKey();

        this.rotationSpeed = 0;
        if (pressedKey === browserKeycodes.ARROW_LEFT) {
            this.rotationSpeed =  0.0006;
        } else if (pressedKey === browserKeycodes.ARROW_RIGHT) {
            this.rotationSpeed = -0.0006;
        } else {
            return;
        }

        let multiplier = 0.5 * delta;
        this.controlQuaternion.multiply(new THREE.Quaternion(0, 0, this.rotationSpeed * multiplier, 1));
    }

    // eslint-disable-next-line no-unused-vars
    _updateYawAndPitchVelocities(delta) {
        const mousePos = this._calcMousePosInDimlessUnits(),
              wPitchTarget = -mousePos[1] * FlyingObject.angularVelocityMax.y,
              wYawTarget = mousePos[0] * FlyingObject.angularVelocityMax.x;

        this.wPitchTarget = wPitchTarget;
        this.wYawTarget = wYawTarget;

        const currentSideAngle = this._calcSideAngle() * this._calcRotationDirection();
        const targetSideAngle = this._calcTargetSideAngle();
        const angleChange = -targetSideAngle - currentSideAngle;
        this.gameObject.rollOnAngle(angleChange);

        // controlX, controlY and gameObject.ny, gameObject.nx are lie in the same plane
        const rotationDirection = this.controlX.clone().multiplyScalar(this.wYawTarget).add(this.controlY.clone().multiplyScalar(this.wPitchTarget));

        let wPitchNew = this.gameObject.ny.dot(rotationDirection),
            wYawNew = this.gameObject.nx.dot(rotationDirection);

        this.gameObject.angularVelocity.y = wPitchNew;
        this.gameObject.angularVelocity.x = wYawNew;
    }

    _calcTargetSideAngle() {
        return this.wYawTarget / FlyingObject.angularVelocityMax.x * Math.PI / 6;
    }

    _calcSideAngle() {
        return this.gameObject.nx.angleTo(this.controlX);
    }

    _calcRotationDirection() {
        let direction = Math.sign(this.gameObject.nx.dot(this.controlY));
        return direction < 0 ? -1 : 1;
    }

    /**
     * @returns {number[]} mouse position where x and y є [-1 1]
     */
    _calcMousePosInDimlessUnits() {
        const mousePos = this.mouse.position.slice();

        // circle bounded
        var distFromCenterSq = mousePos[0]*mousePos[0] + mousePos[1]*mousePos[1];
        if (distFromCenterSq > this.controlCircleRadiusSq) {
            var dimlessDist = this.controlCircleRadius / Math.sqrt(distFromCenterSq);
            mousePos[0] = dimlessDist * mousePos[0];
            mousePos[1] = dimlessDist * mousePos[1];
        }
        mousePos[0] /= this.controlCircleRadius;
        mousePos[1] /= this.controlCircleRadius;

        return mousePos;
    }

    _initializeAxesHelper(size) {
        size = size || 1;
    
        const vertices = [
            0, 0, 0,    size, 0, 0,
            0, 0, 0,    0, size, 0,
            0, 0, 0,    0, 0, size
        ];
    
        const colors = [
            1, 0, 0,    1, 0.6, 0,
            0, 1, 0,    0.6, 1, 0,
            0, 0, 1,    0, 0.6, 1
        ];
    
        var geometry = new THREE.BufferGeometry();
        this.helperGeometry = geometry;

        this.axesHelperBuffer = new THREE.Float32BufferAttribute(vertices, 3);
        geometry.setAttribute('position', this.axesHelperBuffer);
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
        const material = new THREE.LineBasicMaterial({vertexColors: THREE.VertexColors});

        this.engine.scene.add(new THREE.LineSegments(geometry, material));
    }

    _updateAxesHelper(size) {
        size = size || 1;

        const objectPosX = this.gameObject.object3d.position.x,
              objectPosY = this.gameObject.object3d.position.y,
              objectPosZ = this.gameObject.object3d.position.z;

        const vertices = [
            objectPosX, objectPosY, objectPosZ,    this.controlX.x * size, this.controlX.y * size, this.controlX.z * size,
            objectPosX, objectPosY, objectPosZ,    this.controlY.x * size, this.controlY.y * size, this.controlY.z * size,
            objectPosX, objectPosY, objectPosZ,    this.controlZ.x * size, this.controlZ.y * size, this.controlZ.z * size,
        ];

        this.axesHelperBuffer.set(vertices);
        this.helperGeometry.attributes['position'].needsUpdate = true; 
    }

}
