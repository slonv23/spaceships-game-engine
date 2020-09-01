/**
 * @typedef {import('../object-control/AbstractController').default} AbstractController
 * @typedef {import('../object-control/space-fighter/RemoteSpaceFighterController').default} RemoteSpaceFighterController
 * @typedef {import('../net/models/InputAction').default} SpaceFighterInput
 * @typedef {import('../asset-management/AssetManager').default} AssetManager
 * @typedef {import('di-container-js').default} DiContainer
 */
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
    /** @type {DiContainer} */
    diContainer;
    /** @type {AssetManager} */
    assetManager;

    /** @type {number} */
    currentFrameIndex = 0;
    /** @type {object.<number, object.<number, SpaceFighterInput>>} */
    objectActionsByObjectId = {};

    constructor(diContainer, assetManager) {
        super();
        this.diContainer = diContainer;
        this.assetManager = assetManager;
    }

    async update(delta) {
        this.currentFrameIndex++;
        await this._applyInputActionsAndUpdateObjects(delta);
        this._cleanup();
    }

    async _applyInputActionsAndUpdateObjects(delta) {
        const processedActions = [];

        const promises = [];
        for (let i = 0; i < this.initializedControllersCount; i++) {
            const id = this.initializedControllers[i].gameObject.id;
            const inputAction = this.objectActionsByObjectId[id][this.currentFrameIndex];
            if (inputAction) {
                this.initializedControllers[i].processInput(inputAction);
                processedActions.push(inputAction);
            }

            promises.push(this.initializedControllers[i].update(delta));
        }

        await Promise.all(promises);

        this.dispatchEvent("actions-processed", processedActions);
    }

    // update method for single player mode:
    /*update(delta) {
        for (let i = 0; i < this.initializedControllersCount; i++) {
            this.initializedControllers[i].update(delta);
        }
    }*/

    associateControllerWithGameObjectType(gameObjectTypeId, controllerRef) {
        this.gameObjectTypes[gameObjectTypeId] = {
            controllerRef
        };
    }

    /**
     * @param {number|null} objectId - if 'null' will be auto-generated
     * @param {number|null} gameObjectTypeId
     * @param {symbol|string|null} [controllerRef]
     * @returns {Promise<AbstractController>}
     */
    async createGameObject(objectId, gameObjectTypeId, controllerRef = null) {
        if (!objectId) {
            objectId = ++this.lastObjectId;
        }

        let controller = this.controllersByObjectId[objectId];
        if (!controller) {
            const gameObjectDef = this.gameObjectTypes[gameObjectTypeId];
            controller = await this.createObjectController(objectId, controllerRef ? controllerRef : gameObjectDef.controllerRef);
        }
        controller.init(objectId);
        this.initializedControllers.push(controller);
        this.initializedControllersCount++;

        // allocate array for input actions, this is not needed in SP mode TODO refactor
        this.objectActionsByObjectId[objectId] = {};

        this.dispatchEvent("game-object-created", controller);
        return controller;
    }

    async createObjectController(objectId, controllerRef) {
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

    addObjectAction(objectId, action) {
        const actionFrameIndex = action.frameIndex <= this.currentFrameIndex ? this.currentFrameIndex + 1 : action.frameIndex;
        this.objectActionsByObjectId[objectId][actionFrameIndex] = action;
    }

    _cleanup() {
        for (const objectId in this.objectActionsByObjectId) {
            this._cleanActions(this.objectActionsByObjectId[objectId]);
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
