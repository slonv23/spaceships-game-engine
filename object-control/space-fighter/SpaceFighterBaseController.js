/**
 * @typedef {import('../projectile/ProjectileSequenceController').default} ProjectileSequenceController
 * @typedef {import('../../physics/object/SpaceFighter').default} SpaceFighter
 * @typedef {import('../../logging/AbstractLogger').default} AbstractLogger
 * @typedef {import('../../frontend/Renderer').default} Renderer
 * @typedef {import('../../../../node_modules/di-container-js/ComponentFactory')} ComponentFactory
 */
import * as THREE from "three";

import {createQuaternionForRotation} from "../../util/math";
import AbstractObjectController from "../AbstractObjectController";
import CameraManager from "../../frontend/camera/flying-object/CameraManager";
import SpaceFighter from "../../physics/object/SpaceFighter";

export default class SpaceFighterBaseController extends AbstractObjectController {

    /** @type {AbstractLogger} */
    logger;
    /** @type {ComponentFactory} */
    projectileSequenceControllerFactory;

    /** @type {SpaceFighter} */
    gameObject;

    /** @type {THREE.Vector3} TODO maybe change to Vector2 since z component always zero */
    controlX = new THREE.Vector3(1, 0, 0);
    /** @type {THREE.Vector3} */
    controlY = new THREE.Vector3(0, 1, 0);
    /** @type {THREE.Vector3} */
    controlZ = new THREE.Vector3(0, 0, 1);
    /** @type {THREE.Vector3} */
    controlZInWorldCoords = new THREE.Vector3();

    /** @type {THREE.Vector3} */
    rotationDirection = new THREE.Vector3();

    /** @type {THREE.Quaternion} used to convert control axes from local spaceship coordinate system (CS) to world CS */
    controlsQuaternion = new THREE.Quaternion();

    /** @type {THREE.Quaternion} used to convert control axes from local spaceship coordinate system (CS) to world CS */
    controlsRotQuaternion = new THREE.Quaternion();

    /** @type {number} */
    wPitchTarget = 0;
    /** @type {number} */
    wYawTarget = 0;
    /** @type {number} */
    rotationSpeed = 0;

    /** @type {ProjectileSequenceController[]} */
    projectileSequences = [];

    /** @type {ProjectileSequenceController} */
    activeProjectileSequence = null;

    leftProjectileOffset = new THREE.Vector3(-3.18142, 0.185841, -0.214785);

    rightProjectileOffset = new THREE.Vector3(3.18142, 0.185841, -0.214785);

    static dependencies() {
        return ['logger', 'projectileSequenceControllerFactory', ...AbstractObjectController.dependencies()];
    }

    static calculateRotationDirection(nx, ny, yaw, pitch) {
        return nx.clone().multiplyScalar(yaw).add(ny.clone().multiplyScalar(pitch));
    }

    constructor(logger, projectileSequenceControllerFactory, ...args) {
        super(...args);
        this.logger = logger;
        this.projectileSequenceControllerFactory = projectileSequenceControllerFactory;
    }

    launchProjectiles() {
        /** @type {ProjectileSequenceController} */
        const projectileSequenceController = this.projectileSequenceControllerFactory.create();
        this.activeProjectileSequence = projectileSequenceController;
        this.projectileSequences.push(projectileSequenceController);

        const positions = [
            this.leftProjectileOffset.clone().applyMatrix4(this.gameObject.object3d.matrix),
            this.rightProjectileOffset.clone().applyMatrix4(this.gameObject.object3d.matrix)
        ];

        const target = this.gameObject.nz.clone().multiplyScalar(-60)
            .add(this.gameObject.ny.clone().multiplyScalar(CameraManager.verticalShift * 60 / CameraManager.lenBtwSpaceshipAndPosLookAt))
            .add(this.gameObject.position);
        projectileSequenceController.launch(positions, target);//this.gameObject.nz.clone().multiplyScalar(-60).add(this.gameObject.position));
        return projectileSequenceController;
    }

    stopFiring() {
        this.activeProjectileSequence.stop();
        this.activeProjectileSequence = null;
    }

    /**
     * @param {number} delta
     */
    updateProjectiles(delta) {
        for (const projectileSequence of this.projectileSequences) {
            projectileSequence.update(delta);
        }
    }

    /**
     * @param {number} objectId
     * @param {Renderer} [renderer]
     */
    init(objectId, renderer) {
        super.init(objectId, renderer);
        this.controlZInWorldCoords = this.gameObject.nz;
    }

    createObject(objectId) {
        const asset = this.assetManager.get3dAsset('spaceFighter');

        const model = asset.scene.children[0].clone(); //asset.scene.children[0].children[0].clone();
        model.matrixAutoUpdate = false;

        return new SpaceFighter(objectId, model);
    }

    /**
     * @param {number} delta
     */
    updateControlParams(delta) {
        this._updateControlsQuaternion(delta);
        this._calculateRotationDirection();
        this._calculateNormalToRotationDirection(); // used by camera manager
        this._updateAngularVelocities();
    }

    _updateControlsQuaternion(delta) {
        this.controlsQuaternion.multiplyQuaternions(createQuaternionForRotation(this.controlZInWorldCoords, this.gameObject.nz), this.controlsQuaternion);
        if (this.rotationSpeed !== 0) {
            const deltaAngle = this.rotationSpeed * delta;
            this.controlsRotQuaternion.multiply(new THREE.Quaternion(0, 0, deltaAngle * 0.5, 1));
            this.controlsRotQuaternion.normalize();
            this.gameObject.rollAngleBtwCurrentAndTargetOrientation += deltaAngle;
            //this.controlsQuaternion.multiply(new THREE.Quaternion(0, 0, this.rotationSpeed * delta * 0.5, 1));
        }
        this.controlsQuaternion.normalize();
        this.controlZInWorldCoords.set(0, 0, 1).applyQuaternion(this.controlsQuaternion);
    }


    _calculateRotationDirection() {
        /** @type {THREE.Vector3} */
        this.rotationDirection = SpaceFighterBaseController.calculateRotationDirection(this.controlX, this.controlY,
                                                                                       this.wYawTarget, this.wPitchTarget);
        this.rotationDirection.applyQuaternion(this.controlsRotQuaternion).applyQuaternion(this.controlsQuaternion);
    }

    _calculateNormalToRotationDirection() {
        this.normalToRotationDirection = this.gameObject.nz.clone().cross(this.rotationDirection);
    }

    _updateAngularVelocities() {
        this.gameObject.angularVelocity.y = this.gameObject.ny.dot(this.rotationDirection);
        this.gameObject.angularVelocity.x = this.gameObject.nx.dot(this.rotationDirection);
    }

}
