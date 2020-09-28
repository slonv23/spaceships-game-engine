import * as THREE from 'three';

import AbstractObject from "./AbstractObject";
import {createQuaternionForRotation} from "../../util/math";

export default class DirectionalProjectile extends AbstractObject {

    /** @type {THREE.Vector3} */
    velocity = new THREE.Vector3(0, 0, 0);

    position = new THREE.Vector3(0, 0, 0);

    direction = new THREE.Vector3(0, 0, 1);

    /** @type {number} */
    index;

    /** @type {AbstractObject} */
    intersectsWith;

    update(dt) {
        this.position.addScaledVector(this.direction, this.velocity.z * dt);
        this.object3d.matrix.setPosition(this.position);
    }

    changeDirection(newDirection) {
        // TODO create constants for each vector that represent primary axes, i.e. (1, 0, 0), (0, 1, 0) ...
        this.object3d.matrix.makeRotationFromQuaternion(createQuaternionForRotation(new THREE.Vector3(0, 0, 1), newDirection));
        this.direction = newDirection;
    }

}
