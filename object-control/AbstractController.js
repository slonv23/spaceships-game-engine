/**
 * @typedef {import('../asset-management/AssetManager').default} AssetManager
 */

export default class AbstractController {

    /** {AssetManager} */
    assetManager;

    /** {function} */
    gameObjectFactory;

    constructor(assetManager) {
        this.assetManager = assetManager;
    }

    /**
     * @param {number} delta
     */
    // eslint-disable-next-line no-unused-vars
    update(delta) {
        throw new Error("Not implemented");
    }

    postConstruct({gameObjectFactory}) {
        this.gameObjectFactory = gameObjectFactory;
    }

}
