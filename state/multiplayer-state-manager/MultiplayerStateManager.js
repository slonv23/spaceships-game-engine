/**
 * @typedef {import('../../object-control/AbstractController').default} AbstractController
 * @typedef {import('../../object-control/space-fighter/RemoteSpaceFighterController').default} RemoteSpaceFighterController
 * @typedef {import('../../object-control/space-fighter/SpaceFighterMultiplayerController').default} SpaceFighterMultiplayerController
 * @typedef {import('../../net/models/WorldState').default} WorldState
 * @typedef {import('../../net/models/ObjectState').default} SpaceFighterState
 * @typedef {import('../../net/models/ObjectAction').default} ObjectAction
 * @typedef {import('../../net/service/multiplayer-service/MultiplayerService').default} MultiplayerService
 * @typedef {import('../../asset-management/AssetManager').default} AssetManager
 * @typedef {import('../../logging/AbstractLogger').default} AbstractLogger
 * @typedef {import('di-container-js').default} DiContainer
 */

import AuthoritativeStateManager from "../authoritative-state-manager/AuthoritativeStateManager";
import SpaceFighterInput from "../../net/models/space-fighter/SpaceFighterInput";

export default class MultiplayerStateManager extends AuthoritativeStateManager {

    /** @type {MultiplayerService} */
    multiplayerService;

    /** @type {AbstractLogger} */
    logger;

    /** @type {WorldState} */
    nextWorldState;
    /** @type {number} */
    nextFrameIndex = 0;

    /** @type {WorldState} */
    latestWorldState;
    /** @type {SpaceFighterState} */
    latestPlayerGameObjectState;
    /** @type {number} */
    latestFrameIndex;

    /** @type {number} */
    playerObjectId;
    /** @type {SpaceFighterMultiplayerController} */
    playerController;
    /** @type {ObjectAction[]} */
    predictedPlayerActions = [];

    /** @type {number} */
    inputGatheringPeriodFrames;
    /** @type {number} */
    lastInputGatheringFrame = 0;

    /** @type {number} */
    packetPeriodFrames;
    /** @type {number} */
    frameLengthMs;

    ticksWaiting = 0;

    constructor(diContainer, assetManager, messageSerializerDeserializer, multiplayerService, logger) {
        super(diContainer, assetManager, messageSerializerDeserializer);
        this.multiplayerService = multiplayerService;
        this.logger = logger;
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
        if (this.currentFrameIndex !== 0) {
            //this.logger.debug(`[FRM#${this.currentFrameIndex}]`);
        }

        if (this.latestWorldState) {
            this._switchToNewState(delta);
        } else if ((this.currentFrameIndex + 1) < this.nextFrameIndex) {
            this.currentFrameIndex++;
            this._updateControllers(this.initializedControllers, delta);
        } else {
            // this.currentFrameIndex === this.nextFrameIndex
            // no more data about world state available, not possible to continue interpolation
            this.ticksWaiting++;
            return;
        }

        this._dispatchActions();

        this._cleanup();
    }

    _switchToNewState(delta) {
        // TODO maybe add some lag tolerance, because jitter decrease and increase can compensate each other
        // time to speed up, more recent state received
        // this.logger.debug(`Switching to next state on new state received`);

        let framesBtwCurrentAndNextState = this.nextFrameIndex - this.currentFrameIndex;
        if (framesBtwCurrentAndNextState > 1 && this.currentFrameIndex !== 0) {
            // e.g. if current state frame index is 98 and next state frame index is 100 we omit 1 frame
            //this.logger.debug(`${framesBtwCurrentAndNextState - 1} frame(s) will be omitted`);
        }

        if (this.ticksWaiting) {
            //this.logger.debug(`No update was made over ${this.ticksWaiting} ticks`);
            this.ticksWaiting = 0;
        }

        this._reconcilePlayerState(delta);
        // do all preceding updates and apply all previous actions
        do {
            this.currentFrameIndex++;
            this._updateControllers(this.initializedControllers, delta);
            framesBtwCurrentAndNextState--;
        } while (framesBtwCurrentAndNextState > 0);

        this._syncWorldState(this.nextWorldState, this.latestWorldState);

        this.nextWorldState = this.latestWorldState;
        this.nextFrameIndex = this.latestFrameIndex;
        this.latestWorldState = null;
        this._cleanup();
    }

