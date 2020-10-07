/**
 * @typedef {import('three')} THREE
 * @typedef {import('../../net/models/space-fighter/SpaceFighterStopFire').default} SpaceFighterStopFire
 * @typedef {import('../../net/models/space-fighter/SpaceFighterOpenFire').default} SpaceFighterOpenFire
 */

import SpaceFighterBaseController from "./SpaceFighterBaseController";
import {syncStateMixin} from "./_mixins";

export default class RemoteSpaceFighterController extends SpaceFighterBaseController {

    static prevProjectileSeqId = 0;

    rollAnglePrev = 0;

    // eslint-disable-next-line no-unused-vars
    sync(actualObjectState, futureObjectState) {
        this._sync(actualObjectState);
    }

    /**
     * @param {number} frameIndex
     * @param {SpaceFighterOpenFire} spaceFighterOpenFire
     */
    handleOpenFireAction(frameIndex, spaceFighterOpenFire) {
        if (spaceFighterOpenFire.projectileSeqId == null) {
            // executed on server to generate unique projectile seq id
            spaceFighterOpenFire.projectileSeqId = ++RemoteSpaceFighterController.prevProjectileSeqId;
        }
        this._launchNewProjectileSequence(spaceFighterOpenFire.projectileSeqId, this.getInitialDataForProjectiles);
    }

    /**
     * @param {SpaceFighterStopFire} stopFireAction
     */
    handleStopFireAction(stopFireAction) {
        this.stopFiring();
    }

}

Object.assign(RemoteSpaceFighterController.prototype, syncStateMixin);
