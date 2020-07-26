/**
 * @typedef {import('../../net/models/ObjectState').default} ObjectState
 * @typedef {import('../../net/models/InputAction').default} InputAction
 */

import FlyingObjectBaseController from "./FlyingObjectBaseController";

export const syncStateMixin = {
    /**
     * @param {ObjectState} objectState
     */
    _sync(objectState) {
        this._syncObject(objectState);

        this.controlsQuaternion.copy(objectState.controlQuaternion);
        this.controlZInWorldCoords.set(0, 0, 1).applyQuaternion(this.controlsQuaternion);

        // calc rotation direction, yaw and pitch targets
        this.rotationDirection = FlyingObjectBaseController.calculateRotationDirection(this.gameObject.nx, this.gameObject.ny,
                                                                                       objectState.angularVelocity.x, objectState.angularVelocity.y);
        this.wYawTarget = this.controlX.clone().applyQuaternion(this.controlsQuaternion).dot(this.rotationDirection);
        this.wPitchTarget = this.controlY.clone().applyQuaternion(this.controlsQuaternion).dot(this.rotationDirection);
    },

    /**
     * @param {ObjectState} objectState
     * @protected
     */
    _syncObject(objectState) {
        const lastPosDiffNewPos = this.gameObject.position.distanceTo(this.gameObject.position);
        if (lastPosDiffNewPos !== 0) {
            this.logger.debug(`Current and new object positions diverge on ${lastPosDiffNewPos}`);
        }

        this.gameObject.quaternion.copy(objectState.quaternion);
        this.gameObject.position = objectState.position;
        this.gameObject.object3d.position.copy(objectState.position);
        this.gameObject.object3d.matrix.setPosition(objectState.position);
        this.gameObject.velocity.z = objectState.speed;
        this.gameObject.angularVelocity.copy(objectState.angularVelocity);
        //this.gameObject.angularAcceleration.copy(objectState.angularAcceleration);
        this.gameObject.rollAngleBtwCurrentAndTargetOrientation = objectState.rollAngleBtwCurrentAndTargetOrientation;

        this.gameObject.updateTransformationMatrix();
    },

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
};
