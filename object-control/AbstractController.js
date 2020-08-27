/**
 * @typedef {import('../asset-management/AssetManager').default} AssetManager
 * @typedef {import('../frontend/Renderer').default} Renderer
 * @typedef {import('di-container-js').default} DiContainer
 */
import AbstractObject from "../physics/object/AbstractObject";

export default class AbstractController {

    /** @type {AssetManager} */
    assetManager;

    /** @type {Function} */
    gameObjectFactory;

    /** @type {DiContainer} */
    diContainer;

    /** @type {Renderer} */
    renderer;

    static dependencies() {
        return ['assetManager', 'diContainer']
    }

    constructor(assetManager, diContainer) {
        this.assetManager = assetManager;
        this.diContainer = diContainer;
    }

    /**
     * @param {number} delta
     */
    // eslint-disable-next-line no-unused-vars
    update(delta) {
        throw new Error("Not implemented");
    }

    async postConstruct({gameObjectFactory}) {
        this.gameObjectFactory = gameObjectFactory;
        if (this.diContainer.isProvided('renderer')) {
            this.renderer = await this.diContainer.get('renderer');
        }
    }

    createObject(objectId) {
        const gameObject = this.gameObjectFactory(objectId, this.assetManager);
        if (!(gameObject instanceof AbstractObject)) {
            throw new Error('Game object instance\'s class must be inherited from AbstractObject');
        }
        if (this.renderer) {
            this.renderer.scene.add(gameObject.object3d);
        }

        return gameObject;
    }

}
