/**
 * @typedef {import('../../net/models/ObjectState').default} ObjectState
 */

import FlyingObjectBaseController from "./FlyingObjectBaseController";

export const syncStateMixin = {
    /**
     * @param {ObjectState} objectState
     */
    sync(objectState) {
        this._syncObject(objectState);

        this.controlsQuaternion.copy(objectState.controlQuaternion);
        this.controlX.copy(objectState.controlX);
        this.controlZInWorldCoords.set(0, 0, 1).applyQuaternion(this.controlsQuaternion);
        this.controlY.crossVectors(this.controlZ, this.controlX);

        // calc rotation direction, yaw and pitch targets
        const inverseQuaternion = this.controlsQuaternion.clone().inverse();
        //const nx = this.gameObject.nx.clone();
        //const ny = this.gameObject.ny.clone();
        //this.rotationDirection = nx.multiplyScalar(objectState.angularVelocity.x).add(ny.multiplyScalar(objectState.angularVelocity.y));
        this.rotationDirection = FlyingObjectBaseController.calculateRotationDirection(this.gameObject.nx, this.gameObject.ny,
                                                                                       objectState.angularVelocity.x, objectState.angularVelocity.y);
        const rotDirectionInLocalCS = this.rotationDirection.clone().applyQuaternion(inverseQuaternion);
        this.wYawTarget = this.controlX.dot(rotDirectionInLocalCS);
        this.wPitchTarget = this.controlY.dot(rotDirectionInLocalCS);
    },

    /**
     * @param {ObjectState} objectState
     * @protected
     */
    _syncObject(objectState) {
        this.gameObject.quaternion.copy(objectState.quaternion);
        this.gameObject.position = objectState.position;
        this.gameObject.object3d.position.copy(objectState.position);
        this.gameObject.object3d.matrix.setPosition(objectState.position);
        this.gameObject.velocity.z = objectState.speed;
        this.gameObject.angularVelocity.copy(objectState.angularVelocity);
        this.gameObject.angularAcceleration.copy(objectState.angularAcceleration);
        this.gameObject.rollAngleBtwCurrentAndTargetOrientation = objectState.rollAngleBtwCurrentAndTargetOrientation;
    }
};
