/**
 * @typedef {import('three')} THREE
 * @typedef {import('./asset-management/AssetManager').default} AssetManager
 * @typedef {import('../state/StateManager').default} StateManager
 * @typedef {import('./Renderer').default} Renderer
 * @typedef {import('./camera/flying-object/CameraManager').default} CameraManager
 */

import AbstractController from "../object-control/AbstractController";
import AbstractObject from "../physics/object/AbstractObject";

export default class FrontendFacade {

    /** @type {AssetManager} */
    assetManager;

    /** @type {StateManager} */
    stateManager;

    /** @type {Renderer} */
    renderer;

    /** Timing */
    lastFrameTimeMs;
    maxFPS = 60;
    delta = 0;
    timestep = 1000 / 60;

    /** @type {AbstractController} */
    /*_controls = {
        updateControlParams: () => {}
    };*/

    /** @type {CameraManager} TODO use abstract base class */
    _cameraManager = {
        updateCamera: () => {}
    };

    constructor(assetManager, stateManager, renderer, diContainer) {
        this.assetManager = assetManager;
        this.renderer = renderer;
        this.stateManager = stateManager;
        this.diContainer = diContainer;
    }

    startGameLoop() {
        requestAnimationFrame((timestamp) => {
            this.lastFrameTimeMs = timestamp;

            // initial drawing
            this.renderer.render();

            requestAnimationFrame(this.gameLoop);
        });
    }

    gameLoop = (timestamp) => {
        if (timestamp < this.lastFrameTimeMs + (1000 / this.maxFPS)) {
            requestAnimationFrame(this.gameLoop);
            return;
        }
        this.delta += timestamp - this.lastFrameTimeMs;
        this.lastFrameTimeMs = timestamp;

        while (this.delta >= this.timestep) {
            this.stateManager.update(this.timestep);
            this._cameraManager.updateCamera(this.timestep);
            this.delta -= this.timestep;
        }

        this.renderer.render();

        requestAnimationFrame(this.gameLoop);
    };

    async createObject(id, objectClass, modelName, controllerRef) {
        if (!(objectClass.prototype instanceof AbstractObject)) {
            throw new Error('Class must be inherited from AbstractObject');
        }

        const model = this.assetManager.getModel(modelName);

        const controller = await this.stateManager.createObject(id, objectClass, controllerRef, model);
        this.renderer.scene.add(controller.gameObject.object3d);

        return controller;
    }

    /**
     * @param {string} spriteName
     * @returns {Promise<THREE.Sprite>}
     */
    async createSprite(spriteName) {
        const sprite = this.assetManager.getSprite(spriteName);
        this.renderer.sceneOrtho.add(sprite);

        return sprite;
    }

    async attachCameraManager(cameraManagerRef, controller) {
        /** @type {CameraManager} */
        const cameraManager = await this.diContainer.get(cameraManagerRef);
        if (!cameraManager) {
            throw new Error('Component not found');
        }

        // TODO add base class check
        /*if (!(cameraManager instanceof AbstractCameraManager)) {
            throw new Error('Class must be inherited from AbstractCameraManager');
        }*/

        cameraManager.init(this.renderer.camera, controller.gameObject, controller);

        this._cameraManager = cameraManager;
    }

}
