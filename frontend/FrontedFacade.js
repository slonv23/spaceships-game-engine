/**
 * @typedef {import('three')} THREE
 * @typedef {import('../asset-management/AssetManager').default} AssetManager
 * @typedef {import('../state/MultiplayerStateManager').default} StateManager
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
    delta = 0;
    timestep;

    /** @type {AbstractController} */
    /*_controls = {
        updateControlParams: () => {}
    };*/

    /** @type {CameraManager} TODO use abstract base class */
    _cameraManager = {
        updateCamera: () => {}
    };

    constructor(assetManager, multiplayerStateManager, renderer, diContainer) {
        this.assetManager = assetManager;
        this.renderer = renderer;
        this.stateManager = multiplayerStateManager;
        this.diContainer = diContainer;
    }

    postConstruct({fps = 60} = {}) {
        this.timestep = 1000 / fps;
    }

    startGameLoop() {
        requestAnimationFrame((timestamp) => {
            this.lastFrameTimeMs = timestamp;

            // initial drawing
            this.renderer.render();

            requestAnimationFrame(this.gameLoop);
        });
    }

    gameLoop = async (timestamp) => {
        if (timestamp < this.lastFrameTimeMs + this.timestep) {
            requestAnimationFrame(this.gameLoop);
            return;
        }
        this.delta += timestamp - this.lastFrameTimeMs;
        this.lastFrameTimeMs = timestamp;

        while (this.delta >= this.timestep) {
            await this.stateManager.update(this.timestep);
            // TODO do not update camera while stateManager is not ready
            this._cameraManager.updateCamera(this.timestep);
            this.delta -= this.timestep;
        }

        this.renderer.render();

        requestAnimationFrame(this.gameLoop);
    };

    /**
     * @param {string} spriteName
     * @returns {THREE.Sprite}
     */
    createSprite(spriteName) {
        const sprite = this.assetManager.getSprite(spriteName).clone();
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

        cameraManager.init(this.renderer.camera, controller);

        this._cameraManager = cameraManager;
    }

}
