/**
 * @typedef {import('three')} THREE
 * @typedef {import('../../frontend/input/Mouse').default} Mouse
 * @typedef {import('../../frontend/input/Keyboard').default} Keyboard
 * @typedef {import('../../logging/AbstractLogger').default} AbstractLogger
 */

import SpaceFighter from "../../physics/object/SpaceFighter";
import browserKeycodes from "../../util/browser-keycodes";
import SpaceFighterBaseController from './SpaceFighterBaseController';

export default class SpaceFighterSingleplayerController extends SpaceFighterBaseController {

    /** @type {Mouse} */
    mouse;

    /** @type {Keyboard} */
    keyboard;

    /** user can change yaw and pitch by moving cursor to desired direction,
     * but only in specified limits */
    controlCircleRadius;
    controlCircleRadiusSq;

    /** @type {THREE.Vector3} */
    normalToRotationDirection;

     /**
      * @param {Mouse} mouseInterface
      * @param {Keyboard} keyboardInterface
      * @param {AbstractLogger} logger
      */
    constructor(mouseInterface, keyboardInterface, logger) {
        super(logger);
        this.mouse = mouseInterface;
        this.keyboard = keyboardInterface;

        this.controlCircleRadius = Math.min(window.innerWidth, window.innerHeight) * 0.2;
        this.controlCircleRadiusSq = this.controlCircleRadius ** 2;
    }

    postConstruct({enableAxesHelper} = {}) {
        this.enableAxesHelper = enableAxesHelper;
    }

    /**
     * @param {SpaceFighter} gameObject
     */
    init(gameObject) {
        super.init(gameObject);
        this.controlZInWorldCoords = gameObject.nz;
    }

    /**
     * @param {number} delta
     */
    updateControlParams(delta) {
        this._applyUserInputForRotation();
        this._applyUserInputForAngularVelocities();

        super.updateControlParams(delta);

        this._correctObjectRollAngle();
    }

    _applyUserInputForRotation() {
        const pressedKey = this.keyboard.getFirstPressedKey();

        this.rotationSpeed = 0;
        if (pressedKey === browserKeycodes.ARROW_LEFT) {
            this.rotationSpeed = 0.0006;
        } else if (pressedKey === browserKeycodes.ARROW_RIGHT) {
            this.rotationSpeed = -0.0006;
        }
    }

    _applyUserInputForAngularVelocities() {
        const mousePos = this._calcMousePosInDimlessUnits();
        this.wPitchTarget = -mousePos[1] * SpaceFighter.angularVelocityMax.y;
        this.wYawTarget = mousePos[0] * SpaceFighter.angularVelocityMax.x;
    }

    _correctObjectRollAngle() {
        const currentSideAngle = this._calcSideAngle() * this._calcRotationDirection();
        const targetSideAngle = this._calcTargetSideAngle();
        const angleChange = targetSideAngle - currentSideAngle;
        //const angleChange = -targetSideAngle - currentSideAngle;
        this.gameObject.rollOnAngle(angleChange);
    }

    _calcTargetSideAngle() {
        return -this.wYawTarget / SpaceFighter.angularVelocityMax.x * Math.PI / 6;
        //return this.wYawTarget / SpaceFighter.angularVelocityMax.x * Math.PI / 6;
    }

    _calcSideAngle() {
        const nx = this.gameObject.nx.clone();
        const ny = this.gameObject.ny.clone();
        this.rotationDirectionForNonRotated = nx.multiplyScalar(this.wYawTarget).add(ny.multiplyScalar(this.wPitchTarget));
        if (this.rotationDirectionForNonRotated.lengthSq() * this.rotationDirection.lengthSq() > 0.0001) {
            return this.rotationDirectionForNonRotated.angleTo(this.rotationDirection);
        } else {
            // if yaw and pitch are too small than rotation direction will be close to zero vector
            return 0;
        }
    }

    _calcRotationDirection() {
        const directionSign = Math.sign(this.normalToRotationDirection.dot(this.rotationDirectionForNonRotated));
        return directionSign < 0 ? -1 : 1;
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