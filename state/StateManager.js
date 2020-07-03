/**
 * @typedef {import('../object-control/AbstractController').default} AbstractController
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
    previousWorldState;
    /** @type {WorldState} */
    latestWorldState;
    /** @type {number} */
    currentFrameIndex = 0;
    /** @type {number} */
    latestFrameIndex = 0;
    /** @type {object.<number, object.<number, InputAction>>} */
    inputActionsByObjectId = {};

    constructor(diContainer, assetManager) {
        super();
        this.diContainer = diContainer;
        this.assetManager = assetManager;
    }

    // eslint-disable-next-line no-unused-vars
    update(delta) {
        // TODO don't forget to accelerate frame transition
        //  if more than one future world states enabled (maybe in updateWorld method)
        if (!this.previousWorldState && !this.latestWorldState) {
            return;
        }

        // initialize world
        this._syncWorldState(this.previousWorldState);

        this.update = this._update;
    }

    _update(delta) {
        if (this.currentFrameIndex === this.latestFrameIndex) {
            return;
        }

        // const newFrameIndex = this.currentFrameIndex + 1;
        this.currentFrameIndex++;
        if (this.currentFrameIndex === this.latestFrameIndex) {
            this._syncWorldState(this.latestWorldState);
        } else {
            this._applyInputActionsAndUpdateObjects(delta);
        }
    }

    _syncWorldState(worldState) {
        for (let i = 0; i < this.controllersCount; i++) {
            // TODO
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
        if (!this.previousWorldState) {
            this.previousWorldState = worldState;
        } else {
            this.currentFrameIndex = this.previousWorldState.frameIndex;
            this.latestFrameIndex = worldState.frameIndex;
            this.latestWorldState = worldState;
            this.updateWorld = this._updateWorld;
        }
    }

    _updateWorld(worldState) {
        if (this.currentFrameIndex < this.latestFrameIndex) {
            // time to speed up
            // ...
            // TODO reset state to old state immediately and move to new frames
            //  use previousWorldState and initial update method
        }

        const worldObjectsCount = worldState.objectStates.length;
        for (let i = 0; i < worldObjectsCount; i++) {
            /** @type {ObjectState} */
            const objectState = worldState.objectStates[i];

            if (!this.inputActionsByObjectId[objectState.id]) {
                this.inputActionsByObjectId[objectState.id] = {};
            }

            for (let j = 0, actionsCount = objectState.actions.length; j < actionsCount; j++) {
                const action = objectState.actions[j];
                this.inputActionsByObjectId[objectState.id][action.frameIndex] = action;
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

}
