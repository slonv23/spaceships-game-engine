/**
 * @typedef {import('three')} THREE
 * @typedef {import('../../frontend/input/Mouse').default} Mouse
 * @typedef {import('../../frontend/input/Keyboard').default} Keyboard
 * @typedef {import('../../logging/AbstractLogger').default} AbstractLogger
 * @typedef {import('../../asset-management/AssetManager').default} AssetManager
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

    static dependencies() {
        return ['mouseInterface', 'keyboardInterface', ...SpaceFighterBaseController.dependencies()];
    }

     /**
      * @param {Mouse} mouseInterface
      * @param {Keyboard} keyboardInterface
      * @param {Array} args
      */
    constructor(mouseInterface, keyboardInterface, ...args) {
        super(...args);
        this.mouse = mouseInterface;
        this.keyboard = keyboardInterface;

        this.controlCircleRadius = Math.min(window.innerWidth, window.innerHeight) * 0.2;
        this.controlCircleRadiusSq = this.controlCircleRadius ** 2;
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

    _determineRotationSpeed() {
        const pressedKey = this.keyboard.getFirstPressedKey();

        if (pressedKey === browserKeycodes.ARROW_LEFT) {
            return 0.0006;
        } else if (pressedKey === browserKeycodes.ARROW_RIGHT) {
            return -0.0006;
        }

        return 0;
    }

    _applyUserInputForRotation() {
        this.rotationSpeed = this._determineRotationSpeed();
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
        //return -Math.PI / 6;
        return this.wYawTarget / SpaceFighter.angularVelocityMax.x * Math.PI / 6;
        //return this.wYawTarget / SpaceFighter.angularVelocityMax.x * Math.PI / 6;
    }

    _calcSideAngle() {
        const nx = this.gameObject.nx.clone();
        const ny = this.gameObject.ny.clone();
        this.rotationDirectionForNonRotated = nx.multiplyScalar(this.wYawTarget).add(ny.multiplyScalar(this.wPitchTarget));

        const denominator = Math.sqrt(this.rotationDirectionForNonRotated.lengthSq() * this.rotationDirection.lengthSq());
        if (denominator !== 0) {
            console.log('_calcSideAngle: ' + this.rotationDirectionForNonRotated.angleTo(this.rotationDirection))
            return this.rotationDirectionForNonRotated.angleTo(this.rotationDirection);
        } else {
            console.log('_calcSideAngle: ' + 0);
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
