/**
 * @typedef {import('../object-control/AbstractController').default} AbstractController
 * @typedef {import('../object-control/flying-object/RemoteFlyingObjectController').default} RemoteFlyingObjectController
 * @typedef {import('../object-control/flying-object/FlyingObjectMultiplayerController').default} FlyingObjectMultiplayerController
 * @typedef {import('../net/models/WorldState').default} WorldState
 * @typedef {import('../net/models/ObjectState').default} ObjectState
 * @typedef {import('../net/models/InputAction').default} InputAction
 * @typedef {import('../net/service/MultiplayerService').default} MultiplayerService
 * @typedef {import('../frontend/asset-management/AssetManager').default} AssetManager
 * @typedef {import('di-container-js').default} DiContainer
 */

import AuthoritativeStateManager from "./AuthoritativeStateManager";

export default class MultiplayerStateManager extends AuthoritativeStateManager {

    /** @type {MultiplayerService} */
    multiplayerService;

    /** @type {WorldState} */
    nextWorldState;
    /** @type {number} */
    nextFrameIndex = 0;

    /** @type {WorldState} */
    latestWorldState;
    /** @type {number} */
    latestFrameIndex;

    /** @type {number} */
    playerObjectId;
    /** @type {FlyingObjectMultiplayerController} */
    playerController;

    /** @type {number} */
    inputGatheringPeriodFrames;
    /** @type {number} */
    lastInputGatheringFrame = 0;

    /** @type {number} */
    packetPeriodFrames;
    /** @type {number} */
    frameLengthMs;

    constructor(diContainer, multiplayerService) {
        super(diContainer);
        this.multiplayerService = multiplayerService;
    }

    async postConstruct({packetPeriodFrames, inputGatheringPeriodFrames, fps}) {
        await super.postConstruct();
        this.packetPeriodFrames = packetPeriodFrames;
        this.inputGatheringPeriodFrames = inputGatheringPeriodFrames;
        this.frameLengthMs = 1000 / fps;
        // subscribe for world state updates
        this.multiplayerService.addEventListener('worldStateUpdate', this.handleInitialWorldStateUpdates);
    }

    update(delta) {
        if (this.latestWorldState) {
            // TODO maybe add some lag tolerance, because jitter can decrease and increase compensating each other
            // time to speed up, more recent state received
            this.currentFrameIndex = this.nextFrameIndex;
            this._syncWorldState(this.nextWorldState, this.latestWorldState);
            console.log('Sync with next world state ' + this.nextWorldState.frameIndex);
            console.log('Difference btw received and current frame index: ' + (this.nextWorldState.frameIndex - this.currentFrameIndex));

            this.nextWorldState = this.latestWorldState;
            this.nextFrameIndex = this.latestFrameIndex;
            this.latestWorldState = null;
            this._cleanup();
        } else if (++this.currentFrameIndex < this.nextFrameIndex) {
            //console.log("currentFrameIndex: " + this.currentFrameIndex + " nextFrameIndex: " + this.nextFrameIndex);
            this._applyInputActionsAndUpdateObjects(delta);
        } else {
            // else:
            //  this.currentFrameIndex === this.nextFrameIndex
            //  no more data about world state available, not possible to continue interpolation
            return;
        }

        if (this.currentFrameIndex - this.lastInputGatheringFrame >= this.inputGatheringPeriodFrames) {
            this.lastInputGatheringFrame = this.currentFrameIndex;
            const inputAction = this.playerController.getInputActionForCurrentState();

            // player object's state is one packet period (window) ahead, because we don't use interpolation on it
            // here we add one packet period length to currentFrameIndex (which is index of current interpolated frame)
            const frameOffset = this.currentFrameIndex + this.packetPeriodFrames;

            this.multiplayerService.scheduleInputAction(inputAction, frameOffset);

            // we should apply input action in the preceding "window" for player's object
            // because simulation for it runs without interpolation
            inputAction.frameIndex -= this.packetPeriodFrames;

            console.log(`Input action will be applied on frame #${inputAction.frameIndex}`);
            this.addInputAction(this.playerObjectId, inputAction);
        }
    }

