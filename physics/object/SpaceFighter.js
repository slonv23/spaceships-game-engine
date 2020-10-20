import * as THREE from "three";

import FlyingObject from "./FlyingObject";
import {linearTransition} from "../../util/math";

export default class SpaceFighter extends FlyingObject {

    // TODO add accelerations for other angular velocity components
    static angularAccelerationAbs = new THREE.Vector3(-1, -1, 0.000005);

    static angularVelocityMax = new THREE.Vector3(0.0006, 0.0006, 0.002);

    /** @type {THREE.Vector3} */
    velocity = new THREE.Vector3(0, 0, -0.005);

    rollAngleBtwCurrentAndTargetOrientation = 0;

    rollOnAngle(rollAngleChange) {
        this.rollAngleBtwCurrentAndTargetOrientation = rollAngleChange;
    }

    /**
     * @param {number} dt - timestep
     * @returns {THREE.Vector3} angle change
     */
    _updateAngularVelocityAndAcceleration(dt) {
        const angleChange = new THREE.Vector3(0, 0, 0);

        angleChange.x = (this.angularVelocity.x + (dt * this.angularAcceleration.x) / 2) * dt;
        angleChange.y = (this.angularVelocity.y + (dt * this.angularAcceleration.y) / 2) * dt;
        if (Math.abs(this.rollAngleBtwCurrentAndTargetOrientation) > 0.0001) {
            const result = linearTransition(this.rollAngleBtwCurrentAndTargetOrientation, this.angularVelocity.z, self.angularAccelerationAbs.z, dt);
            this.angularVelocity.z = result.speed;
            this.angularAcceleration.z = result.acceleration;
            angleChange.z = result.distanceChange;
            this.rollAngleBtwCurrentAndTargetOrientation -= result.distanceChange;
        } else {
            this.angularVelocity.z = 0;
            this.angularAcceleration.z = 0;
            angleChange.z = 0;
        }

        return angleChange;
    }

}

const self = SpaceFighter;
