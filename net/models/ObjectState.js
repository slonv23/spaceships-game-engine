/**
 * @typedef {import('./space-fighter/SpaceFighterState').default} SpaceFighterState
 */

import AbstractModel from "./AbstractModel";

export default class ObjectState extends AbstractModel {

    /** @type {number} */
    id;
    /** @type {number} */
    objectType;
    /** @type {string} - type of state */
    state;
    /** @type {?SpaceFighterState} */
    spaceFighterState;

}
