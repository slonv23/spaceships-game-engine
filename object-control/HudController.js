/**
 * @typedef {import('./AbstractObjectController').default} AbstractObjectController
 * @typedef {import('../frontend/Renderer').default} Renderer
 */
import * as THREE from 'three';

import AbstractController from "./AbstractController";
import SpaceFighterBaseController from "./space-fighter/SpaceFighterBaseController";
import AbstractObjectController from "./AbstractObjectController";

class HudController extends AbstractController {

    objectControllers = [];

    static dependencies() {
        return ['renderer', ...AbstractObjectController.dependencies()];
    }

    constructor(renderer, ...args) {
        super(...args);
        this.renderer = renderer;
        this.stateManager.addEventListener('game-object-created', this.handleGameObjectCreated);
    }

    handleGameObjectCreated(event) {
        /** @type {AbstractObjectController} controller */
        const controller = event.detail;
        if (controller instanceof SpaceFighterBaseController) {
            this.objectControllers.push(controller);
        }
    }

    update(delta) {
        // TODO
    }

}

class GameObjectHud {

    /** @type {AbstractObjectController} controller */
    gameObjectController;
    healthBarContainer;
    healthBar;

    healthBarScale;
    overallScale;

    /**
     * @param {AbstractObjectController} gameObjectController
     * @param {Renderer} renderer
     */
    constructor(gameObjectController, renderer) {
        this.gameObjectController = gameObjectController;

        this.healthBarContainer = this.createHealthBarContainer();
        this.healthBar = this.createHealthBar();
        renderer.sceneOrtho.add(this.healthBarContainer, this.healthBar);
    }

    createHealthBarContainer() {
        const geometry = new THREE.PlaneGeometry(10, 1, 1, 1);
        const material = new THREE.MeshBasicMaterial({color: 0xffff00});
        return new THREE.Mesh(geometry, material);
    }

    createHealthBar() {
        const geometry = new THREE.PlaneGeometry(10, 1, 1, 1);
        const material = new THREE.MeshBasicMaterial({color: 0x46eb34});
        return new THREE.Mesh(geometry, material);
    }

    updatePositionAndScales() {
        // TODO
    }

}


/**
 const geometry = new THREE.SphereGeometry(0.1, 16, 16);
 geometry.applyMatrix(new THREE.Matrix4().makeScale( 2.0, 2.0, 8.0));

 const material = this.createProjectileMaterial();
 let model;
 if (material) {
            model = new THREE.Mesh(geometry, material);
        } else {
            model = new THREE.Mesh(geometry);
        }

 return new DirectionalProjectile(null, model);**/