    _reconcilePlayerState(delta) {
        const actions = this.latestPlayerGameObjectState.actions.filter(action => {
            return !!action.spaceFighterInput;
        });

        let reconcileFromFrameIndex = Infinity;
        const lastSavedFrameIndex = this.currentFrameIndex - this.packetPeriodFrames;
        for (let i = 0, count = this.predictedPlayerActions.length; i < count; i++) {
            const predictedAction = this.predictedPlayerActions[i];
            if (predictedAction.frameIndex < lastSavedFrameIndex) {
                this.logger.debug(`Input action dropped`);
                this.predictedPlayerActions[i] = null;
                continue;
            }

            const actualAction = actions.find(action => action.spaceFighterInput.actionId === predictedAction.spaceFighterInput.actionId);
            if (actualAction) {
                this.predictedPlayerActions[i] = null;
                const actualActionRelativeFrameIndex = actualAction.frameIndex - this.packetPeriodFrames;
                if (actualActionRelativeFrameIndex !== predictedAction.frameIndex) {
                    this.logger.debug(`Input action was schedule at frame ` + (predictedAction.frameIndex + this.packetPeriodFrames) +
                                      ` but executed at frame ` + (actualActionRelativeFrameIndex + this.packetPeriodFrames));
                    reconcileFromFrameIndex = Math.min(predictedAction.frameIndex, reconcileFromFrameIndex);
                    actualAction.frameIndex = actualActionRelativeFrameIndex;
                    this.replaceObjectAction(this.playerObjectId, predictedAction, actualAction);
                }
            }
        }
        // cleanup
        this.predictedPlayerActions = this.predictedPlayerActions.filter(Boolean);

        if (reconcileFromFrameIndex !== Infinity) {
            this.logger.debug('Reconcile from frame ' + (reconcileFromFrameIndex - 1) + ' Current frame index ' + this.currentFrameIndex);
            this.playerController.restoreObjectState(reconcileFromFrameIndex - 1);

            const reconcileToState = this.currentFrameIndex;
            this.currentFrameIndex = reconcileFromFrameIndex - 1;
            while (this.currentFrameIndex !== reconcileToState) {
                this.currentFrameIndex++;
                const objectActions = this.objectActionsByObjectId[this.playerObjectId][this.currentFrameIndex];
                if (objectActions) {
                    for (const objectAction of objectActions) {
                        if (objectAction.spaceFighterInput) {
                            // applyInputAction directly updates gameObject with no side effects
                            this.playerController.applyInputAction(objectAction.spaceFighterInput);
                        }
                    }
                }

                this.playerController.updateObject(delta);
            }
        }
    }

    _dispatchActions() {
        const actions = this.playerController.getImmediateActions();
        if (this.currentFrameIndex - this.lastInputGatheringFrame >= this.inputGatheringPeriodFrames) {
            this.lastInputGatheringFrame = this.currentFrameIndex;
            const inputAction = this.playerController.getInputActionForCurrentState();
            actions.push(inputAction);
        }

        if (actions.length) {
            // player object's state is one packet period (window) ahead, because we don't use interpolation on it
            // here we add one packet period length to currentFrameIndex (which is index of current interpolated frame)
            const frameOffset = this.currentFrameIndex + this.packetPeriodFrames;

            for (const action of actions) {
                const objectAction = this.multiplayerService.scheduleObjectAction(action, frameOffset);
                /*if ((action instanceof SpaceFighterOpenFire) || (action instanceof SpaceFighterStopFire)) {
                    console.log('Send open/stop fire action, scheduled at ' + objectAction.frameIndex);
                }*/

                if (action instanceof SpaceFighterInput) {
                    // we should apply input action in the preceding "window" for player's object
                    // because simulation for it runs without interpolation
                    objectAction.frameIndex -= this.packetPeriodFrames;
                    this.predictedPlayerActions.push(objectAction);
                    this.addObjectAction(this.playerObjectId, objectAction);
                    //this.logger.debug(`Input action will be applied on frame #${objectAction.frameIndex}`);
                } else {
                    // interpolation is used for other actions
                }
            }
        }
    }

