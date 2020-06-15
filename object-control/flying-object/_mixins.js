import FlyingObject from "../../physics/object/FlyingObject";
import browserKeycodes from "../../util/browser-keycodes";

const rollAngleCorrectionMixin = {
    _correctObjectRollAngle() {
        this.normalToRotationDirection = this.gameObject.nz.clone().cross(this.rotationDirection);
        const currentSideAngle = this._calcSideAngle() * this._calcRotationDirection();
        const targetSideAngle = this._calcTargetSideAngle();
        const angleChange = -targetSideAngle - currentSideAngle;
        this.gameObject.rollOnAngle(angleChange);
    },

    _calcTargetSideAngle() {
        return this.wYawTarget / FlyingObject.angularVelocityMax.x * Math.PI / 6;
    },

    _calcSideAngle() {
        const nx = this.gameObject.nx.clone();
        const ny = this.gameObject.ny.clone();
        this.rotationDirectionForNonRotated = nx.multiplyScalar(this.wYawTarget).add(ny.multiplyScalar(this.wPitchTarget));

        return this.rotationDirectionForNonRotated.angleTo(this.rotationDirection);
    },

    _calcRotationDirection() {
        const directionSign = Math.sign(this.normalToRotationDirection.dot(this.rotationDirectionForNonRotated));
        return directionSign < 0 ? -1 : 1;
    }
}

const applyUserInputMixin = {
    _applyUserInputForRotation() {
        const pressedKey = this.keyboard.getFirstPressedKey();

        this.rotationSpeed = 0;
        if (pressedKey === browserKeycodes.ARROW_LEFT) {
            this.rotationSpeed = 0.0006;
        } else if (pressedKey === browserKeycodes.ARROW_RIGHT) {
            this.rotationSpeed = -0.0006;
        }
    },

    _applyUserInputForAngularVelocities() {
        const mousePos = this._calcMousePosInDimlessUnits();
        this.wPitchTarget = -mousePos[1] * FlyingObject.angularVelocityMax.y;
        this.wYawTarget = mousePos[0] * FlyingObject.angularVelocityMax.x;
    }
};

export {
    rollAngleCorrectionMixin,
    applyUserInputMixin
}