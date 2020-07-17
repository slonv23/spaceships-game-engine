/**
 * @typedef {import('three')} THREE
 * @typedef {import('../../net/models/ObjectState').default} ObjectState
 * @typedef {import('../../net/models/InputAction').default} InputAction
 */

import FlyingObjectBaseController from "./FlyingObjectBaseController";
import {syncStateMixin} from "./_mixins";

export default class RemoteFlyingObjectController extends FlyingObjectBaseController {

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

Object.assign(RemoteFlyingObjectController.prototype, syncStateMixin);
