import * as THREE from 'three';

import AbstractObject from "./AbstractObject";

export default class FlyingObject extends AbstractObject {

    /** @type {THREE.Vector3} components: (wYaw, wPitch, wRoll) */
    angularVelocity = new THREE.Vector3(0, 0, 0);

    angularAcceleration = new THREE.Vector3(0, 0, 0);

    quaternion = new THREE.Quaternion();

    /** @type {THREE.Vector3} z axis */
    nz = (new THREE.Vector3(0, 0, 1));

    /** @type {THREE.Vector3} normal to the side of the ship, local x-axis (right side) */
    nx = new THREE.Vector3(1, 0, 0);

    /** @type {THREE.Vector3} normal to the top of the ship, local y-axis */
    ny = new THREE.Vector3(0, 1, 0);

    /** @type {THREE.Vector3} */
    velocity = new THREE.Vector3(0, 0, 0);

    position = new THREE.Vector3(0, 0, 0);

    rollAngleBtwCurrentAndTargetOrientation = 0;

     /**
      * @param {*} id
      * @param {THREE.Object3D} [object3d]
      */
    constructor(id, object3d) {
        super(id, object3d);
        this.quaternion.setFromAxisAngle(new THREE.Vector3(1, 1, 1), 0);
    }

    rollOnAngle(rollAngleChange) {
        this.rollAngleBtwCurrentAndTargetOrientation = rollAngleChange;
    }

    update(dt) {
        // slow down simulation for debugging:
        // delta = delta / 20;
        const angleChange = this._updateAngularVelocityAndAcceleration(dt);

        /** Update quaternion */
        this.quaternion.multiply(new THREE.Quaternion(angleChange.y * 0.5,
                                                      -angleChange.x * 0.5,
                                                      angleChange.z * 0.5,
                                                      1));
        this.quaternion.normalize();
        this.updateAxes();

        /** Update position */
        this.position.addScaledVector(this.nz, this.velocity.z * dt);

        /** Update underlying object3d */
        this.updateTransformationMatrix();
    }

    updateTransformationMatrix() {
        if (this.object3d) {
            this.object3d.matrix.makeBasis(this.nx, this.ny, this.nz);
            // alternative way to update axes:
            // this.object3d.matrix.makeRotationFromQuaternion(this.quaternion);

            this.object3d.position.copy(this.position);
            this.object3d.matrix.setPosition(this.position);
        }
    }

    updateAxes() {
        this.nx = (new THREE.Vector3(1, 0, 0)).applyQuaternion(this.quaternion);
        this.ny = (new THREE.Vector3(0, 1, 0)).applyQuaternion(this.quaternion);
        this.nz = (new THREE.Vector3(0, 0, 1)).applyQuaternion(this.quaternion);
    }

    /**
     * @param {number} dt - timestep
     * @returns {THREE.Vector3} angle change
     */
    _updateAngularVelocityAndAcceleration(dt) {
        const angleChange = new THREE.Vector3(0, 0, 0);

        angleChange.x = (this.angularVelocity.x + (dt * this.angularAcceleration.x) / 2) * dt;
        angleChange.y = (this.angularVelocity.y + (dt * this.angularAcceleration.y) / 2) * dt;
        angleChange.z = (this.angularVelocity.z + (dt * this.angularAcceleration.z) / 2) * dt;

        return angleChange;
    }

}
