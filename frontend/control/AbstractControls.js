/**
 * @typedef {import('three')} THREE
 * @typedef {import('../../physics/object/AbstractObject').default} AbstractObject
 * @typedef {import('../Renderer').default} Renderer
 */

export default class AbstractControls {

    /** @type {AbstractObject} */
    gameObject;

    /** @type {THREE.PerspectiveCamera} */
    camera;

    /** @type {Renderer} */
    renderer;

    /**
     * @param {THREE.PerspectiveCamera} camera
     * @param {AbstractObject} gameObject
     * @param {Renderer} renderer
     */
    init(camera, gameObject, renderer) {
        this.gameObject = gameObject;
        this.camera = camera;
        this.renderer = renderer;
    }

    /**
     * @param {number} delta
     */
    // eslint-disable-next-line no-unused-vars
    updateCameraAndControlParams(delta) {
        throw new Error("Not implemented");
    }

}
