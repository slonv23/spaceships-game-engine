import ObjectState from '../../net/models/ObjectState';
import FlyingObject from '../../physics/object/FlyingObject';
import browserKeycodes from "../../util/browser-keycodes";
import InputAction from "../../net/models/InputAction";
import RemoteFlyingObjectController from "./FlyingObjectRemoteController";

export default class RemoteFlyingObjectControllerTest extends RemoteFlyingObjectController {

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
        /** create InputAction */
        const mousePos = this._calcMousePosInDimlessUnits();
        const wPitchTarget = -mousePos[1] * FlyingObject.angularVelocityMax.y;
        const wYawTarget = mousePos[0] * FlyingObject.angularVelocityMax.x;
        const rollAngle = wYawTarget / FlyingObject.angularVelocityMax.x * Math.PI / 6;

        const pressedKey = this.keyboard.getFirstPressedKey();

        let rotationSpeed = 0;
        if (pressedKey === browserKeycodes.ARROW_LEFT) {
            rotationSpeed = 0.0006;
        } else if (pressedKey === browserKeycodes.ARROW_RIGHT) {
            rotationSpeed = -0.0006;
        }

        const inputAction = new InputAction();
        inputAction.rotationSpeed = rotationSpeed;
        inputAction.pitch = wPitchTarget;
        inputAction.yaw = wYawTarget;
        inputAction.rollAngle = rollAngle;

        /** process InputAction */
        this.processInput(inputAction);

        /** create ObjectState */
        const objectState = new ObjectState();
        objectState.speed = this.gameObject.velocity.z;
        objectState.position = this.gameObject.position;
        objectState.quaternion = this.gameObject.quaternion;

        this._updateControlsQuaternion();
        if (this.rotationSpeed !== 0) {
            this._rotateControlAxes(this.rotationSpeed * delta);
        }
        objectState.controlX = this.controlX; // interesting effect when disabled // new THREE.Vector3(1, 0, 0);
        objectState.controlQuaternion = this.controlsQuaternion;

        this._updateAngularVelocities();
        objectState.angularVelocity = this.gameObject.angularVelocity;
        objectState.angularAcceleration = this.gameObject.angularAcceleration;
        objectState.rollAngleBtwCurrentAndTargetOrientation = this.gameObject.rollAngleBtwCurrentAndTargetOrientation;

        /** process ObjectState */
        this.sync(objectState);

        /** needed for CameraManager */
        this.normalToRotationDirection = this.gameObject.nz.clone().cross(this.rotationDirection);
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

