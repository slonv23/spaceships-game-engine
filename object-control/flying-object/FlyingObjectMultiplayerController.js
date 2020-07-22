/**
 * @typedef {import('three')} THREE
 * @typedef {import('../../frontend/input/Mouse').default} Mouse
 * @typedef {import('../../frontend/input/Keyboard').default} Keyboard
 */

import FlyingObjectSingleplayerController from "./FlyingObjectSingleplayerController";
import {syncStateMixin} from "./_mixins";
import InputAction from "../../net/models/InputAction";

export default class FlyingObjectMultiplayerController extends FlyingObjectSingleplayerController {

    rollAnglePrev = 0;

    /**
     * @param {number} delta
     */
    // eslint-disable-next-line no-unused-vars
    updateControlParams(delta) {
        // actually no update to control params made here, instead user input is captured
        // and some re-calculation needed for camera manager performed
        this._applyUserInputForRotation();
        this._applyUserInputForAngularVelocities();

        this._updateControlsQuaternion(delta);
        this._calculateRotationDirection();
        this._calculateNormalToRotationDirection();
    }

    update(delta) {
        this.gameObject.update(delta);
        this.updateControlParams(delta);
    }

    sync(actualObjectState, futureObjectState) {
        this._sync(futureObjectState);
    }

    getInputActionForCurrentState() {
        const currentSideAngle = this._calcSideAngle() * this._calcRotationDirection();
        const targetSideAngle = this._calcTargetSideAngle();
        const angleChange = targetSideAngle - currentSideAngle;

        const targetRollAngleWithCorrection = this.gameObject.rollAngleBtwCurrentAndTargetOrientation
                                               + this.rollAnglePrev - angleChange;
        console.log('targetSideAngle: ' + targetSideAngle + ' targetRollAngleWithCorrection: ' + targetRollAngleWithCorrection);

        const inputAction = new InputAction();
        inputAction.pitch = this.wYawTarget;
        inputAction.yaw = this.wPitchTarget;
        inputAction.rollAngle = 0; // targetRollAngleWithCorrection;
        inputAction.rotationSpeed = this.rotationSpeed;

        return inputAction;
    }

}

Object.assign(FlyingObjectMultiplayerController.prototype, syncStateMixin);
