/**
 * @typedef {import('three')} THREE
 * @typedef {import('../../physics/object/AbstractObject').default} AbstractObject
 */

export default class AbstractControls {

    /** @type {AbstractObject} */
    gameObject;

    /** @type {THREE.PerspectiveCamera} */
    camera;

    /**
     * @param {THREE.PerspectiveCamera} camera 
     * @param {AbstractObject} gameObject 
     */
    init(camera, gameObject) {
        this.gameObject = gameObject;
        this.camera = camera;
    }

    /**
     * @param {THREE.PerspectiveCamera} camera 
     * @param {number} delta
     */
    // eslint-disable-next-line no-unused-vars
    updateCameraAndControlParams(camera, delta) {
        throw new Error("Not implemented");
    }

}