/**
 * @typedef {import('three')} THREE
 */

import SpaceFighterBaseController from "./SpaceFighterBaseController";
import {syncStateMixin} from "./_mixins";

export default class RemoteSpaceFighterController extends SpaceFighterBaseController {

    rollAnglePrev = 0;

    // eslint-disable-next-line no-unused-vars
    sync(actualObjectState, futureObjectState) {
        this._sync(actualObjectState);
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

Object.assign(RemoteSpaceFighterController.prototype, syncStateMixin);
