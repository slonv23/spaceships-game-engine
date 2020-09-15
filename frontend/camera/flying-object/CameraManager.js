/**
 * @typedef {import('three')} THREE
 */
import * as THREE from 'three';

import {linearTransition, createQuaternionForRotation} from "../../../util/math";
import SpaceFighterBaseController from "../../../object-control/space-fighter/SpaceFighterBaseController";

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

    /**
     * @param {THREE.PerspectiveCamera} camera
     * @param {SpaceFighterBaseController} controller
     */
    init(camera, controller) {
        this.camera = camera;
        this.controller = controller;
        this.camera.matrixWorld.extractBasis(this.cameraX, this.cameraY, this.cameraZ);
    }

    updateCamera(delta) {
        const controller = this.controller;
        if (!controller.initialized) {
            return;
        }

        let cameraAndObjectDirectionsDiff = controller.gameObject.nz.clone().sub(this.cameraZ);

        this.cameraQuaternion.multiplyQuaternions(createQuaternionForRotation(this.cameraZ, controller.gameObject.nz),
                                                  this.cameraQuaternion);
        // this.cameraZ.set(0, 0, 1).applyQuaternion(this.cameraQuaternion);
        this.cameraZ.copy(controller.gameObject.nz);
        this.cameraY.set(0, 1, 0).applyQuaternion(this.cameraQuaternion);
        this.cameraX.set(1, 0, 0).applyQuaternion(this.cameraQuaternion);

        //const rotationDirectionBasedOnCameraAxes = this.cameraX.clone().multiplyScalar(this.controller.wYawTarget).add(this.cameraY.clone().multiplyScalar(this.controller.wPitchTarget));
        const rotationDirectionBasedOnCameraAxes =
            SpaceFighterBaseController.calculateRotationDirection(this.cameraX, this.cameraY, controller.wYawTarget, controller.wPitchTarget);

        let angleBtwControlAndCameraAxes = 0;
        // TODO avoid zero vectors
        const denominator = Math.sqrt(rotationDirectionBasedOnCameraAxes.lengthSq() * controller.rotationDirection.lengthSq());
        if (denominator  !== 0) {
            angleBtwControlAndCameraAxes = rotationDirectionBasedOnCameraAxes.angleTo(controller.rotationDirection);
        }

        // rotate camera
        if (Math.abs(angleBtwControlAndCameraAxes) > 0.0001) {
            const direction = -Math.sign(rotationDirectionBasedOnCameraAxes.dot(controller.normalToRotationDirection));
            const acceleration = controller.rotationSpeed !== 0 ? 5e-7 : 1e-6;

            const result = linearTransition(direction * angleBtwControlAndCameraAxes, this.rotationSpeed, acceleration, delta);
            this.rotationSpeed = result.speed;
            let angleChange = result.distanceChange;
            this.cameraQuaternion.multiply(new THREE.Quaternion(0, 0, angleChange * 0.5, 1));
        }
        this.cameraQuaternion.normalize();

        // update camera position
        this.camera.position.copy(controller.gameObject.position.clone().add(this.cameraZ.clone().multiplyScalar(self.lenBtwCameraAndPosLookAt)));

        // использовать угловые скорости?
        let diffX = -cameraAndObjectDirectionsDiff.dot(this.cameraX);
        let diffY = cameraAndObjectDirectionsDiff.dot(this.cameraY);

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
        let currentPosAndTargetPosDiff =
            this.cameraY.clone().multiplyScalar(this.cameraPositionShift.y)
                                .add(this.cameraX.clone().multiplyScalar(this.cameraPositionShift.x))
                                .add(this.cameraZ.clone().multiplyScalar(positionZ));

        this.camera.position.add(currentPosAndTargetPosDiff);

        const matrixWorld = this.camera.matrixWorld;
        matrixWorld.makeBasis(this.cameraX, this.cameraY, this.cameraZ);
        matrixWorld.setPosition(this.camera.position);
        this.camera.matrixWorldInverse.getInverse(this.camera.matrixWorld);
    }

    _calcPosLookAt() {
        return this.controller.gameObject.position.clone().addScaledVector(this.controller.gameObject.nz, -self.lenBtwSpaceshipAndPosLookAt)
    }

}

const self = CameraManager;
