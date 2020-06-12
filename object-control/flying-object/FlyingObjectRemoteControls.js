/**
 * @typedef {import('three')} THREE
 * @typedef {import('../../net/models/ObjectState').default} ObjectState
 * @typedef {import('../../net/models/InputAction').default} InputAction
 */

import FlyingObjectBaseControls from "./FlyingObjectBaseControls";

export default class FlyingObjectRemoteControls extends FlyingObjectBaseControls {

    rollAnglePrev = 0;

    /**
     * @param {ObjectState} objectState
     */
    sync(objectState) {
        this.syncObject(objectState);

        this.controlsQuaternion.copy(objectState.controlQuaternion);
        this.controlX.copy(objectState.controlX);
        this.controlZInWorldCoords.set(0, 0, 1).applyQuaternion(this.controlsQuaternion);
        this.controlY.crossVectors(this.controlZ, this.controlX);

        // calc rotation direction, yaw and pitch targets
        const inverseQuaternion = this.controlsQuaternion.clone().inverse();
        const nx = this.gameObject.nx.clone();
        const ny = this.gameObject.ny.clone();
        this.rotationDirection = nx.multiplyScalar(objectState.angularVelocity.x).add(ny.multiplyScalar(objectState.angularVelocity.y));
        const rotDirectionInLocalCS = this.rotationDirection.clone().applyQuaternion(inverseQuaternion);
        this.wYawTarget = this.controlX.dot(rotDirectionInLocalCS);
        this.wPitchTarget = this.controlY.dot(rotDirectionInLocalCS);
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
        this.gameObject.rollAngleBtwCurrentAndTargetOrientation = objectState.rollAngleBtwCurrentAndTargetOrientation;
    }

    /**
     * @param {InputAction} inputAction
     */
    processInput(inputAction) {
        this.gameObject.rollAngleBtwCurrentAndTargetOrientation += this.rollAnglePrev - inputAction.rollAngle;
        this.rollAnglePrev = inputAction.rollAngle;
        this.wYawTarget = inputAction.yaw;
        this.wPitchTarget = inputAction.pitch;
        this.rotationSpeed = inputAction.rotationSpeed;
    }

    /**
     * @param {number} angle
     * @private
     */
    _rotateControlAxes(angle) {
        super._rotateControlAxes(angle);
        this.gameObject.rollAngleBtwCurrentAndTargetOrientation += angle;
    }

}

