/**
 * @typedef {import('three')} THREE
 * @typedef {import('../../state/multiplayer-state-manager/MultiplayerStateManager').default} MultiplayerStateManager
 * @typedef {import('../../frontend/input/Mouse').default} Mouse
 * @typedef {import('../../frontend/input/Keyboard').default} Keyboard
 */

import SpaceFighterSingleplayerController from "./SpaceFighterSingleplayerController";
import {syncStateMixin} from "./_mixins";
import SpaceFighterInput from "../../net/models/space-fighter/SpaceFighterInput";
import SpaceFighter from "../../physics/object/SpaceFighter";
import SpaceFighterBaseController from "./SpaceFighterBaseController";
import SpaceFighterOpenFire from "../../net/models/space-fighter/SpaceFighterOpenFire";
import SpaceFighterStopFire from "../../net/models/space-fighter/SpaceFighterStopFire";

/**
 * @property {MultiplayerStateManager} stateManager
 */
export default class SpaceFighterMultiplayerController extends SpaceFighterSingleplayerController {

    prevStates = Array(this.stateManager.packetPeriodFrames);
    prevStateIndex = -1;

    rollAnglePrev = 0;

    shootingActionPending = false;

    /**
     * @param {number} delta
     */
    updateControlParams(delta) {
        this._updateControlsQuaternion(delta);
        this._calculateRotationDirection();
        this._calculateNormalToRotationDirection(); // used by camera manager
        this._updateAngularVelocities();

        this.updateProjectiles(delta);
        /*if (!this.activeProjectileSequence && this.mouse.lmbPressed) {
            this.launchProjectiles();
        } else if (this.activeProjectileSequence && !this.mouse.lmbPressed)  {
            this.stopFiring();
        }*/
    }

    update(delta) {
        this._savePrevState();
        this.gameObject.update(delta);
        this.updateControlParams(delta);
    }

    sync(actualObjectState, futureObjectState) {
        this._sync(futureObjectState);
    }

    getImmediateActions() {
        if (this.shootingActionPending) {
            return [];
        }

        const actions = [];
        if (!this.activeProjectileSequence && this.mouse.lmbPressed) {
            this.shootingActionPending = true;
            actions.push(new SpaceFighterOpenFire());
        } else if (this.activeProjectileSequence && !this.mouse.lmbPressed)  {
            this.shootingActionPending = true;
            actions.push(new SpaceFighterStopFire());
        }

        return actions;
    }

    getInputActionForCurrentState() {
        const mousePos = this._calcMousePosInDimlessUnits();
        const wPitchTarget =  -mousePos[1] * SpaceFighter.angularVelocityMax.y;
        const wYawTarget = mousePos[0] * SpaceFighter.angularVelocityMax.x;

        const currentSideAngle = this._calcSideAngle(wYawTarget, wPitchTarget);
        const targetSideAngle = this._calcTargetSideAngle(wYawTarget);
        const angleChange = targetSideAngle - currentSideAngle;
        const targetRollAngleWithCorrection = angleChange - this.gameObject.rollAngleBtwCurrentAndTargetOrientation;

        const inputAction = new SpaceFighterInput();
        inputAction.pitch = wPitchTarget;
        inputAction.yaw = wYawTarget;
        inputAction.rollAngle = targetRollAngleWithCorrection;
        inputAction.rotationSpeed = this._determineRotationSpeed();

        return inputAction;
    }

    /**
     * @param {number} frameIndex
     * @param {SpaceFighterOpenFire} spaceFighterOpenFire
     */
    // eslint-disable-next-line no-unused-vars
    handleOpenFireAction(frameIndex, spaceFighterOpenFire) {
        this.shootingActionPending = false;
        this._launchNewProjectileSequence(this.getInitialDataForProjectiles);
    }

    /**
     * @param {SpaceFighterStopFire} stopFireAction
     */
    // eslint-disable-next-line no-unused-vars
    handleStopFireAction(stopFireAction) {
        this.shootingActionPending = false;
        this.stopFiring();
    }

    getInitialDataForProjectiles = () => {
        let stateIndexToLaunchFrom = this.prevStateIndex - this.stateManager.packetPeriodFrames + 1; // plus one because current frame is not yet saved
        const packetPeriodFrames = this.stateManager.packetPeriodFrames;
        // mod operator
        stateIndexToLaunchFrom = ((stateIndexToLaunchFrom % packetPeriodFrames) + packetPeriodFrames) % packetPeriodFrames;
        const stateToLaunchProjectilesFrom = this.prevStates[stateIndexToLaunchFrom];
        console.log('Launch projectile from state: ' + stateToLaunchProjectilesFrom.frameIndex);

        const target = stateToLaunchProjectilesFrom.nz.clone()
            .multiplyScalar(-SpaceFighterBaseController.distanceToAimingPoint)
            .add(stateToLaunchProjectilesFrom.position);

        const positions = [
            this.leftProjectileOffset.clone().applyMatrix4(stateToLaunchProjectilesFrom.matrix),
            this.rightProjectileOffset.clone().applyMatrix4(stateToLaunchProjectilesFrom.matrix)
        ];

        return {target, positions};
    };

    _savePrevState() {
        this.prevStateIndex = (this.prevStateIndex + 1) % this.stateManager.packetPeriodFrames;
        this.prevStates[this.prevStateIndex] = this._serializeState(this.stateManager.currentFrameIndex - 1);
    }

    _serializeState(frameIndex) {
        return {
            frameIndex, // for debug purpose
            nz: this.gameObject.nz.clone(),
            position: this.gameObject.position.clone(),
            matrix: this.gameObject.object3d.matrix.clone()
        }
    }

}

Object.assign(SpaceFighterMultiplayerController.prototype, syncStateMixin);
