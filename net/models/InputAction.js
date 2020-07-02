import AbstractModel from "./AbstractModel";

export default class InputAction extends AbstractModel {

    /** @type {number} */
    frameIndex;
    /** @type {number} */
    yaw;
    /** @type {number} */
    pitch;
    /** @type {number} */
    rotationSpeed;
    /** @type {number} */
    rollAngle;
    /** @type {number} */
    objectId;

}
