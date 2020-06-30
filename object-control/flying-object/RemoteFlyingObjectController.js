/**
 * @typedef {import('three')} THREE
 * @typedef {import('../../net/models/ObjectState').default} ObjectState
 * @typedef {import('../../net/models/InputAction').default} InputAction
 */

import FlyingObjectBaseController from "./FlyingObjectBaseController";
import {syncStateMixin} from "./_mixins";

export default class RemoteFlyingObjectController extends FlyingObjectBaseController {

    rollAnglePrev = 0;

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

Object.assign(RemoteFlyingObjectController.prototype, syncStateMixin);
