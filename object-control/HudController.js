/**
 * @typedef {import('./AbstractObjectController').default} AbstractObjectController
 * @typedef {import('./space-fighter/SpaceFighterBaseController').default} SpaceFighterBaseController
 * @typedef {import('../frontend/Renderer').default} Renderer
 */
import * as THREE from 'three';

import AbstractController from "./AbstractController";
import SpaceFighterBaseController from "./space-fighter/SpaceFighterBaseController";
import AbstractObjectController from "./AbstractObjectController";
import SpaceFighterMultiplayerController from "./space-fighter/SpaceFighterMultiplayerController";

export default class HudController extends AbstractController {

    /** @type {GameObjectHud[]} */
    gameObjectHuds = [];

    static dependencies() {
        return ['renderer', ...AbstractObjectController.dependencies()];
    }

    constructor(renderer, ...args) {
        super(...args);
        this.renderer = renderer;
        this.stateManager.addEventListener('game-object-created', this.handleGameObjectCreated);
    }

    handleGameObjectCreated = (event) => {
        /** @type {AbstractObjectController} controller */
        const controller = event.detail;
        if ((controller instanceof SpaceFighterBaseController)/* && !(controller instanceof SpaceFighterMultiplayerController)*/) {
            this.gameObjectHuds.push(new GameObjectHud(controller, this.renderer));
        }
    };

    // eslint-disable-next-line no-unused-vars
    update(delta) {
        for (const gameObjectHud of this.gameObjectHuds) {
            gameObjectHud.updatePositionAndScales();
        }
    }

}

class GameObjectHud {

    /** @type {SpaceFighterBaseController} controller */
    gameObjectController;
    /** @type {THREE.Object3D} */
    healthBarContainer;
    /** @type {THREE.Object3D} */
    healthBar;

    healthBarWidth = 3.5;

    healthBarScale;
    overallScale;

    /**
     * @param {SpaceFighterBaseController} gameObjectController
     * @param {Renderer} renderer
     */
    constructor(gameObjectController, renderer) {
        this.gameObjectController = gameObjectController;
        this.renderer = renderer;

        this.healthBarContainer = this.createHealthBarContainer();
        this.healthBar = this.createHealthBar();
        this.healthBarContainer.matrixAutoUpdate = false;
        this.healthBar.matrixAutoUpdate = false;
        renderer.scene.add(this.healthBarContainer, this.healthBar);
        //renderer.sceneOrtho.add(this.healthBarContainer, this.healthBar);
    }

    createHealthBarContainer() {
        const geometry = new THREE.PlaneGeometry(this.healthBarWidth, 0.5, 1, 1);
        const material = new THREE.MeshBasicMaterial({color: 0xffff00});
        material.side = THREE.DoubleSide;
        return new THREE.Mesh(geometry, material);
    }

    createHealthBar() {
        const geometry = new THREE.PlaneGeometry(this.healthBarWidth, 0.5, 1, 1);
        const material = new THREE.MeshBasicMaterial({color: 0x46eb34});
        material.side = THREE.DoubleSide;
        return new THREE.Mesh(geometry, material);
    }

    updatePositionAndScales() {
        if (!this.gameObjectController.gameObject) {
            // TODO add property that controller removed
            // controller removed
            this.renderer.scene.remove(this.healthBarContainer, this.healthBar);
        }
        const cameraZAxis = new THREE.Vector3();
        const cameraYAxis = new THREE.Vector3();
        const cameraXAxis = new THREE.Vector3();
        cameraZAxis.setFromMatrixColumn(this.renderer.camera.matrixWorld, 2);
        cameraYAxis.setFromMatrixColumn(this.renderer.camera.matrixWorld, 1);
        cameraXAxis.setFromMatrixColumn(this.renderer.camera.matrixWorld, 0);

        const position = this.gameObjectController.gameObject.position.clone()
            //.add(this.gameObjectController.gameObject.ny.clone().multiplyScalar(3));
            .add(cameraYAxis.multiplyScalar(3));

        this.healthBarContainer.matrix.copy(this.renderer.camera.matrixWorld);
        this.healthBar.matrix.copy(this.renderer.camera.matrixWorld);
        this.healthBarContainer.matrix.setPosition(position.clone().sub(cameraZAxis.multiplyScalar(0.001)));

        const healthBarScale = this.gameObjectController.health / 100;
        this.healthBar.matrix.scale(new THREE.Vector3(healthBarScale, 1, 1));
        this.healthBar.matrix.setPosition(position.sub(cameraXAxis.multiplyScalar((this.healthBarWidth - this.healthBarWidth * healthBarScale) / 2)));
    }

}
