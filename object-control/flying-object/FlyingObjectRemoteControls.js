/**
 * @typedef {import('../../net/models/ObjectState').default} ObjectState
 */

import FlyingObjectBaseControls from "./FlyingObjectBaseControls";
import ObjectState from '../../net/models/ObjectState';

export default class FlyingObjectRemoteControls extends FlyingObjectBaseControls {

    /**
     * @param {ObjectState} objectState
     */
    sync(objectState) {
        this.syncObject(objectState);

        this.controlsQuaternion.copy(objectState.controlQuaternion);
        this.controlX.copy(objectState.controlX);
        this.controlZInWorldCoords.set(0, 0, 1).applyQuaternion(this.controlsQuaternion);
        this.controlY.crossVectors(this.controlX, this.controlZ);

        const inverseQuaternion = this.controlsQuaternion.inverse();

        // calc rotation direction
        const yaw = objectState.angularVelocity.x;
        const pitch = objectState.angularVelocity.y;
        this.rotationDirection = this.controlX.clone().multiplyScalar(yaw).add(this.controlY.clone().multiplyScalar(pitch)).applyQuaternion(inverseQuaternion);
        this.wYawTarget = this.controlX.dot(this.rotationDirection);
        this.wPitchTarget = this.controlY.dot(this.rotationDirection);
        //this.normalToRotationDirection = this.gameObject.nz.clone().cross(this.rotationDirection);
    }

    /**
     * @param {ObjectState} objectState
     */
    syncObject(objectState) {
        this.gameObject.quaternion.copy(objectState.quaternion);
        this.gameObject.position = objectState.position;
        this.gameObject.velocity.z = objectState.speed;
        this.gameObject.angularVelocity.copy(objectState.angularVelocity);
        this.gameObject.angularAcceleration.copy(objectState.angularAcceleration);
        this.gameObject.rollAngleTarget = objectState.rollAngleTarget;
    }

    /**
     * @param angle
     * @private
     */
    _rotateControlAxes(angle) {
        super._updateControlsQuaternion(angle);
        this.gameObject.rollAngleTarget += angle;
    }

    /********** TESTING **********/

    /**
     * @param {Mouse} mouseInterface
     * @param {Keyboard} keyboardInterface
     */
    constructor(mouseInterface, keyboardInterface) {
        super();

        this.mouse = mouseInterface;
        this.keyboard = keyboardInterface;
    }

    /**
     * @param {number} delta
     */
    updateControlParams(delta) {
        const objectState = new ObjectState();
        objectState.speed = this.gameObject.velocity.z;
        objectState.angularVelocity = this.gameObject.angularVelocity;
        objectState.angularAcceleration = this.gameObject.angularAcceleration;
        objectState.position = this.gameObject.position;
        objectState.quaternion = this.gameObject.quaternion;
        // objectState.acceleration = ...;

        // objectState.controlQuaternion = ...;
    }

}
