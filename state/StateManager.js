/**
 * @typedef {import('../object-control/AbstractController').default} AbstractController
 * @typedef {import('../object-control/flying-object/RemoteFlyingObjectController').default} RemoteFlyingObjectController
 * @typedef {import('../net/models/WorldState').default} WorldState
 * @typedef {import('../net/models/ObjectState').default} ObjectState
 * @typedef {import('../net/models/InputAction').default} InputAction
 * @typedef {import('../frontend/asset-management/AssetManager').default} AssetManager
 * @typedef {import('di-container-js').default} DiContainer
 */

import AbstractObject from "../physics/object/AbstractObject";
import AbstractController from "../object-control/AbstractController";
import Emitter from "../util/Emitter";

// TODO rename to MultiplayerStateManager
// TODO inherit from AuthoritativeStateManager
export default class StateManager extends Emitter {

    /** @type {AbstractController[]} */
    controllers = [];
    /** @type {object.<string, AbstractController>} */
    controllersByObjectId = {};
    /** @type {object.<string, object>} */
    gameObjectTypes = {};
    /** @type {number} */
    controllersCount = 0;
    /** @type {number} */
    lastObjectId = 0;
    /** @type {string} */
    defaultGameObjectType;
    /** @type {DiContainer} */
    diContainer;
    /** @type {AssetManager} */
    assetManager;

    /** @type {WorldState} */
    nextWorldState;
    /** @type {number} */
    nextFrameIndex = 0;

    /** @type {WorldState} */
    latestWorldState;
    /** @type {number} */
    latestFrameIndex;

    /** @type {number} */
    currentFrameIndex = 0;
    /** @type {object.<number, object.<number, InputAction>>} */
    inputActionsByObjectId = {};

    constructor(diContainer, assetManager) {
        super();
        this.diContainer = diContainer;
        this.assetManager = assetManager;
    }

    update(delta) {
        if (this.latestWorldState) {
            // time to speed up, more recent state received
            this.currentFrameIndex = this.nextFrameIndex;

            this._syncWorldState(this.nextWorldState);

            this.nextWorldState = this.latestWorldState;
            this.nextFrameIndex = this.latestFrameIndex;
            this.latestWorldState = null;
        } else if (this.currentFrameIndex === this.nextFrameIndex) {
            // no more data about world state available, not possible to continue interpolation
            return;
        }

        this.currentFrameIndex++;
        if (this.currentFrameIndex === this.nextFrameIndex) {
            this._syncWorldState(this.nextWorldState);
        } else {
            this._applyInputActionsAndUpdateObjects(delta);
        }
    }

    _syncWorldState(worldState) {
        const worldObjectsCount = worldState.objectStates.length;
        for (let i = 0; i < worldObjectsCount; i++) {
            /** @type {ObjectState} */
            const objectState = worldState.objectStates[i];
            /** @type {RemoteFlyingObjectController} */
            const controller = this.controllersByObjectId[objectState.id];
            if (!controller) {
                continue;
            }

            controller.sync(objectState);
        }
    }

    _applyInputActionsAndUpdateObjects(delta) {
        for (let i = 0; i < this.controllersCount; i++) {
            const id = this.controllers[i].gameObject.id;
            const inputAction = this.inputActionsByObjectId[id][this.currentFrameIndex];
            if (inputAction) {
                this.controllers[i].processInput(inputAction);
            }

            this.controllers[i].update(delta);
        }
    }

    // update method for single player mode:
    /*update(delta) {
        for (let i = 0; i < this.controllersCount; i++) {
            this.controllers[i].update(delta);
        }
    }*/

    registerGameObjectType(objectTypeName, objectClass, defaultControllerRef = null, model = null) {
        this.gameObjectTypes[objectTypeName] = {objectClass, defaultControllerRef, model};
    }

    /**
     * @param {number|null} objectId - if 'null' will be auto-generated
     * @param {string} type
     * @param {symbol|string|null} [controllerRef]
     * @returns {Promise<AbstractController>}
     */
    async createObject(objectId, type, controllerRef = null) {
        if (!objectId) {
            objectId = ++this.lastObjectId;
        }

        const gameObjectDef = this.gameObjectTypes[type];
        if (!(gameObjectDef.objectClass.prototype instanceof AbstractObject)) {
            throw new Error('Class must be inherited from AbstractObject');
        }
        let gameObject = new gameObjectDef.objectClass(objectId, this.assetManager.getModel(gameObjectDef.model));
        this.dispatchEvent(new CustomEvent("object-created", {detail: gameObject}));

        let controller = await this.diContainer.get(controllerRef ? controllerRef : gameObjectDef.defaultControllerRef, true);
        if (!controller) {
            throw new Error('Component not found');
        }
        if (!(controller instanceof AbstractController)) {
            throw new Error(`Object controller must be inherited from AbstractControls`);
        }

        controller.init(gameObject);
        this.controllers.push(controller);
        this.controllersByObjectId[objectId] = controller;
        this.controllersCount++;

        // allocate array for input actions, this is not needed in SP mode TODO refactor
        this.inputActionsByObjectId[objectId] = {};

        return controller;
    }

    /**
     * @param {WorldState} worldState
     */
    updateWorld(worldState) {
        if (!this.nextWorldState) {
            this.nextWorldState = worldState;
        } else {
            // game loop will start update objects when currentFrameIndex != nextFrameIndex
            this.nextFrameIndex = this.nextWorldState.frameIndex;

            this.latestFrameIndex = worldState.frameIndex;
            this.latestWorldState = worldState;
            this.updateWorld = this._updateWorld;
        }
    }

    _updateWorld(worldState) {
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
            /** @type {ObjectState} */
            const objectState = worldState.objectStates[i];

            if (!this.inputActionsByObjectId[objectState.id]) {
                this.inputActionsByObjectId[objectState.id] = {};
            } else {
                this._cleanActions(this.inputActionsByObjectId[objectState.id]);
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

    _cleanActions(actions) {
        for (const actionFrameIndex in actions) {
            if (actionFrameIndex < this.currentFrameIndex) {
                delete actions[actionFrameIndex];
            }
        }
    }

}
