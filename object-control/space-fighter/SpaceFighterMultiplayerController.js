/**
 * @typedef {import('three')} THREE
 * @typedef {import('../../state/multiplayer-state-manager/MultiplayerStateManager').default} MultiplayerStateManager
 * @typedef {import('../../frontend/Renderer').default} Renderer
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

    /**
     * Ideally we should have interfaces here, e.g. PreservesState interface if controller need to save all previous states
     * but js not support interfaces
     * */
    static PRESERVES_STATE = true;

    prevStates;
    prevStatesCount;
    prevStateIndex;

    rollAnglePrev = 0;

    shootingActionPending = false;

    hasUnprocessedInputAction = false;

    nextActionId = 0;

    /**
     * @param {number} objectId
     * @param {Renderer} [renderer]
     */
    init(objectId, renderer) {
        super.init(objectId, renderer);
        //this._saveState();
        this.resetPrevStates();
    }

    resetPrevStates() {
        this.prevStates = Array(this.stateManager.packetPeriodFrames + 1);
            // +1 because we need one more additional state in case of reconciliation (applyActions() happens before update())
            // running update() before applyActions() will increase lag

        this.prevStatesCount = this.stateManager.packetPeriodFrames + 1;
        this.prevStateIndex = -1;
    }

    prevStatesInitialized() {
        return !!this.prevStates[0];
    }

    /**
     * @param {number} delta
     */
    updateControlParams(delta) {
        this._updateControlsQuaternion(delta);
        this._calculateRotationDirection();
        this._calculateNormalToRotationDirection(); // used by camera manager
        this._updateAngularVelocities();
    }

    updateObject(delta, frameIndex) {
        super.updateObject(delta, frameIndex);
        this._saveState(frameIndex);
    }

    sync(actualObjectState, futureObjectState, frameIndex) {
        this._sync(futureObjectState);
        if (!actualObjectState) {
            this._saveState(frameIndex);
        }
    }

    getImmediateActions() {
        if (this.shootingActionPending) {
            return [];
        }

        const actions = [];
        // TODO sometimes packets are dropped, handle this case
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
        if (this.hasUnprocessedInputAction) {
            this.logger.error('Cannot create new input action because unprocessed input action exist');
        }
        this.hasUnprocessedInputAction = true;
        const mousePos = this._calcMousePosInDimlessUnits();
        const wPitchTarget = -mousePos[1] * SpaceFighter.angularVelocityMax.y;
        const wYawTarget = mousePos[0] * SpaceFighter.angularVelocityMax.x;

        const currentSideAngle = this._calcSideAngle(wYawTarget, wPitchTarget);
        const targetSideAngle = this._calcTargetSideAngle(wYawTarget);
        const angleChange = targetSideAngle - currentSideAngle;
        const targetRollAngleWithCorrection = angleChange - this.gameObject.rollAngleBtwCurrentAndTargetOrientation;

        const inputAction = new SpaceFighterInput();
        inputAction.actionId = this.nextActionId++;
        inputAction.pitch = wPitchTarget;
        inputAction.yaw = wYawTarget;
        inputAction.rollAngle = targetRollAngleWithCorrection;
        //inputAction.rollAngle = -Math.PI / 6 - currentSideAngle;
        inputAction.rotationSpeed = this._determineRotationSpeed();

        return inputAction;
    }

    /**
     * @param {SpaceFighterInput} inputAction
     */
    handleInputAction(inputAction) {
        this.applyInputAction(inputAction);
        this.hasUnprocessedInputAction = false;
    }

    /**
     * @param {number} frameIndex
     * @param {SpaceFighterOpenFire} spaceFighterOpenFire
     */
    handleOpenFireAction(frameIndex, spaceFighterOpenFire) {
        this.shootingActionPending = false;
        this._launchNewProjectileSequence(spaceFighterOpenFire.projectileSeqId, this.getInitialDataForProjectiles);
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
        // current frame is not saved yet, but we need to select state preceding to state at (currentFrameIndex - PP) because action applied before game objects updated
        let stateIndexToLaunchFrom = this.prevStateIndex - this.stateManager.packetPeriodFrames;
        // mod operator
        stateIndexToLaunchFrom = ((stateIndexToLaunchFrom % this.prevStatesCount) + this.prevStatesCount) % this.prevStatesCount;
        const stateToLaunchProjectilesFrom = this.prevStates[stateIndexToLaunchFrom];

        const target = stateToLaunchProjectilesFrom.nz.clone()
            .multiplyScalar(-SpaceFighterBaseController.distanceToAimingPoint)
            .add(stateToLaunchProjectilesFrom.position);

        const positions = [
            this.leftProjectileOffset.clone().applyMatrix4(stateToLaunchProjectilesFrom.matrix),
            this.rightProjectileOffset.clone().applyMatrix4(stateToLaunchProjectilesFrom.matrix)
        ];

        return {target, positions};
    };

    restoreObjectState(frameIndex) {
        let stateToRestoreIndex = this.prevStateIndex - (this.stateManager.currentFrameIndex - frameIndex);
        // mod operator
        stateToRestoreIndex = ((stateToRestoreIndex % this.prevStatesCount) + this.prevStatesCount) % this.prevStatesCount;
        this.prevStateIndex = stateToRestoreIndex;

        const stateToRestore = this.prevStates[stateToRestoreIndex];

        this.gameObject.nx.copy(stateToRestore.nx);
        this.gameObject.ny.copy(stateToRestore.ny);
        this.gameObject.nz.copy(stateToRestore.nz);
        this.gameObject.position.copy(stateToRestore.position);
        this.gameObject.quaternion.copy(stateToRestore.quaternion);
        this.gameObject.rollAngleBtwCurrentAndTargetOrientation = stateToRestore.rollAngleBtwCurrentAndTargetOrientation;
        this.gameObject.angularVelocity.copy(stateToRestore.angularVelocity);
    }

    _saveState(frameIndex) {
        this.prevStateIndex = (this.prevStateIndex + 1) % this.prevStatesCount;
        this.prevStates[this.prevStateIndex] = this._serializeState(frameIndex/*this.stateManager.currentFrameIndex*/);
    }

    _serializeState(frameIndex) {
        return {
            frameIndex, // for debug purpose
            nx: this.gameObject.nx.clone(),
            ny: this.gameObject.ny.clone(),
            nz: this.gameObject.nz.clone(),
            position: this.gameObject.position.clone(),
            quaternion: this.gameObject.quaternion.clone(),
            rollAngleBtwCurrentAndTargetOrientation: this.gameObject.rollAngleBtwCurrentAndTargetOrientation,
            angularVelocity: this.gameObject.angularVelocity.clone(),

            matrix: this.gameObject.object3d.matrix.clone() // can be removed, we can calculate matrix using quaternion and position
        }
    }

}

Object.assign(SpaceFighterMultiplayerController.prototype, syncStateMixin);
