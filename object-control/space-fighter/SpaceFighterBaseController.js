/**
 * @typedef {import('../../physics/object/SpaceFighter').default} SpaceFighter
 * @typedef {import('../../logging/AbstractLogger').default} AbstractLogger
 */
import * as THREE from "three";

import {createQuaternionForRotation} from "../../util/math";
import AbstractObjectController from "../AbstractObjectController";

export default class SpaceFighterBaseController extends AbstractObjectController {

    /** @type {AbstractLogger} */
    logger;

    /** @type {SpaceFighter} */
    gameObject;

    /** @type {THREE.Vector3} TODO maybe change to Vector2 since z component always zero */
    controlX = new THREE.Vector3(1, 0, 0);
    /** @type {THREE.Vector3} */
    controlY = new THREE.Vector3(0, 1, 0);
    /** @type {THREE.Vector3} */
    controlZ = new THREE.Vector3(0, 0, 1);
    /** @type {THREE.Vector3} */
    controlZInWorldCoords = new THREE.Vector3();

    /** @type {THREE.Vector3} */
    rotationDirection = new THREE.Vector3();

    /** @type {THREE.Quaternion} used to convert control axes from local spaceship coordinate system (CS) to world CS */
    controlsQuaternion = new THREE.Quaternion();

    /** @type {number} */
    wPitchTarget = 0;
    /** @type {number} */
    wYawTarget = 0;
    /** @type {number} */
    rotationSpeed = 0;

    static dependencies() {
        return ['logger', ...AbstractObjectController.dependencies()];
    }

    static calculateRotationDirection(nx, ny, yaw, pitch) {
        return nx.clone().multiplyScalar(yaw).add(ny.clone().multiplyScalar(pitch));
    }

    constructor(logger, ...args) {
        super(...args);
        this.logger = logger;
    }

    /**
     * @param {number} objectId
     */
    init(objectId) {
        super.init(objectId);
        this.controlZInWorldCoords = this.gameObject.nz;
    }

    _updateControlsQuaternion(delta) {
        this.controlsQuaternion.multiplyQuaternions(createQuaternionForRotation(this.controlZInWorldCoords, this.gameObject.nz), this.controlsQuaternion);
        if (this.rotationSpeed !== 0) {
            this.controlsQuaternion.multiply(new THREE.Quaternion(0, 0, this.rotationSpeed * delta * 0.5, 1));
        }
        this.controlsQuaternion.normalize();
        this.controlZInWorldCoords.set(0, 0, 1).applyQuaternion(this.controlsQuaternion);
    }

    /**
     * @param {number} delta
     */
    updateControlParams(delta) {
        this._updateControlsQuaternion(delta);
        this._calculateRotationDirection();
        this._calculateNormalToRotationDirection(); // used by camera manager
        this._updateAngularVelocities();
    }

    _calculateRotationDirection() {
        /** @type {THREE.Vector3} */
        this.rotationDirection = SpaceFighterBaseController.calculateRotationDirection(this.controlX, this.controlY,
            this.wYawTarget, this.wPitchTarget);
        //this.rotationDirection = this.controlX.clone().multiplyScalar(this.wYawTarget).add(this.controlY.clone().multiplyScalar(this.wPitchTarget));
        this.rotationDirection.applyQuaternion(this.controlsQuaternion);
    }

    _calculateNormalToRotationDirection() {
        this.normalToRotationDirection = this.gameObject.nz.clone().cross(this.rotationDirection);
    }

    _updateAngularVelocities() {
        this.gameObject.angularVelocity.y = this.gameObject.ny.dot(this.rotationDirection);
        this.gameObject.angularVelocity.x = this.gameObject.nx.dot(this.rotationDirection);
    }

}
