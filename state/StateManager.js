/**
 * @typedef {import('../object-control/AbstractController').default} AbstractController
 */

import AbstractObject from "../physics/object/AbstractObject";
import AbstractController from "../object-control/AbstractController";

export default class StateManager {

    /** @type {AbstractController[]} */
    controllers = [];

    /** @type {number} */
    controllersCount = 0;

    /** @type {number} */
    lastObjectId = 0;

    constructor(diContainer) {
        this.diContainer = diContainer;
    }

    update(delta) {
        for (let i = 0; i < this.controllersCount; i++) {
            this.controllers[i].update(delta);
        }
    }

    /**
     * @param {number|null} objectId - if 'null' will be auto-generated
     * @param {Function} objectClass
     * @param {symbol|string} controllerRef
     * @param {object} model
     * @returns {Promise<AbstractController>}
     */
    async createObject(objectId, objectClass, controllerRef, model = null) {
        if (!objectId) {
            objectId = ++this.lastObjectId;
        }

        if (!(objectClass.prototype instanceof AbstractObject)) {
            throw new Error('Class must be inherited from AbstractObject');
        }

        let gameObject = new objectClass(objectId, model);

        const controller = await this.diContainer.get(controllerRef, true);
        if (!controller) {
            throw new Error('Component not found');
        }

        if (!(controller instanceof AbstractController)) {
            throw new Error(`Object controller must be inherited from AbstractControls`);
        }

        controller.init(gameObject);
        this.controllers.push(controller);
        this.controllersCount++;

        return controller;
    }

}
