/**
 * @typedef {import('three')} THREE
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
    /** @type {THREE.Vector3} */
    angularAcceleration;
    /** @type {number} */
    rollAngleBtwCurrentAndTargetOrientation;
    /** @type {THREE.Vector3} */
    controlX;
    /** @type {THREE.Quaternion} */
    controlQuaternion;

}
