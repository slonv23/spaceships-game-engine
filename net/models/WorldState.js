/**
 * @typedef {import('three')} THREE
 * @typedef {import('./ObjectState').default} ObjectState
 */

import AbstractModel from "./AbstractModel";

export default class WorldState extends AbstractModel {

    /** @type {number} */
    frameIndex;
    /** @type {ObjectState[]} */
    objectStates;

}
