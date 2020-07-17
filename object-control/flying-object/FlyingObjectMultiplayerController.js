/**
 * @typedef {import('three')} THREE
 * @typedef {import('../../frontend/input/Mouse').default} Mouse
 * @typedef {import('../../frontend/input/Keyboard').default} Keyboard
 * @typedef {import('../../net/models/InputAction').default} InputAction
 */

import FlyingObjectSingleplayerController from "./FlyingObjectSingleplayerController";
import {syncStateMixin} from "./_mixins";

export default class FlyingObjectMultiplayerController extends FlyingObjectSingleplayerController {

    rollAnglePrev = 0;

    /**
     * @param {number} delta
     */
    updateControlParams(delta) {
        return;
        this._applyUserInputForRotation();
        this._applyUserInputForAngularVelocities();

        super.updateControlParams(delta);

        this._correctObjectRollAngle();
    }

    update(delta) {
        this.gameObject.update(delta);
        //this.updateControlParams(delta);
    }

    sync(actualObjectState, futureObjectState) {
        this._sync(futureObjectState);
    }

    _applyUserInputForRotation() {
        const pressedKey = this.keyboard.getFirstPressedKey();

        /*this.rotationSpeed = 0;
        if (pressedKey === browserKeycodes.ARROW_LEFT) {
            this.rotationSpeed = 0.0006;
        } else if (pressedKey === browserKeycodes.ARROW_RIGHT) {
            this.rotationSpeed = -0.0006;
        }*/
    }

    _applyUserInputForAngularVelocities() {
        const mousePos = this._calcMousePosInDimlessUnits();
        //this.wPitchTarget = -mousePos[1] * FlyingObject.angularVelocityMax.y;
        //this.wYawTarget = mousePos[0] * FlyingObject.angularVelocityMax.x;
    }

    _correctObjectRollAngle() {
        /*this.normalToRotationDirection = this.gameObject.nz.clone().cross(this.rotationDirection);
        const currentSideAngle = this._calcSideAngle() * this._calcRotationDirection();
        const targetSideAngle = this._calcTargetSideAngle();
        const angleChange = -targetSideAngle - currentSideAngle;
        this.gameObject.rollOnAngle(angleChange);*/
    }

}

Object.assign(FlyingObjectMultiplayerController.prototype, syncStateMixin);
