/**
 * @typedef {import('protobufjs')} protobuf
 */

import * as THREE from 'three';

export default class ObjectState {

    /** @type {number} */
    id;
    /** @type {number} */
    objectType;
    /** @type {THREE.Vector3} */
    position;
    /** @type {THREE.Quaternion} */
    quaternion;
    /** @type {number} */
    speed;
    /** @type {number} */
    acceleration;
    /** @type {THREE.Vector3} */
    angularVelocity;
    /** @type {THREE.Vector3} */
    angularAcceleration;
    /** @type {number} */
    rollAngle;
    /** @type {number} */
    rollAngleTarget;
    /** @type {THREE.Vector3} */
    controlX;
    /** @type {THREE.Quaternion} */
    controlQuaternion;

    /**
     * @param {protobuf.Message} msg
     */
    constructor(msg) {
        // TODO
    }

}