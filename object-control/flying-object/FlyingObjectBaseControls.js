import * as THREE from "three";

import AbstractControls from "../AbstractControls";
import {createQuaternionForRotation} from "../../util/math";

export default class FlyingObjectBaseControls extends AbstractControls {

    /** @type {FlyingObject} */
    gameObject;

    /** @type {THREE.Vector3} TODO change to Vector2 */
    controlX = new THREE.Vector3(1, 0, 0);
    /** @type {THREE.Vector3} */
    controlY = new THREE.Vector3(0, 1, 0);
    /** @type {THREE.Vector3} */
    controlZ = new THREE.Vector3(0, 0, 1);
    /** @type {THREE.Vector3} */
    controlZInWorldCoords = new THREE.Vector3();

    /** @type {THREE.Vector3} */
    rotationDirection;

    /** @type {THREE.Quaternion} used to convert control axes from local spaceship coordinate system (CS) to world CS */
    controlsQuaternion = new THREE.Quaternion();

    /** @type {number} */
    wPitchTarget = 0;
    /** @type {number} */
    wYawTarget = 0;
    /** @type {number} */
    rotationSpeed = 0;

    /**
     * @param {FlyingObject} gameObject
     */
    init(gameObject) {
        super.init(gameObject);
        this.controlZInWorldCoords = gameObject.nz;
    }

    _updateControlsQuaternion() {
        this.controlsQuaternion.multiplyQuaternions(createQuaternionForRotation(this.controlZInWorldCoords, this.gameObject.nz), this.controlsQuaternion);
        this.controlsQuaternion.normalize();
        this.controlZInWorldCoords.set(0, 0, 1).applyQuaternion(this.controlsQuaternion);
    }

    /**
     * @param {number} angle
     * @protected
     */
    _rotateControlAxes(angle) {
        this.controlX.add(this.controlY.multiplyScalar(angle));
        this.controlX.normalize();
        this.controlY.crossVectors(this.controlZ, this.controlX);
    }

    /**
     * @param {number} delta
     */
    updateControlParams(delta) {
        this._updateControlsQuaternion();
        if (this.rotationSpeed !== 0) {
            this._rotateControlAxes(this.rotationSpeed * delta);
        }
        this._updateAngularVelocities();
    }

    _updateAngularVelocities() {
        /** @type {THREE.Vector3} */
        this.rotationDirection = this.controlX.clone().multiplyScalar(this.wYawTarget).add(this.controlY.clone().multiplyScalar(this.wPitchTarget));
        this.rotationDirection.applyQuaternion(this.controlsQuaternion);

        this.gameObject.angularVelocity.y = this.gameObject.ny.dot(this.rotationDirection);
        this.gameObject.angularVelocity.x = this.gameObject.nx.dot(this.rotationDirection);
    }

}
