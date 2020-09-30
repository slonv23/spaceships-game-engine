/**
 * @typedef {import('./SpaceFighterBaseController').default} SpaceFighterBaseController
 * @typedef {import('../../net/models/ObjectState').default} ObjectState
 * @typedef {import('../../net/models/ObjectAction').default} ObjectAction
 * @typedef {import('../../net/models/space-fighter/SpaceFighterState').default} SpaceFighterState
 * @typedef {import('../../net/models/space-fighter/SpaceFighterInput').default} SpaceFighterInput
 */

import SpaceFighterBaseController from "./SpaceFighterBaseController";

/**
 * @mixin SyncStateMixin
 * @this SpaceFighterBaseController
 */
export const syncStateMixin = {
    /**
     * @param {ObjectState} objectState
     */
    _sync(objectState) {
        /** @type {SpaceFighterState} */
        const spaceFighterState = objectState.spaceFighterState;
        this._syncObject(spaceFighterState);

        this.controlsQuaternion.copy(spaceFighterState.controlQuaternion);
        this.controlsRotQuaternion.copy(spaceFighterState.controlRotQuaternion);
        this.controlZInWorldCoords.set(0, 0, 1).applyQuaternion(this.controlsQuaternion);

        // calc rotation direction, yaw and pitch targets
        this.rotationDirection = SpaceFighterBaseController.calculateRotationDirection(this.gameObject.nx,
                                                                                       this.gameObject.ny,
                                                                                       spaceFighterState.angularVelocity.x,
                                                                                       spaceFighterState.angularVelocity.y);
        this.wYawTarget = this.controlX.clone()
            .applyQuaternion(this.controlsRotQuaternion)
            .applyQuaternion(this.controlsQuaternion)
            .dot(this.rotationDirection);
        this.wPitchTarget = this.controlY.clone()
            .applyQuaternion(this.controlsRotQuaternion)
            .applyQuaternion(this.controlsQuaternion)
            .dot(this.rotationDirection);
    },

    /**
     * @param {SpaceFighterState} objectState
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
     * @param {ObjectAction} objectAction
     */
    processInput(objectAction) {
        if (objectAction.spaceFighterInput) {
            this.handleInputAction(objectAction.spaceFighterInput);
        } else if (objectAction.spaceFighterOpenFire) {
            this.handleOpenFireAction(objectAction.frameIndex, objectAction.spaceFighterOpenFire);
        } else if (objectAction.spaceFighterDestroy) {
            // eslint-disable-next-line no-empty
        } else if (objectAction.spaceFighterStopFire) {
        }
    },

    /**
     * @param {SpaceFighterInput} inputAction
     */
    handleInputAction(inputAction) {
        this.gameObject.rollAngleBtwCurrentAndTargetOrientation += inputAction.rollAngle;
        // inputAction.rollAngle - this.rollAnglePrev //;this.rollAnglePrev - inputAction.rollAngle;
        this.rollAnglePrev = inputAction.rollAngle;
        this.wYawTarget = inputAction.yaw;
        this.wPitchTarget = inputAction.pitch;
        this.rotationSpeed = inputAction.rotationSpeed;
    },

};