    async _syncWorldState(actualWorldState, futureWorldState) {
        const actualWorldStateObjectsCount = actualWorldState.objectStates.length;
        const futureWorldStateObjectsCount = futureWorldState.objectStates.length;

        for (let i = 0, j = 0; i < actualWorldStateObjectsCount; i++) {
            const actualObjectState = actualWorldState.objectStates[i];
            let futureObjectState = null;

            const objectId = actualObjectState.id;
            // eslint-disable-next-line no-constant-condition
            while (true) {
                if (futureWorldState.objectStates[j].id === objectId) {
                    futureObjectState = futureWorldState.objectStates[j];
                    break;
                } else if (j === futureWorldStateObjectsCount || objectId < futureWorldStateObjectsCount[objectId]) {
                    break;
                }
                j++;
            }

            /** @type {RemoteFlyingObjectController} */
            let controller = this.controllersByObjectId[objectId];
            if (!controller || !controller.initialized) {
                controller = await this.createObject(objectId, actualObjectState.objectType);
            }

            console.log('Game object pos: ' + JSON.stringify(controller.gameObject.position));

            controller.sync(actualObjectState, futureObjectState);
        }
    }

    handleInitialWorldStateUpdates = (event) => {
        /** @type {WorldState} */
        const worldState = event.detail;

        if (!this.nextWorldState) {
            this.nextWorldState = worldState;
            console.log('Set next world state');
        } else {
            // game loop will start update objects when currentFrameIndex != nextFrameIndex
            this.nextFrameIndex = this.nextWorldState.frameIndex;
            this.lastInputGatheringFrame = this.nextFrameIndex;

            this.latestFrameIndex = worldState.frameIndex;
            this.latestWorldState = worldState;
            this.multiplayerService.removeEventListener('worldStateUpdate', this.handleInitialWorldStateUpdates);
            this.multiplayerService.addEventListener('worldStateUpdate', this.handleWorldStateUpdates)
        }
    };

    handleWorldStateUpdates = (event) => {
        /** @type {WorldState} */
        const worldState = event.detail;

        if (worldState.frameIndex <= this.nextFrameIndex) {
            console.log('Old state received, frame index ' + worldState.frameIndex);
            // old state received
            return;
        } else if (!this.latestWorldState) {
            console.log('Set latestWorldState');
            this.latestWorldState = worldState;
            this.latestFrameIndex = worldState.frameIndex;
        } else {
            console.log('Swap nextWorldState <-> latestWorldState');
            this.nextWorldState = this.latestWorldState;
            this.nextFrameIndex = this.latestFrameIndex;
            this.latestWorldState = worldState;
            this.latestFrameIndex = worldState.frameIndex;
        }

        const worldObjectsCount = worldState.objectStates.length;
        for (let i = 0; i < worldObjectsCount; i++) {
            /** @type {ObjectState} */
            const objectState = worldState.objectStates[i];
            if (this.playerObjectId === objectState.id) {
                // we should not re-process input actions of player object retransmitted back from server
                continue;
            }

            if (!this.inputActionsByObjectId[objectState.id]) {
                this.inputActionsByObjectId[objectState.id] = {};
            }

            for (let j = 0, actionsCount = objectState.actions.length; j < actionsCount; j++) {
                this.addInputAction(objectState.id, objectState.actions[j]);
            }
        }
    };

    addInputAction(objectId, action) {
        this.inputActionsByObjectId[objectId][action.frameIndex] = action;
    }

    /**
     * @param {number} playerObjectId
     * @param {RemoteFlyingObjectController} playerController
     */
    specifyPlayerControllerAndControlledObject(playerObjectId, playerController) {
        this.playerObjectId = playerObjectId;
        this.playerController = playerController;
        this.inputActionsByObjectId[playerObjectId] = {}
    }

}
