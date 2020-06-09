/**
 * @typedef {import('three')} THREE
 * @typedef {import('../../frontend/input/Mouse').default} Mouse
 * @typedef {import('../../frontend/input/Keyboard').default} Keyboard
 * @typedef {import('../../frontend/Renderer').default} Renderer
 */

import * as THREE from "three";
import FlyingObject from "../../physics/object/FlyingObject";
import browserKeycodes from "../../util/browser-keycodes";
import FlyingObjectBaseControls from './FlyingObjectBaseControls';

export default class FlyingObjectControls extends FlyingObjectBaseControls {

    /** @type {Mouse} */
    mouse;

    /** @type {Keyboard} */
    keyboard;

    /** @type {Renderer} */
    renderer;

    /** user can change yaw and pitch by moving cursor to desired direction,
     * but only in specified limits */
    controlCircleRadius;
    controlCircleRadiusSq;

    /** @type {THREE.Vector3} */
    normalToRotationDirection;

     /**
      * @param {Mouse} mouseInterface
      * @param {Keyboard} keyboardInterface
      */
    constructor(mouseInterface, keyboardInterface) {
        super();

        this.mouse = mouseInterface;
        this.keyboard = keyboardInterface;

        this.controlCircleRadius = Math.min(window.innerWidth, window.innerHeight) * 0.2;
        this.controlCircleRadiusSq = this.controlCircleRadius ** 2;
    }

    postConstruct({enableAxesHelper} = {}) {
        this.enableAxesHelper = enableAxesHelper;
    }

    /**
     * @param {FlyingObject} gameObject
     * @param {Renderer} renderer
     */
    init(gameObject, renderer) {
        super.init(gameObject);
        this.renderer = renderer;
        this.controlZInWorldCoords = gameObject.nz;

        /*if (this.enableAxesHelper) {
            const size = 8;
            this._initializeAxesHelper(size);
            this._onUpdated = () => {
                this._updateAxesHelper(size);
            };
        }*/
    }

    /**
     * @param {number} delta
     */
    updateControlParams(delta) {
        this._applyUserInputForRotation();

        super.updateControlParams(delta);

        //this._updateControlAxes(delta);
        this._updateYawAndPitchVelocities(delta);
        //this._onUpdated();
    }

    _applyUserInputForRotation() {
        const pressedKey = this.keyboard.getFirstPressedKey();

        this.rotationSpeed = 0;
        if (pressedKey === browserKeycodes.ARROW_LEFT) {
            this.rotationSpeed = 0.0006;
        } else if (pressedKey === browserKeycodes.ARROW_RIGHT) {
            this.rotationSpeed = -0.0006;
        }
    }

    // eslint-disable-next-line no-unused-vars
    _updateYawAndPitchVelocities(delta) {
        const mousePos = this._calcMousePosInDimlessUnits();

        this.wPitchTarget = -mousePos[1] * FlyingObject.angularVelocityMax.y;
        this.wYawTarget = mousePos[0] * FlyingObject.angularVelocityMax.x;

        // controlX, controlY and gameObject.ny, gameObject.nx are lie in the same plane
        /** @type {THREE.Vector3} */
        this.rotationDirection = this.controlX.clone().multiplyScalar(this.wYawTarget).add(this.controlY.clone().multiplyScalar(this.wPitchTarget));
        this.rotationDirection.applyQuaternion(this.controlsQuaternion);
        this.normalToRotationDirection = this.gameObject.nz.clone().cross(this.rotationDirection);

        this.gameObject.angularVelocity.y = this.gameObject.ny.dot(this.rotationDirection);
        this.gameObject.angularVelocity.x = this.gameObject.nx.dot(this.rotationDirection);

        const currentSideAngle = this._calcSideAngle() * this._calcRotationDirection();
        const targetSideAngle = this._calcTargetSideAngle();
        const angleChange = -targetSideAngle - currentSideAngle;
        this.gameObject.rollOnAngle(angleChange);
    }

    _calcTargetSideAngle() {
        return this.wYawTarget / FlyingObject.angularVelocityMax.x * Math.PI / 6;
    }

    _calcSideAngle() {
        const nx = this.gameObject.nx.clone();
        const ny = this.gameObject.ny.clone();
        this.rotationDirectionForNonRotated = nx.multiplyScalar(this.wYawTarget).add(ny.multiplyScalar(this.wPitchTarget));

        return this.rotationDirectionForNonRotated.angleTo(this.rotationDirection);
    }

    _calcRotationDirection() {
        const directionSign = Math.sign(this.normalToRotationDirection.dot(this.rotationDirectionForNonRotated));
        return directionSign < 0 ? -1 : 1;
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

        this.renderer.scene.add(new THREE.LineSegments(geometry, material));
    }

    _updateAxesHelper(size) {
        size = size || 1;

        const objectPosX = this.gameObject.position.x,
              objectPosY = this.gameObject.position.y,
              objectPosZ = this.gameObject.position.z;

        const vertices = [
            objectPosX, objectPosY, objectPosZ,    this.controlX.x * size, this.controlX.y * size, this.controlX.z * size,
            objectPosX, objectPosY, objectPosZ,    this.controlY.x * size, this.controlY.y * size, this.controlY.z * size,
            objectPosX, objectPosY, objectPosZ,    this.controlZ.x * size, this.controlZ.y * size, this.controlZ.z * size,
        ];

        this.axesHelperBuffer.set(vertices);
        this.helperGeometry.attributes['position'].needsUpdate = true;
    }

}
