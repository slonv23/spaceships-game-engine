/**
 * @typedef {import('three')} THREE
 * @typedef {import('../physics/object/AbstractObject').default} AbstractObject
 * @typedef {import('../frontend/Renderer').default} Renderer
 */

export default class AbstractController {

    /** @type {AbstractObject} */
    gameObject;
    /** @type {boolean} */
    initialized = false;

    /**
     * @param {AbstractObject} gameObject
     */
    init(gameObject) {
        this.gameObject = gameObject;
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
