/**
 * @typedef {import('three')} THREE
 * @typedef {import('./ObjectState').default} SpaceFighterState
 */

import AbstractModel from "./AbstractModel";

export default class WorldState extends AbstractModel {

    /** @type {number} */
    frameIndex;
    /** @type {SpaceFighterState[]} */
    objectStates;

}
