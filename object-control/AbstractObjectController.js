/**
 * @typedef {import('three')} THREE
 * @typedef {import('../physics/object/AbstractObject').default} AbstractObject
 * @typedef {import('../frontend/Renderer').default} Renderer
 */

import AbstractController from "./AbstractController";
import AbstractObject from "../physics/object/AbstractObject";

export default class AbstractObjectController extends AbstractController {

    /** @type {AbstractObject} */
    gameObject;
    /** @type {boolean} */
    initialized = false;

    /**
     * @param {number} objectId
     * @param {Renderer} [renderer]
     */
    init(objectId, renderer) {
        this.renderer = renderer;

        this.gameObject = this.createObject(objectId);
        this.addObjectToScene(this.gameObject);

        this.initialized = true;
    }

    /**
     * @param {number} delta
     */
    update(delta) {
        this.updateObject(delta);
        this.updateControlParams(delta);
    }

    updateObject(delta) {
        this.gameObject.update(delta);
    }

    /**
     * @param {number} delta
     */
    // eslint-disable-next-line no-unused-vars
    updateControlParams(delta) {
        throw new Error("Not implemented");
    }

    // eslint-disable-next-line no-unused-vars
    createObject(objectId) {
        throw new Error("Not implemented");
    }

}
