/**
 * @typedef {import('three')} THREE
 * @typedef {import('../../frontend/input/Mouse').default} Mouse
 * @typedef {import('../../frontend/input/Keyboard').default} Keyboard
 */

import SpaceFighterSingleplayerController from "./SpaceFighterSingleplayerController";
import {syncStateMixin} from "./_mixins";
import SpaceFighterInput from "../../net/models/space-fighter/SpaceFighterInput";
import SpaceFighter from "../../physics/object/SpaceFighter";

export default class SpaceFighterMultiplayerController extends SpaceFighterSingleplayerController {

    rollAnglePrev = 0;

    /**
     * @param {number} delta
     */
    async updateControlParams(delta) {
        this._updateControlsQuaternion(delta);
        this._calculateRotationDirection();
        this._calculateNormalToRotationDirection(); // used by camera manager
        this._updateAngularVelocities();

        this.updateProjectiles(delta);
        if (!this.activeProjectileSequence && this.mouse.lmbPressed) {
            await this.launchProjectiles();
        } else if (this.activeProjectileSequence && !this.mouse.lmbPressed)  {
            this.stopFiring();
        }
    }

    async update(delta) {
        this.gameObject.update(delta);
        await this.updateControlParams(delta);
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

        const inputAction = new SpaceFighterInput();
        const mousePos = this._calcMousePosInDimlessUnits();
        inputAction.pitch = -mousePos[1] * SpaceFighter.angularVelocityMax.y;
        inputAction.yaw = mousePos[0] * SpaceFighter.angularVelocityMax.x;
        // TODO:
        inputAction.rollAngle = 0; // targetRollAngleWithCorrection;
        inputAction.rotationSpeed = 0; // this.rotationSpeed;

        return inputAction;
    }

}

Object.assign(SpaceFighterMultiplayerController.prototype, syncStateMixin);
