/**
 * @typedef {import('./space-fighter/SpaceFighterInput').default} SpaceFighterInput
 * @typedef {import('./space-fighter/SpaceFighterOpenFire').default} SpaceFighterOpenFire
 * @typedef {import('./space-fighter/SpaceFighterDestroy').default} SpaceFighterDestroy
 * @typedef {import('./space-fighter/SpaceFighterStopFire').default} SpaceFighterStopFire
 */

import AbstractModel from "./AbstractModel";

export default class ObjectAction extends AbstractModel {

    /** @type {number} */
    objectId;
    /** @type {number} */
    frameIndex;
    /** @type {string} - type of action */
    action;
    /** @type {?SpaceFighterInput} */
    spaceFighterInput;
    /** @type {?SpaceFighterOpenFire} */
    spaceFighterOpenFire;
    /** @type {?SpaceFighterDestroy} */
    spaceFighterDestroy;
    /** @type {?SpaceFighterStopFire} */
    spaceFighterStopFire;

}
