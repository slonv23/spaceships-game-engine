/**
 * @typedef {import('../asset-management/AssetManager').default} AssetManager
 * @typedef {import('../frontend/Renderer').default} Renderer
 * @typedef {import('di-container-js').default} DiContainer
 */
import AbstractObject from "../physics/object/AbstractObject";

export default class AbstractController {

    /** @type {AssetManager} */
    assetManager;

    /** @type {DiContainer} */
    diContainer;

    /** @type {Renderer} */
    renderer;

    static dependencies() {
        return ['assetManager', 'stateManager', 'diContainer'];
    }

    constructor(assetManager, stateManager, diContainer) {
        this.assetManager = assetManager;
        this.stateManager = stateManager;
        this.diContainer = diContainer;
    }

    /**
     * @param {number} delta
     * @param {number} frameIndex
     * @abstract
     */
    // eslint-disable-next-line no-unused-vars
    update(delta, frameIndex) {
        throw new Error("Not implemented");
    }

    addObjectToScene(gameObject) {
        if (!(gameObject instanceof AbstractObject)) {
            throw new Error('Game object instance\'s class must be inherited from AbstractObject');
        }
        if (this.renderer) {
            this.renderer.scene.add(gameObject.object3d);
        }

        return gameObject;
    }

}
