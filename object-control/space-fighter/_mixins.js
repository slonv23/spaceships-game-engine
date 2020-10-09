/**
 * @typedef {import('./SpaceFighterMultiplayerController').default} SpaceFighterMultiplayerController
 * @typedef {import('./RemoteSpaceFighterController').default} RemoteSpaceFighterController
 * @typedef {import('../../net/models/ObjectState').default} ObjectState
 * @typedef {import('../../net/models/ObjectAction').default} ObjectAction
 * @typedef {import('../../net/models/space-fighter/SpaceFighterState').default} SpaceFighterState
 * @typedef {import('../../net/models/space-fighter/SpaceFighterInput').default} SpaceFighterInput
 * @typedef {import('../../net/models/space-fighter/SpaceFighterStopFire').default} SpaceFighterStopFire
 * @typedef {import('../../net/models/space-fighter/SpaceFighterGotHit').default} SpaceFighterGotHit
 */

import SpaceFighterBaseController from "./SpaceFighterBaseController";
import SpaceFighterGotHit from "../../net/models/space-fighter/SpaceFighterGotHit";

/**
 * @mixin SyncStateMixin
 * @this RemoteSpaceFighterController|SpaceFighterMultiplayerController
 */
export const syncStateMixin = {
    /**
     * @param {ObjectState} objectState
     */
    _sync(objectState) {
        /** @type {SpaceFighterState} */
        const spaceFighterState = objectState.spaceFighterState;
        this._syncObject(spaceFighterState);

        //this.health = spaceFighterState.health;
        this.controlsQuaternion.copy(spaceFighterState.controlQuaternion);
        this.controlsRotQuaternion.copy(spaceFighterState.controlRotQuaternion);
        this.controlZInWorldCoords.set(0, 0, 1).applyQuaternion(this.controlsQuaternion);

        // calc rotation direction, yaw and pitch targets
        this.rotationDirection = SpaceFighterBaseController.calculateRotationDirection(this.gameObject.nx,
                                                                                       this.gameObject.ny,
                                                                                       spaceFighterState.angularVelocity.x,
                                                                                       spaceFighterState.angularVelocity.y);
        this.wYawTarget = this.controlX.clone()
            .applyQuaternion(this.controlsRotQuaternion)
            .applyQuaternion(this.controlsQuaternion)
            .dot(this.rotationDirection);
        this.wPitchTarget = this.controlY.clone()
            .applyQuaternion(this.controlsRotQuaternion)
            .applyQuaternion(this.controlsQuaternion)
            .dot(this.rotationDirection);
    },

    /**
     * @param {SpaceFighterState} objectState
     * @protected
     */
    _syncObject(objectState) {
        const lastPosDiffNewPos = this.gameObject.position.distanceTo(this.gameObject.position);
        if (lastPosDiffNewPos !== 0) {
            this.logger.debug(`Current and new object positions diverge on ${lastPosDiffNewPos}`);
        }

        this.gameObject.quaternion.copy(objectState.quaternion);
        this.gameObject.position = objectState.position;
        this.gameObject.object3d.position.copy(objectState.position);
        this.gameObject.object3d.matrix.setPosition(objectState.position);
        this.gameObject.velocity.z = objectState.speed;
        this.gameObject.angularVelocity.copy(objectState.angularVelocity);
        //this.gameObject.angularAcceleration.copy(objectState.angularAcceleration);
        this.gameObject.rollAngleBtwCurrentAndTargetOrientation = objectState.rollAngleBtwCurrentAndTargetOrientation;

        this.gameObject.updateTransformationMatrix();
    },

    /**
     * @param {ObjectAction} objectAction
     */
    processInput(objectAction) {
        if (objectAction.spaceFighterInput) {
            this.handleInputAction(objectAction.spaceFighterInput);
        } else if (objectAction.spaceFighterOpenFire) {
            this.handleOpenFireAction(objectAction.frameIndex, objectAction.spaceFighterOpenFire);
        } else if (objectAction.spaceFighterDestroy) {
            // eslint-disable-next-line no-empty
        } else if (objectAction.spaceFighterStopFire) {
            this.handleStopFireAction(objectAction.spaceFighterStopFire);
        } else if (objectAction.spaceFighterGotHit) {
            this.handleGotHitAction(objectAction.spaceFighterGotHit);
        }
    },

    /**
     * @param {SpaceFighterInput} inputAction
     */
    applyInputAction(inputAction) {
        this.gameObject.rollAngleBtwCurrentAndTargetOrientation += inputAction.rollAngle;
        // inputAction.rollAngle - this.rollAnglePrev //;this.rollAnglePrev - inputAction.rollAngle;
        this.rollAnglePrev = inputAction.rollAngle;
        this.wYawTarget = inputAction.yaw;
        this.wPitchTarget = inputAction.pitch;
        this.rotationSpeed = inputAction.rotationSpeed;
    },

    /**
     * @param {SpaceFighterGotHit} spaceFighterGotHit
     */
    handleGotHitAction(spaceFighterGotHit) {
        const projectileSequence = SpaceFighterBaseController.projectileSequencesById[spaceFighterGotHit.projectileSeqId];
        if (projectileSequence) {
            let deltaHealth = 10;
            projectileSequence.removeProjectileByIndex(spaceFighterGotHit.projectileIndex1);
            console.log('Remove projectile by index ' + spaceFighterGotHit.projectileIndex1);
            if (spaceFighterGotHit.projectileIndex2) {
                projectileSequence.removeProjectileByIndex(spaceFighterGotHit.projectileIndex2);
                console.log('Remove projectile by index' + spaceFighterGotHit.projectileIndex2);
                deltaHealth = 20;
            }

            const gameObjectController = this.stateManager.controllersByObjectId[projectileSequence.releaser.id];
            this.stateManager.controllersByObjectId[projectileSequence.releaser.id].health = Math.max(0, gameObjectController.health - deltaHealth);
        }
    }

};

/**
 * @mixin HandleProjectileHitsMixin
 * @this RemoteSpaceFighterController|SpaceFighterMultiplayerController
 */
export const handleProjectileHitsMixin = {

    afterUpdate() {
        this.processHits();
    },

    processHits() {
        for (let i = 0; i < this.projectileSequences.length; i++) {
            const projectileSequence = this.projectileSequences[i];
            const hits = projectileSequence.findHitsAndRemoveIntersectedProjectiles();
            for (const hit of hits) {
                console.log('Got hit!!!');
                const intersectedProjectilesCount = !!hit.projectileIndex1 + !!hit.projectileIndex2;
                hit.gameObjectController.health = Math.max(0, hit.gameObjectController.health - 10 * intersectedProjectilesCount);

                const spaceFighterGotHitAction = new SpaceFighterGotHit();
                spaceFighterGotHitAction.projectileSeqId = projectileSequence.projectileSeqId;
                spaceFighterGotHitAction.projectileIndex1 = hit.projectileIndex1;
                spaceFighterGotHitAction.projectileIndex2 = hit.projectileIndex2;
                this.stateManager.addObjectAction(hit.gameObjectController.gameObject.id, spaceFighterGotHitAction);
            }
        }
    },

};
