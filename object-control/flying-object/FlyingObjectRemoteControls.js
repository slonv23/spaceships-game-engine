/**
 * @typedef {import('../../net/models/ObjectState').default} ObjectState
 */

import * as THREE from "three";
import FlyingObjectBaseControls from "./FlyingObjectBaseControls";
import ObjectState from '../../net/models/ObjectState';
import FlyingObject from '../../physics/object/FlyingObject';

export default class FlyingObjectRemoteControls extends FlyingObjectBaseControls {

    rollAngleTargetPrev = 0;

    /**
     * @param {ObjectState} objectState
     */
    sync(objectState) {
        this.syncObject(objectState);

        this.controlsQuaternion.copy(objectState.controlQuaternion);
        this.controlX.copy(objectState.controlX);
        this.controlZInWorldCoords.set(0, 0, 1).applyQuaternion(this.controlsQuaternion);
        this.controlY.crossVectors(this.controlZ, this.controlX);

        // calc rotation direction, yaw and pitch targets
        const inverseQuaternion = this.controlsQuaternion.clone().inverse();
        const nx = this.gameObject.nx.clone();
        const ny = this.gameObject.ny.clone();
        this.rotationDirection = nx.multiplyScalar(objectState.angularVelocity.x).add(ny.multiplyScalar(objectState.angularVelocity.y));
        const rotDirectionInLocalCS = this.rotationDirection.clone().applyQuaternion(inverseQuaternion);
        this.wYawTarget = this.controlX.dot(rotDirectionInLocalCS);
        this.wPitchTarget = this.controlY.dot(rotDirectionInLocalCS);
    }

    /**
     * @param {ObjectState} objectState
     */
    syncObject(objectState) {
        this.gameObject.quaternion.copy(objectState.quaternion);
        this.gameObject.position = objectState.position;
        this.gameObject.velocity.z = objectState.speed;
        this.gameObject.angularVelocity.copy(objectState.angularVelocity);
        this.gameObject.angularAcceleration.copy(objectState.angularAcceleration);
        this.gameObject.rollAngleBtwCurrentAndTargetOrientation = objectState.rollAngleBtwCurrentAndTargetOrientation;
        // on server:
        //this.gameObject.rollAngleBtwCurrentAndTargetOrientation += this.rollAngleTargetPrev - objectState.rollAngleTarget;
        //this.rollAngleTargetPrev = objectState.rollAngleTarget;
    }

    /**
     * @param {InputAction} inputAction
     */
    processInput(inputAction) {
        // TODO ...
    }

    /**
     * @param {number} angle
     * @private
     */
    _rotateControlAxes(angle) {
        super._rotateControlAxes(angle);
        this.gameObject.rollAngleBtwCurrentAndTargetOrientation += angle;
    }

    /********** TESTING **********/

    controlCircleRadius;
    controlCircleRadiusSq;

    /**
     * @param {Mouse} mouseInterface
     * @param {Keyboard} keyboardInterface
     */
    constructor(mouseInterface, keyboardInterface) {
        super();

        this.mouse = mouseInterface;
        this.keyboard = keyboardInterface;

        this.controlCircleRadius = Math.min(window.innerWidth, window.innerHeight) * 0.2;
        this.controlCircleRadiusSq = this.controlCircleRadius ** 2;
    }

    /**
     * @param {number} delta
     */
    updateControlParams(delta) {
        const objectState = new ObjectState();
        objectState.speed = this.gameObject.velocity.z;
        objectState.position = this.gameObject.position;
        objectState.quaternion = this.gameObject.quaternion;

        this._updateControlsQuaternion();
        this._applyUserInputForAngularVelocities();
        objectState.controlX = new THREE.Vector3(1, 0, 0);
        objectState.controlQuaternion = this.controlsQuaternion;

        this._updateAngularVelocities();
        objectState.angularVelocity = this.gameObject.angularVelocity;
        objectState.angularAcceleration = this.gameObject.angularAcceleration;

        // objectState.rollAngleTarget = this._calcTargetSideAngle(); -- wrong

        this.sync(objectState);

        this.normalToRotationDirection = this.gameObject.nz.clone().cross(this.rotationDirection);
    }

    _calcRotationDirection() {
        const directionSign = Math.sign(this.normalToRotationDirection.dot(this.rotationDirectionForNonRotated));
        return directionSign < 0 ? -1 : 1;
    }

    _applyUserInputForAngularVelocities() {
        const mousePos = this._calcMousePosInDimlessUnits();
        this.wPitchTarget = -mousePos[1] * FlyingObject.angularVelocityMax.y;
        this.wYawTarget = mousePos[0] * FlyingObject.angularVelocityMax.x;
    }

    _calcTargetSideAngle() {
        return this.wYawTarget / FlyingObject.angularVelocityMax.x * Math.PI / 6;
    }

    /**
     * @returns {number[]} mouse position where x and y є [-1 1]
     */
    _calcMousePosInDimlessUnits() {
        const mousePos = this.mouse.position.slice();

        // circle bounded
        var distFromCenterSq = mousePos[0]*mousePos[0] + mousePos[1]*mousePos[1];
        if (distFromCenterSq > this.controlCircleRadiusSq) {
            var dimlessDist = this.controlCircleRadius / Math.sqrt(distFromCenterSq);
            mousePos[0] = dimlessDist * mousePos[0];
            mousePos[1] = dimlessDist * mousePos[1];
        }
        mousePos[0] /= this.controlCircleRadius;
        mousePos[1] /= this.controlCircleRadius;

        return mousePos;
    }

}

