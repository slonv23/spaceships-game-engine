/**
 * @typedef {import('../../net/models/ObjectState').default} ObjectState
 */

import * as THREE from "three";
import FlyingObjectBaseControls from "./FlyingObjectBaseControls";
import ObjectState from '../../net/models/ObjectState';
import FlyingObject from '../../physics/object/FlyingObject';

export default class FlyingObjectRemoteControls extends FlyingObjectBaseControls {

    /**
     * @param {ObjectState} objectState
     */
    sync(objectState) {
        this.syncObject(objectState);

        this.controlsQuaternion.copy(objectState.controlQuaternion);
        this.controlX.copy(objectState.controlX);
        this.controlZInWorldCoords.set(0, 0, 1).applyQuaternion(this.controlsQuaternion);
        this.controlY.crossVectors(this.controlZ, this.controlX);

        const inverseQuaternion = this.controlsQuaternion.inverse();

        // calc rotation direction
        const yaw = objectState.angularVelocity.x;
        const pitch = objectState.angularVelocity.y;
        console.log('rotationDirection_old x: ' + this.rotationDirection.x + 'y: ' + this.rotationDirection.y + 'z: ' + this.rotationDirection.z);
        this.rotationDirection = this.gameObject.nx.clone().multiplyScalar(yaw).add(this.gameObject.ny.clone().multiplyScalar(pitch)).applyQuaternion(inverseQuaternion);
        // this.rotationDirection = this.controlX.clone().multiplyScalar(yaw).add(this.controlY.clone().multiplyScalar(pitch)).applyQuaternion(inverseQuaternion);
        console.log('rotationDirection_new x: ' + this.rotationDirection.x + 'y: ' + this.rotationDirection.y + 'z: ' + this.rotationDirection.z);
        //this.wYawTarget = this.controlX.dot(this.rotationDirection);
        //this.wPitchTarget = this.controlY.dot(this.rotationDirection);
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
        // this.gameObject.rollAngleTarget = objectState.rollAngleTarget;
    }

    /**
     * @param angle
     * @private
     */
    _rotateControlAxes(angle) {
        super._rotateControlAxes(angle);
        this.gameObject.rollAngleTarget += angle;
    }

    /********** TESTING **********/

    rollAngleTargetPrev = 0;

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
        //console.log("angularVelocity.x: " + objectState.angularVelocity.x + ", " + "this.wYawTarget: " + objectState.angularVelocity.y);
        objectState.angularAcceleration = this.gameObject.angularAcceleration;
        const newSideAngle = this._calcTargetSideAngle();
        objectState.rollAngleTarget += this.rollAngleTargetPrev - newSideAngle;
        this.rollAngleTargetPrev = newSideAngle;

        this.sync(objectState);

        this.normalToRotationDirection = this.gameObject.nz.clone().cross(this.rotationDirection);
    }

    _applyUserInputForAngularVelocities() {
        const mousePos = this._calcMousePosInDimlessUnits();
        this.wPitchTarget = -mousePos[1] * FlyingObject.angularVelocityMax.y;
        this.wYawTarget = mousePos[0] * FlyingObject.angularVelocityMax.x;
        //console.log("mousePos[1] : " + mousePos[1]  + ", " + "mousePos[0] : " + mousePos[0]);
        //console.log("this.wPitchTarget: " + this.wPitchTarget + ", " + "this.wYawTarget: " + this.wYawTarget);
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

