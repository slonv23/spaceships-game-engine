/**
 * @typedef {import('three')} THREE
 * @typedef {import('./InputAction').default} InputAction
 */

import AbstractModel from "./AbstractModel";

export default class ObjectState extends AbstractModel {

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
    /* @type {THREE.Vector3}
    angularAcceleration; - currently not supported */
    /** @type {number} */
    rollAngleBtwCurrentAndTargetOrientation = 0;
    /** @type {THREE.Quaternion} */
    controlQuaternion;

    /** @type {InputAction[]} */
    actions;

}
