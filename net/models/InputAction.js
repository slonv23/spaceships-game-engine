import AbstractModel from "./AbstractModel";

export default class InputAction extends AbstractModel {

    /** @type {number} */
    frameIndex;
    /** @type {number} */
    yaw = 0;
    /** @type {number} */
    pitch = 0;
    /** @type {number} */
    rotationSpeed = 0;
    /** @type {number} */
    rollAngle = 0;
    /** @type {number} */
    objectId;

}
