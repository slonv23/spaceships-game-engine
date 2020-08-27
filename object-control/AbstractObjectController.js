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
     */
    init(objectId) {
        this.gameObject = this.createObject(objectId);
        this.initialized = true;
    }

    /**
     * @param {number} delta
     */
    update(delta) {
        this.gameObject.update(delta);
        this.updateControlParams(delta);
    }

    /**
     * @param {number} delta
     */
    // eslint-disable-next-line no-unused-vars
    updateControlParams(delta) {
        throw new Error("Not implemented");
    }

}
