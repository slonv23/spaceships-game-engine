/**
 * @typedef {import('../object-control/AbstractController').default} AbstractController
 * @typedef {import('../object-control/flying-object/RemoteFlyingObjectController').default} RemoteFlyingObjectController
 * @typedef {import('../net/models/WorldState').default} WorldState
 * @typedef {import('../net/models/ObjectState').default} ObjectState
 * @typedef {import('../net/models/InputAction').default} InputAction
 * @typedef {import('../frontend/asset-management/AssetManager').default} AssetManager
 * @typedef {import('di-container-js').default} DiContainer
 */

import AuthoritativeStateManager from "./AuthoritativeStateManager";

export default class MultiplayerStateManager extends AuthoritativeStateManager {

    /** @type {WorldState} */
    nextWorldState;
    /** @type {number} */
    nextFrameIndex = 0;

    /** @type {WorldState} */
    latestWorldState;
    /** @type {number} */
    latestFrameIndex;

    update(delta) {
        if (this.latestWorldState) {
            // time to speed up, more recent state received
            this.currentFrameIndex = this.nextFrameIndex;

            this._syncWorldState(this.nextWorldState);
            console.log('Sync with next world state ' + this.nextWorldState.frameIndex);

            this.nextWorldState = this.latestWorldState;
            this.nextFrameIndex = this.latestFrameIndex;
            this.latestWorldState = null;
            return;
        } else if (this.currentFrameIndex === this.nextFrameIndex) {
            // no more data about world state available, not possible to continue interpolation
            return;
        }

        this.currentFrameIndex++;
        console.log("currentFrameIndex: " + this.currentFrameIndex + " nextFrameIndex: " + this.nextFrameIndex);
        if (this.currentFrameIndex === this.nextFrameIndex) {
            this._syncWorldState(this.nextWorldState);
            this._cleanup();
        } else {
            this._applyInputActionsAndUpdateObjects(delta);
        }
    }

    async _syncWorldState(worldState) {
        console.log('Sync with world state ' + worldState.frameIndex);
        console.log('World state: ' + JSON.stringify(worldState));
        const worldObjectsCount = worldState.objectStates.length;
        for (let i = 0; i < worldObjectsCount; i++) {
            /** @type {ObjectState} */
            const objectState = worldState.objectStates[i];
            /** @type {RemoteFlyingObjectController} */
            let controller = this.controllersByObjectId[objectState.id];
            if (!controller) {
                controller = await this.createObject(objectState.id, objectState.objectType);
            }

            console.log('Game object pos: ' + JSON.stringify(controller.gameObject.position));

            controller.sync(objectState);
        }
    }

    /**
     * @param {WorldState} worldState
     */
    updateWorld(worldState) {
        if (!this.nextWorldState) {
            this.nextWorldState = worldState;
            console.log('Set next world state');
        } else {
            // game loop will start update objects when currentFrameIndex != nextFrameIndex
            this.nextFrameIndex = this.nextWorldState.frameIndex;

            this.latestFrameIndex = worldState.frameIndex;
            this.latestWorldState = worldState;
            this.updateWorld = this._updateWorld;
            console.log('Set latest world state');
        }
    }

    _updateWorld(worldState) {
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

            if (!this.inputActionsByObjectId[objectState.id]) {
                this.inputActionsByObjectId[objectState.id] = {};
            }

            for (let j = 0, actionsCount = objectState.actions.length; j < actionsCount; j++) {
                this.addInputAction(objectState.id, objectState.actions[j]);
            }

            /*let controller = this.controllersByObjectId[objectState.id];
            if (!controller) {
                const gameObjectType = objectState.objectType ? objectState.objectType : this.defaultGameObjectType;
                controller = this.createObject(objectState.id, gameObjectType);
            }
            console.log(JSON.stringify(objectState));

            controller.sync(objectState);*/
        }
    }

    addInputAction(objectId, action) {
        this.inputActionsByObjectId[objectId][action.frameIndex] = action;
    }

}
