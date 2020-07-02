/**
 * @typedef {import('../object-control/AbstractController').default} AbstractController
 * @typedef {import('../net/models/WorldState').default} WorldState
 * @typedef {import('../net/models/ObjectState').default} ObjectState
 * @typedef {import('../frontend/asset-management/AssetManager').default} AssetManager
 * @typedef {import('di-container-js').default} DiContainer
 */

import AbstractObject from "../physics/object/AbstractObject";
import AbstractController from "../object-control/AbstractController";
import Emitter from "../util/Emitter";

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

    constructor(diContainer, assetManager) {
        super();
        this.diContainer = diContainer;
        this.assetManager = assetManager;
    }

    update(delta) {
        // TODO don't forget to accelerate frame transition
        //  if more than one future world states enabled (maybe in updateWorld method)
        if (this.currentFrameIndex === this.latestFrameIndex) {
            return;
        }

        const newFrameIndex = this.currentFrameIndex + 1;
        if (newFrameIndex === this.latestFrameIndex) {
            this._syncWorldState();
        } else {
            this._applyInputActionsAndUpdateObjects(delta);
        }
    }

    _syncWorldState() {

    }

    _applyInputActionsAndUpdateObjects() {
        for (let i = 0; i < this.controllersCount; i++) {
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

        return controller;
    }

    /**
     * @param {WorldState} worldState
     */
    updateWorld(worldState) {
        if (!this.previousWorldState) {
            this.previousWorldState = worldState;
        } else {
            this.updateWorld = this._updateWorld;
        }
    }

    _updateWorld(worldState) {
        const worldObjectsCount = worldState.objectStates.length;
        for (let i = 0; i < worldObjectsCount; i++) {
            /** @type {ObjectState} */
            const objectState = worldState.objectStates[i];
            // TODO group actions by frame index and object ids

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
