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
        // TODO controller game object can be null, refactor
        this.camera = camera;
        this.controller = controller;
        this.camera.matrixWorld.extractBasis(this.cameraX, this.cameraY, this.cameraZ);
        //this.gameObjectNzPrev = controller.gameObject.nz.clone();
    }

    updateCamera(delta) {
        const controller = this.controller;
        if (!controller.initialized) {
            return;
        }

        this.calculateCameraPosition(delta);
        this.calculateCameraDirection();

        //this.cameraZ.copy(controller.gameObject.nz);
        //this.cameraY.copy(controller.gameObject.ny);
        //this.cameraX.copy(controller.gameObject.nx);

        const matrixWorld = this.camera.matrixWorld;
        matrixWorld.makeBasis(this.cameraX, this.cameraY, this.cameraZ);
        matrixWorld.setPosition(this.camera.position);
        this.camera.matrixWorldInverse.getInverse(this.camera.matrixWorld);
        return;

    }

    calculateCameraDirection() {
        /** @type {THREE.Vector3} */
        const aimingPoint = this.controller.getAimingPoint();
        const targetDirection = this.camera.position.clone().sub(aimingPoint).normalize(); //aimingPoint.clone().sub(this.camera.position).normalize();

        this.cameraQuaternion.multiplyQuaternions(createQuaternionForRotation(this.cameraZ, targetDirection),
                                                  this.cameraQuaternion);
        // this.cameraZ.set(0, 0, 1).applyQuaternion(this.cameraQuaternion);
        this.cameraZ.copy(targetDirection);
        this.cameraY.set(0, 1, 0).applyQuaternion(this.cameraQuaternion);
        this.cameraX.set(1, 0, 0).applyQuaternion(this.cameraQuaternion);
    }

    calculateCameraPosition(delta) {
        const controller = this.controller;
        const directionChange = controller.gameObject.nz.clone().sub(this.gameObjectNzPrev);
        this.gameObjectNzPrev.copy(controller.gameObject.nz);
        let diffX = -directionChange.dot(this.cameraX);
        let diffY = directionChange.dot(this.cameraY);

        const positionUnshifted = controller.gameObject.position.clone()
            .add(controller.gameObject.nz.clone().multiplyScalar(self.lenBtwCameraAndPosLookAt));

        const maxShiftX = 3, maxShiftY = 4, sphereRadius = 7; // sphereRadius = 6;
        const targetPositionShift = new THREE.Vector2(100 * diffX * maxShiftX, self.verticalShift - 100 * diffY * maxShiftY);

        // smoothing
        const currentAndTargetPosShiftDiff = targetPositionShift.sub(this.cameraPositionShift);
        if (currentAndTargetPosShiftDiff.length() > 0.0001) { // TODO optimize
            const result = linearTransition(currentAndTargetPosShiftDiff.length(), this.cameraPositionConvergeSpeed, 1e-5, delta);
            const multiplier = result.distanceChange;
            this.cameraPositionConvergeSpeed = result.speed;
            this.cameraPositionShift.add(currentAndTargetPosShiftDiff.normalize().multiplyScalar(multiplier));
        }
        const positionZ = sphereRadius - Math.sqrt(sphereRadius*sphereRadius - this.cameraPositionShift.x ** 2 - this.cameraPositionShift.y ** 2);

        let cameraPositionShiftInGameObjectLocalCoords =
            this.controller.gameObject.ny.clone().multiplyScalar(this.cameraPositionShift.y)//this.cameraPositionShift.y)
                .add(this.controller.gameObject.nx.clone().multiplyScalar(this.cameraPositionShift.x))//this.cameraPositionShift.x))
                .add(this.controller.gameObject.nz.clone().multiplyScalar(positionZ));

        this.camera.position.copy(positionUnshifted.add(cameraPositionShiftInGameObjectLocalCoords));
    }

    _calcPosLookAt() {
        return this.controller.gameObject.position.clone().addScaledVector(this.controller.gameObject.nz, -self.lenBtwSpaceshipAndPosLookAt)
    }

}

const self = CameraManager;
