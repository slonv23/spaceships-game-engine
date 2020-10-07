/**
 * @typedef {import('../AbstractObjectController').default} AbstractObjectController
 */

export default class Hit {

    /**
     * @param {AbstractObjectController} gameObjectController
     * @param {number} projectileIndex1
     * @param {number} projectileIndex2
     */
    constructor(gameObjectController, projectileIndex1, projectileIndex2) {
        this.gameObjectController = gameObjectController;
        this.projectileIndex1 = projectileIndex1;
        this.projectileIndex2 = projectileIndex2;
    }

}
