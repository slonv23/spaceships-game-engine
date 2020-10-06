/**
 * @typedef {import('../../object-control/AbstractController').default} AbstractController
 * @typedef {import('../../object-control/AbstractObjectController').default} AbstractObjectController
 * @typedef {import('../../object-control/space-fighter/RemoteSpaceFighterController').default} RemoteSpaceFighterController
 * @typedef {import('../../net/models/space-fighter/SpaceFighterInput').default} SpaceFighterInput
 * @typedef {import('../../asset-management/AssetManager').default} AssetManager
 * @typedef {import('di-container-js').default} DiContainer
 * @typedef {import('di-container-js/ComponentFactory')} ComponentFactory
 */
import AbstractController from '../../object-control/AbstractController';
import Emitter from '../../util/Emitter';
import AbstractObjectController from "../../object-control/AbstractObjectController";

export default class AuthoritativeStateManager extends Emitter {

    /** @type {AbstractController[]} */
    initializedControllers = [];
    /** @type {number} */
    initializedControllersCount = 0;
    /** @type {object.<string, AbstractObjectController>} */
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

    async postConstruct() {
        if (this.diContainer.isInitialized('renderer') || this.diContainer.isProvided('renderer')) {
            this.renderer = await this.diContainer.get('renderer');
        }
    }

    update(delta) {
        this.currentFrameIndex++;
        this._updateControllers(this.initializedControllers, delta);
        this._cleanup();
    }

    _updateControllers(controllers, delta) {
        this._applyInputActionsAndUpdateObjects(controllers, delta);
    }

    _applyInputActionsAndUpdateObjects(controllers, delta) {
        const processedActions = [];

        for (let i = 0, controllersCount = controllers.length; i < controllersCount; i++) {
            // TODO make separate lists for object controllers
            if (controllers[i] instanceof AbstractObjectController) {
                const id = controllers[i].gameObject.id;
                const inputAction = this.objectActionsByObjectId[id][this.currentFrameIndex];
                if (inputAction) {
                    controllers[i].processInput(inputAction);
                    processedActions.push(inputAction);
                }
            }

            controllers[i].update(delta);
        }

        this.dispatchEvent("actions-processed", processedActions);
    }

    // update method for single player mode:
    /*update(delta) {
        for (let i = 0; i < this.initializedControllersCount; i++) {
            this.initializedControllers[i].update(delta);
        }
    }*/

    /**
     * @param {AbstractController} controller
     */
    addController(controller) {
        this.initializedControllers.push(controller);
        this.initializedControllersCount++;
    }

    /**
     * @param {number} gameObjectTypeId
     * @param {ComponentFactory} controllerFactory
     */
    associateControllerFactoryWithGameObjectType(gameObjectTypeId, controllerFactory) {
        this.gameObjectTypes[gameObjectTypeId] = {controllerFactory};
    }

    /**
     * @param {number|null} objectId - if 'null' will be auto-generated
     * @param {number|null} gameObjectTypeId
     * @param {ComponentFactory|null} [controllerFactoryOverride]
     * @returns {Promise<AbstractController>}
     */
    createGameObject(objectId, gameObjectTypeId, controllerFactoryOverride = null) {
        if (!objectId) {
            objectId = ++this.lastObjectId;
        }

        let controller = this.controllersByObjectId[objectId];
        if (!controller) {
            const gameObjectDef = this.gameObjectTypes[gameObjectTypeId];
            const controllerFactory = controllerFactoryOverride ? controllerFactoryOverride : gameObjectDef.controllerFactory;
            controller = this.createObjectController(objectId, controllerFactory);
        }
        controller.init(objectId, this.renderer);
        this.initializedControllers.push(controller);
        this.initializedControllersCount++;

        // allocate array for input actions, this is not needed in SP mode TODO refactor
        this.objectActionsByObjectId[objectId] = {};

        this.dispatchEvent("game-object-created", controller);
        return controller;
    }

    /**
     * @param {number} objectId
     * @param {ComponentFactory} controllerFactory
     * @returns {AbstractController}
     */
    createObjectController(objectId, controllerFactory) {
        let controller = controllerFactory.create();
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
