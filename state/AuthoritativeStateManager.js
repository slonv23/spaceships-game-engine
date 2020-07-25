/**
 * @typedef {import('../object-control/AbstractController').default} AbstractController
 * @typedef {import('../object-control/flying-object/RemoteFlyingObjectController').default} RemoteFlyingObjectController
 * @typedef {import('../net/models/InputAction').default} InputAction
 * @typedef {import('../frontend/asset-management/AssetManager').default} AssetManager
 * @typedef {import('di-container-js').default} DiContainer
 */

import AbstractObject from '../physics/object/AbstractObject';
import AbstractController from '../object-control/AbstractController';
import Emitter from '../util/Emitter';

export default class AuthoritativeStateManager extends Emitter {

    /** @type {AbstractController[]} */
    initializedControllers = [];
    /** @type {number} */
    initializedControllersCount = 0;
    /** @type {object.<string, AbstractController>} */
    controllersByObjectId = {};
    /** @type {object.<string, object>} */
    gameObjectTypes = {};
    /** @type {number} */
    lastObjectId = 0;
    /** @type {string} */
    defaultGameObjectType;
    /** @type {DiContainer} */
    diContainer;
    /** @type {AssetManager} */
    assetManager;

    /** @type {number} */
    currentFrameIndex = 0;
    /** @type {object.<number, object.<number, InputAction>>} */
    inputActionsByObjectId = {};

    /** @type {Function} */
    _createGameObject;

    constructor(diContainer) {
        super();
        this.diContainer = diContainer;
    }

    async postConstruct() {
        if (this.diContainer.isProvided('assetManager')) {
            this.assetManager = await this.diContainer.get('assetManager');
            this._createGameObject = (objectId, gameObjectDef) => {
                return new gameObjectDef.objectClass(objectId, this.assetManager.getModel(gameObjectDef.model))
            };
        } else {
            this._createGameObject = (objectId, gameObjectDef) => {
                return new gameObjectDef.objectClass(objectId)
            };
        }
    }

    update(delta) {
        this.currentFrameIndex++;
        this._applyInputActionsAndUpdateObjects(delta);
        this._cleanup();
    }

    _applyInputActionsAndUpdateObjects(delta) {
        const processedActions = [];

        for (let i = 0; i < this.initializedControllersCount; i++) {
            const id = this.initializedControllers[i].gameObject.id;
            const inputAction = this.inputActionsByObjectId[id][this.currentFrameIndex];
            if (inputAction) {
                this.initializedControllers[i].processInput(inputAction);
                processedActions.push(inputAction);
            }

            this.initializedControllers[i].update(delta);
        }

        this.dispatchEvent("actions-processed", processedActions);
    }

    // update method for single player mode:
    /*update(delta) {
        for (let i = 0; i < this.initializedControllersCount; i++) {
            this.initializedControllers[i].update(delta);
        }
    }*/

    registerGameObjectType(objectTypeName, objectClass, defaultControllerRef = null, model = null) {
        this.gameObjectTypes[objectTypeName] = {objectClass, defaultControllerRef, model};
    }

    /**
     * @param {number|null} objectId - if 'null' will be auto-generated
     * @param {number} type
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
        let gameObject = this._createGameObject(objectId, gameObjectDef);
        this.dispatchEvent("object-created", gameObject);

        let controller = this.controllersByObjectId[objectId];
        if (!controller) {
            controller = await this.createController(objectId, controllerRef ? controllerRef : gameObjectDef.defaultControllerRef);
        }
        controller.init(gameObject);
        this.initializedControllers.push(controller);
        this.initializedControllersCount++;

        // allocate array for input actions, this is not needed in SP mode TODO refactor
        this.inputActionsByObjectId[objectId] = {};

        return controller;
    }

    async createController(objectId, controllerRef) {
        let controller = await this.diContainer.get(controllerRef, true);
        if (!controller) {
            throw new Error('Component not found');
        }
        if (!(controller instanceof AbstractController)) {
            throw new Error(`Object controller must be inherited from AbstractControls`);
        }

        this.controllersByObjectId[objectId] = controller;

        return controller;
    }

    addInputAction(objectId, action) {
        const actionFrameIndex = action.frameIndex <= this.currentFrameIndex ? this.currentFrameIndex + 1 : action.frameIndex;
        this.inputActionsByObjectId[objectId][actionFrameIndex] = action;
    }

    _cleanup() {
        for (const objectId in this.inputActionsByObjectId) {
            this._cleanActions(this.inputActionsByObjectId[objectId]);
        }
    }

    _cleanActions(actions) {
        for (const actionFrameIndex in actions) {
            if (actionFrameIndex <= this.currentFrameIndex) {
                delete actions[actionFrameIndex];
            }
        }
    }

}
