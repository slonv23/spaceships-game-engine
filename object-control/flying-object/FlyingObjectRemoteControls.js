/**
 * @typedef {import('../../net/models/ObjectState').default} ObjectState
 */

import FlyingObjectBaseControls from "./FlyingObjectBaseControls";

export default class FlyingObjectRemoteControls extends FlyingObjectBaseControls {

    rollAngleTarget = 0;

    /**
     * @param {ObjectState} objectState
     */
    sync(objectState) {
        this.controlsQuaternion.copy(objectState.controlQuaternion);
        this.controlX.copy(objectState.controlX);
        this.controlZInWorldCoords.set(0, 0, 1).applyQuaternion(this.controlsQuaternion);
        this.controlY.crossVectors(this.controlX, this.controlZ);
        // calc rotation direction
    }

    /**
     * @param {Mouse} mouseInterface
     * @param {Keyboard} keyboardInterface
     */
    constructor(mouseInterface, keyboardInterface) {
        super();

        this.mouse = mouseInterface;
        this.keyboard = keyboardInterface;
    }

}