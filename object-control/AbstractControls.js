/**
 * @typedef {import('three')} THREE
 * @typedef {import('../physics/object/AbstractObject').default} AbstractObject
 * @typedef {import('../frontend/Renderer').default} Renderer
 */

export default class AbstractControls {

    /** @type {AbstractObject} */
    gameObject;

    /**
     * @param {AbstractObject} gameObject
     */
    init(gameObject) {
        this.gameObject = gameObject;
    }

    /**
     * @param {number} delta
     */
    // eslint-disable-next-line no-unused-vars
    updateControlParams(delta) {
        throw new Error("Not implemented");
    }

}
