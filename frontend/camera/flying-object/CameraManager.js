/**
 * @typedef {import('three')} THREE
 */
import * as THREE from 'three';

import {linearTransition, createQuaternionForRotation} from "../../../util/math";
import SpaceFighterBaseController from "../../../object-control/space-fighter/SpaceFighterBaseController";
import SpaceFighter from "../../../physics/object/SpaceFighter";

const wYawMax = SpaceFighter.angularVelocityMax.x;
const wPitchMax = SpaceFighter.angularVelocityMax.y;

export default class CameraManager {

    static verticalShift = 2;

    static lenBtwSpaceshipAndPosLookAt = 8;

    static lenBtwCameraAndPosLookAt = 12; //10;

    /** @type {THREE.PerspectiveCamera} */
    camera;

    /** @type {SpaceFighterBaseController} */
    controller;

    /** @type {THREE.Vector3} */
    cameraX = new THREE.Vector3();
    /** @type {THREE.Vector3} */
    cameraY = new THREE.Vector3();
    /** @type {THREE.Vector3} */
    cameraZ = new THREE.Vector3();

    /** @type {THREE.Quaternion} */
    cameraQuaternion = new THREE.Quaternion();

    /** @type {THREE.Vector2} */
    cameraPositionShift = new THREE.Vector2(0, 0);

    rotationSpeed = 0;

    cameraPositionConvergeSpeed = 0;

    /** @type {THREE.Vector3} */
    gameObjectNzPrev = new THREE.Vector3();

    /**
     * @param {THREE.PerspectiveCamera} camera
     * @param {SpaceFighterBaseController} controller
     */
    init(camera, controller) {
        this.camera = camera;
        this.controller = controller;
        this.camera.matrixWorld.extractBasis(this.cameraX, this.cameraY, this.cameraZ);
        debugger;
        //this.gameObjectNzPrev = controller.gameObject.nz.clone();
        debugger;
    }

    updateCamera(delta) {
        const controller = this.controller;
        if (!controller.initialized) {
            return;
        }

        this.calculateCameraPosition();
        this.cameraZ.copy(controller.gameObject.nz);
        this.cameraY.copy(controller.gameObject.ny);
        this.cameraX.copy(controller.gameObject.nx);
        const matrixWorld = this.camera.matrixWorld;
        matrixWorld.makeBasis(this.cameraX, this.cameraY, this.cameraZ);
        matrixWorld.setPosition(this.camera.position);
        this.camera.matrixWorldInverse.getInverse(this.camera.matrixWorld);
        return;

    }

    calculateCameraPosition() {
        const controller = this.controller;
        const directionChange = controller.gameObject.nz.clone().sub(this.gameObjectNzPrev);
        this.gameObjectNzPrev.copy(controller.gameObject.nz);
        let diffX = -directionChange.dot(this.cameraX);
        let diffY = directionChange.dot(this.cameraY);

        const positionUnshifted = controller.gameObject.position.clone()
            .add(controller.gameObject.nz.clone().multiplyScalar(self.lenBtwCameraAndPosLookAt));

        const maxShiftX = 3, maxShiftY = 4, sphereRadius = 7; // sphereRadius = 6;
        const targetPositionShift = new THREE.Vector2(100 * diffX * maxShiftX, self.verticalShift - 100 * diffY * maxShiftY);
        const positionZ = sphereRadius - Math.sqrt(sphereRadius*sphereRadius - this.cameraPositionShift.x ** 2 - this.cameraPositionShift.y ** 2);


        let currentPosAndTargetPosDiff =
            this.controller.gameObject.ny.clone().multiplyScalar(targetPositionShift.y)//this.cameraPositionShift.y)
                .add(this.controller.gameObject.nx.clone().multiplyScalar(targetPositionShift.x))//this.cameraPositionShift.x))
                .add(this.controller.gameObject.nz.clone().multiplyScalar(positionZ));

        this.camera.position.copy(positionUnshifted.add(currentPosAndTargetPosDiff));
    }

    _calcPosLookAt() {
        return this.controller.gameObject.position.clone().addScaledVector(this.controller.gameObject.nz, -self.lenBtwSpaceshipAndPosLookAt)
    }

}

const self = CameraManager;
