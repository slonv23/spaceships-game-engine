/**
 * @typedef {import('three')} THREE
 * @typedef {import('../../../physics/object/FlyingObject').default} FlyingObject
 * @typedef {import('./FlyingObjectControls').default} FlyingObjectControls
 */

import * as THREE from 'three';
import FlyingObject from "../../../physics/object/FlyingObject";
import {linearTransition, createQuaternionForRotation} from "../../../util/math";

export default class CameraManager {

    static lenBtwSpaceshipAndPosLookAt = 8;

    static lenBtwCameraAndPosLookAt = 10;

    /** @type {THREE.PerspectiveCamera} */
    camera;

    /** @type {FlyingObject} */
    gameObject

    /** @type {FlyingObjectControls} */
    controls;

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
     * @param {FlyingObject} gameObject 
     * @param {FlyingObjectControls} controls
     */
    init(camera, gameObject, controls) {
        this.camera = camera;
        this.gameObject = gameObject;
        this.controls = controls;
        this.camera.matrixWorld.extractBasis(this.cameraX, this.cameraY, this.cameraZ);
    }

    updateCamera(wYawTarget, wPitchTarget, delta) {
        let cameraAndObjectDirectionsDiff = this.controls.controlZ.clone().sub(this.cameraZ);

        this.cameraQuaternion.multiplyQuaternions(createQuaternionForRotation(this.cameraZ, this.controls.gameObject.nz), this.cameraQuaternion);
        this.cameraZ.set(0, 0, 1).applyQuaternion(this.cameraQuaternion);
        this.cameraY.set(0, 1, 0).applyQuaternion(this.cameraQuaternion);
        this.cameraX.set(1, 0, 0).applyQuaternion(this.cameraQuaternion);
        
        const angleBtwControlAndCameraAxes = this.cameraY.angleTo(this.controls.controlY);

        // rotate camera
        if (Math.abs(angleBtwControlAndCameraAxes) > 0.0001) {
            const direction = Math.sign(this.cameraY.dot(this.controls.controlX));
            const acceleration = this.controls.rotationSpeed !== 0 ? 5e-7 : 1e-6;
            
            const result = linearTransition(direction * angleBtwControlAndCameraAxes, this.rotationSpeed, acceleration, delta);
            this.rotationSpeed = result.speed;
            let angleChange = result.distanceChange;
            this.cameraQuaternion.multiply(new THREE.Quaternion(0, 0, angleChange * 0.5, 1));
        }
        this.cameraQuaternion.normalize();

        // update camera position
        this.camera.position.copy(this.gameObject.object3d.position.clone().add(this.cameraZ.clone().multiplyScalar(self.lenBtwCameraAndPosLookAt)));

        let diffX = -cameraAndObjectDirectionsDiff.dot(this.cameraX);
        let diffY = cameraAndObjectDirectionsDiff.dot(this.cameraY);

        const maxShiftX = 3, maxShiftY = 4, sphereRadius = 7; // sphereRadius = 6;
        const targetPositionShift = new THREE.Vector2(100 * diffX * maxShiftX, 2 - 100 * diffY * maxShiftY);

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
    }

    _calcPosLookAt() {
        return this.gameObject.object3d.position.clone().addScaledVector(this.gameObject.nz, -self.lenBtwSpaceshipAndPosLookAt)
    }

}

const self = CameraManager;