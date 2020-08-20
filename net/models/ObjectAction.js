import AbstractModel from "./AbstractModel";

export default class ObjectAction extends AbstractModel {

    /** @type {number} */
    objectId;
    /** @type {number} */
    frameIndex;
    /** @type {string} - type of action */
    action;
    spaceFighterInput;
    spaceFighterOpenFire;
    spaceFighterDestroy;

}