    _syncWorldState(actualWorldState, futureWorldState) {
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

            /** @type {RemoteSpaceFighterController} */
            let controller = this.controllersByObjectId[objectId];
            if (!controller || !controller.initialized) {
                controller = this.createGameObject(objectId, actualObjectState.objectType);
            }

            controller.sync(actualObjectState, futureObjectState);
        }
    }

    handleInitialWorldStateUpdates = (event) => {
        /** @type {WorldState} */
        const worldState = event.detail;

        if (!this.nextWorldState) {
            this.nextWorldState = worldState;
        } else {
            // game loop will start update objects when currentFrameIndex != nextFrameIndex
            this.nextFrameIndex = this.nextWorldState.frameIndex;
            this.lastInputGatheringFrame = this.nextFrameIndex;

            if (worldState.objectStates) {
                const playerGameObjectState = worldState.objectStates.find(objectState => objectState.id === this.playerObjectId);
                if (playerGameObjectState) {
                    this.latestPlayerGameObjectState = playerGameObjectState;
                    this.latestFrameIndex = worldState.frameIndex;
                    this.latestWorldState = worldState;
                    this.multiplayerService.removeEventListener('worldStateUpdate', this.handleInitialWorldStateUpdates);
                    this.multiplayerService.addEventListener('worldStateUpdate', this.handleWorldStateUpdates)
                }
            }
        }
    };

    handleWorldStateUpdates = (event) => {
        /** @type {WorldState} */
        const worldState = event.detail;

        if (worldState.frameIndex <= this.nextFrameIndex) {
            // old state received
            return;
        } else if (!this.latestWorldState) {
            this.latestWorldState = worldState;
            this.latestFrameIndex = worldState.frameIndex;
        } else {
            this.nextWorldState = this.latestWorldState;
            this.nextFrameIndex = this.latestFrameIndex;
            this.latestWorldState = worldState;
            this.latestFrameIndex = worldState.frameIndex;
        }

        const worldObjectsCount = worldState.objectStates.length;
        for (let i = 0; i < worldObjectsCount; i++) {
            /** @type {SpaceFighterState} */
            const objectState = worldState.objectStates[i];

            if (!objectState.actions) {
                objectState.actions = [];
            }

            let actions = objectState.actions;
            if (this.playerObjectId === objectState.id) {
                this.latestPlayerGameObjectState = objectState;

                // we should not re-process input actions of player object retransmitted back from server
                // not true for all actions, should actions related to shooting
                actions = actions.filter(action => {
                    return action.spaceFighterOpenFire || action.spaceFighterGotHit || action.spaceFighterStopFire;
                });
            }

            if (!this.objectActionsByObjectId[objectState.id]) {
                this.objectActionsByObjectId[objectState.id] = {};
            }

            for (let j = 0, actionsCount = actions.length; j < actionsCount; j++) {
                this.addObjectAction(objectState.id, actions[j]);
            }
        }
    };

    /*scheduleObjectAction(objectId, objectAction) {
        // two actions can be schedules at the same frameIndex (in world simulator)
        if (this.objectActionsByObjectId[objectId][objectAction.frameIndex]) {
           console.log('Already has action!!!!');
        }
        this.objectActionsByObjectId[objectId][objectAction.frameIndex] = objectAction;
    }*/

    /**
     * @param {number} playerObjectId
     * @param {RemoteSpaceFighterController} playerController
     */
    specifyPlayerControllerAndControlledObject(playerObjectId, playerController) {
        this.playerObjectId = playerObjectId;
        this.playerController = playerController;
        this.objectActionsByObjectId[playerObjectId] = {}
    }

}
