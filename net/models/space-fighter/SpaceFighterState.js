/**
 * @typedef {import('three')} THREE
 * @typedef {import('./S').default} SpaceFighterInput
 */

import AbstractModel from "../AbstractModel";
/**
 * @typedef {import('../ObjectAction').default} ObjectAction
 */

export default class SpaceFighterState extends AbstractModel {

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

    /** @type {ObjectAction[]} */
    actions;

}
