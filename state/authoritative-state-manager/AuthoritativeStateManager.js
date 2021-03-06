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
    /** @type {boolean} */
    controllersRemoved = false;

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

    constructor(diContainer, assetManager, messageSerializerDeserializer) {
        super();
        this.diContainer = diContainer;
        this.assetManager = assetManager;
        this.messageSerializerDeserializer = messageSerializerDeserializer;
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
        for (let i = 0, controllersCount = controllers.length; i < controllersCount; i++) {
            // TODO make separate lists for object controllers
            if (controllers[i] instanceof AbstractObjectController) {
                const id = controllers[i].gameObject.id;
                const objectActions = this.objectActionsByObjectId[id][this.currentFrameIndex];

                if (objectActions) {
                    this._applyObjectActions(controllers[i], objectActions);
                }
            }

            controllers[i].update(delta, this.currentFrameIndex);
        }

        this._cleanupRemovedControllers();
    }

    /**
     * @param {AbstractObjectController} controller
     * @param {Array} objectActions
     * @protected
     */
    _applyObjectActions(controller, objectActions) {
        for (const objectAction of objectActions) {
            controller.processInput(objectAction);
        }

        this.dispatchEvent("actions-processed", objectActions);
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

    removeController(controllerToRemove) {
        const index = this.initializedControllers.findIndex(controller => controller === controllerToRemove);
        if (index === -1) {
            throw new Error('Trying to remove controller which is not registered');
        }
        if (controllerToRemove instanceof AbstractObjectController) {
            this.controllersByObjectId[controllerToRemove.gameObject.id] = null;
        }
        this.initializedControllers[index] = null;
        this.controllersRemoved = true;
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

    wrapAndAddSpecificAction(objectId, specificAction, frameIndex) {
        if (!frameIndex) {
            frameIndex = this.currentFrameIndex + 1;
        }
        const objectAction = this.messageSerializerDeserializer.wrapAction(specificAction, frameIndex);
        objectAction.objectId = objectId;
        this.addObjectAction(objectId, objectAction);
    }

    addObjectAction(objectId, action) {
        if (action.frameIndex <= this.currentFrameIndex) {
            throw new Error('Action cannot be scheduled in past');
        }

        this.addObjectActionUnsafe(objectId, action);
    }

    addObjectActionUnsafe(objectId, action) {
        let actions = this.objectActionsByObjectId[objectId][action.frameIndex];
        if (!actions) {
            actions = [];
            this.objectActionsByObjectId[objectId][action.frameIndex] = actions;
        }
        actions.push(action);
    }

    replaceObjectAction(objectId, actionToReplace, replacementAction) {
        const actions = this.objectActionsByObjectId[objectId][actionToReplace.frameIndex];
        const actionToReplaceIndex = actions.findIndex(action => action === actionToReplace);
        actions.splice(actionToReplaceIndex, 1);
        this.addObjectActionUnsafe(objectId, replacementAction);
    }

    _cleanup() {
        for (const objectId in this.objectActionsByObjectId) {
            this._cleanActions(this.objectActionsByObjectId[objectId]);
        }
    }

    _cleanupRemovedControllers() {
        if (this.controllersRemoved) {
            this.initializedControllers = this.initializedControllers.filter(Boolean);
            this.initializedControllersCount = this.initializedControllers.length;
            for (const objectId in this.controllersByObjectId) {
                if (this.controllersByObjectId[objectId] == null) {
                    delete this.controllersByObjectId[objectId];
                }
            }
            this.controllersRemoved = false;
        }
    }

    _cleanActions(actions) {
        for (const actionFrameIndex in actions) {
            // we save past states for player object, so we use some offset to remove old actions
            const lastSavedFrameIndex = this.currentFrameIndex - this.packetPeriodFrames;
            if (actionFrameIndex < lastSavedFrameIndex) {
                delete actions[actionFrameIndex];
            }
        }
    }

}
