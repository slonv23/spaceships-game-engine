/**
 * @typedef {import('three')} THREE
 * @typedef {import('./asset-managment/AssetManager').default} AssetManager
 * @typedef {import('../state/StateManager').default} StateManager
 * @typedef {import('./Renderer').default} Renderer
 */

import AbstractControls from "./control/AbstractControls";
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

    /** @type {AbstractControls} */
    _controls = {
        updateCameraAndControlParams: () => {}
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
            this._controls.updateCameraAndControlParams(this.timestep);
            this.delta -= this.timestep;
        }

        this.renderer.render();

        requestAnimationFrame(this.gameLoop);
    };

    async createObject(id, classRef, modelName) {
        if (!(classRef.prototype instanceof AbstractObject)) {
            throw new Error('Class must be inherited from AbstractObject');
        }

        let gameObject = new classRef(id, this.assetManager.getModel(modelName));
        gameObject.object3d.matrixAutoUpdate = false;
        this.renderer.scene.add(gameObject.object3d);
        this.stateManager.addObject(gameObject);

        return gameObject;
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

    /**
     * @param {string|symbol} ref 
     * @param {AbstractObject} gameObject 
     */
    async switchControls(ref, gameObject) {
        let controls = await this.diContainer.get(ref);
        if (!controls) {
            throw new Error('Component not found');
        }

        if(!(controls instanceof AbstractControls)) {
            throw new Error('Class must be inherited from AbstractControls');
        }

        controls.init(this.renderer.camera, gameObject, this);
        
        this._controls = controls;
    }

}