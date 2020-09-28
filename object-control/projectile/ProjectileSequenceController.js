/**
 * @typedef {import('../../physics/object/AbstractObject').default} AbstractObject
 * @typedef {import('../../physics/object/DirectionalProjectile').default} DirectionalProjectile
 * @typedef {import('../../physics/object/FlyingObject').default} FlyingObject
 */
import * as THREE from "three";

import AbstractController from "../AbstractController";
import DirectionalProjectile from "../../physics/object/DirectionalProjectile";
import {binarySearchClosestInUniqueArray} from "../../util/array";

const FRAMES_BTW_SHOOTS = 10;

export default class ProjectileSequenceController extends AbstractController {

    /** @type {DirectionalProjectile[]} */
    projectiles = []; // TODO create projectiles pool and re-use them instead of removing

    activeProjectilesCount = 0;

    startIndex = 0;
    endIndex = 0;

    positions;

    _aimingPointResolver;

    framesFromLastShoot = 0;

    active = true;

    /** @type {AbstractObject} */
    releaser;

    /** @type {number} projectiles are removed if minimum squared distance to any game object is greater than this value */
    distanceToObjectLimitSq = 1000;

    /**
     * @param {THREE.Vector3[]} positions
     */
    launch(positions) {
        // TODO also set resolver for positions
        this.positions = positions;
        this._launchProjectiles();
    }

    update(dt) {
        if (this.active) {
            this.framesFromLastShoot++;
            if (this.framesFromLastShoot === FRAMES_BTW_SHOOTS) {
                this.framesFromLastShoot = 0;
                this._launchProjectiles();
            }
        }
        this.projectiles.forEach(projectile => {
            if (projectile) {
                projectile.update(dt);
            }
        });
    }

    stop() {
        this.active = false;
    }

    _launchProjectiles() {
        /** @type {THREE.Vector3} target */
        const target = this._aimingPointResolver();
        for (const position of this.positions) {
            const direction = position.clone().sub(target).normalize();
            /** @type {DirectionalProjectile} */
            const projectile = this.createProjectile();
            projectile.velocity.z = -0.1; //-0.05;
            projectile.position.copy(position);
            projectile.changeDirection(direction);

            this.addObjectToScene(projectile);
            this.projectiles.push(projectile);
            projectile.index = this.projectiles.length - 1;
            this.endIndex = projectile.index;
            this.activeProjectilesCount++;
        }
    }

    createProjectile() {
        const geometry = new THREE.SphereGeometry(0.1, 16, 16);
        geometry.applyMatrix(new THREE.Matrix4().makeScale( 2.0, 2.0, 8.0));

        const material = this.createProjectileMaterial();
        let model;
        if (material) {
            model = new THREE.Mesh(geometry, material);
        } else {
            model = new THREE.Mesh(geometry);
        }

        return new DirectionalProjectile(null, model);
    }

    createProjectileMaterial() {
        return null;
    }

    setAimingPointResolver(aimingPointResolver) {
        this._aimingPointResolver = aimingPointResolver;
    }

    /**
     * @description Set game object which released projectiles, it will ignored in findHits checks
     * @param {AbstractObject} gameObject
     */
    setReleaser(gameObject) {
        this.releaser = gameObject;
    }

    findAndHandleHits() {
        if (!this.activeProjectilesCount) {
            return;
        }

        let minDistanceToObjects = Infinity;
        for (const objectId in this.stateManager.controllersByObjectId) {
            const gameObjectController = this.stateManager.controllersByObjectId[objectId];
            if (objectId !== this.releaser.id.toString()) {
                const hits = this.findHitsWithObject(gameObjectController.gameObject);
                for (const projectile of hits) {
                    gameObjectController.health = Math.max(0, gameObjectController.health - 10);
                    this._removeProjectile(projectile);
                }
            }

            if (!this.activeProjectilesCount) {
                return;
            }

            const dist = this._distFromObjectToFirstProjectile(gameObjectController.gameObject);
            if (dist < minDistanceToObjects) {
                minDistanceToObjects = dist;
            }
        }

        if (minDistanceToObjects > this.distanceToObjectLimitSq) {
            this._removeProjectile(this.projectiles[this.startIndex]);
        }
    }

    /**
     * @param {AbstractObject} gameObject
     */
    findHitsWithObject(gameObject) {
        const firstPair = [this.projectiles[this.startIndex]];
        if (this.startIndex % 2 === 0) {
            firstPair.push(this.projectiles[this.startIndex+1]);
        }

        const intersectionsWithFirstPair = this._findIntersectionsWithProjectiles(gameObject, firstPair);
        if (intersectionsWithFirstPair.length) {
            return intersectionsWithFirstPair;
        } else {
            const projectilePosDiffGameObjectPos = gameObject.position.clone().sub(this.projectiles[this.startIndex].position);
            const isGameObjectAhead = this.projectiles[this.startIndex].direction.dot(projectilePosDiffGameObjectPos) > 0;
            if (isGameObjectAhead) {
                // no need to check all projectiles is sequence, they are all behind of the gameObject
                return [];
            }
        }

        const lastPair = [this.projectiles[this.endIndex]];
        if (this.endIndex % 2 === 1) {
            lastPair.push(this.projectiles[this.endIndex - 1]);
        }
        const intersectionsWithLastPair = this._findIntersectionsWithProjectiles(gameObject, lastPair);
        if (intersectionsWithLastPair.length) {
            return intersectionsWithLastPair;
        } else {
            const projectilePosDiffGameObjectPos = gameObject.position.clone().sub(this.projectiles[this.endIndex].position);
            const isGameObjectBefore = this.projectiles[this.endIndex].direction.dot(projectilePosDiffGameObjectPos) < 0;
            if (isGameObjectBefore) {
                // no need to check all projectiles is sequence, they are all ahead of the gameObject
                return [];
            }
        }

        // get two most closest projectiles
        const projectilesToCheck = this.projectiles
            .slice(this.startIndex + 1 + (1 - this.startIndex % 2), this.endIndex - 1 - (this.endIndex % 2))
            .filter(Boolean);
        if (!projectilesToCheck.length) {
            return [];
        }

        const closestProjectile = binarySearchClosestInUniqueArray(
            projectilesToCheck,
            projectile => {
                projectile.position.distanceToSquared(gameObject.position)
                console.log(projectilesToCheck);
            },
            0,
            projectilesToCheck.length - 1
        );
        const nextProjectileInPair = this.projectiles[closestProjectile.index + 1 - 2 * (closestProjectile.index % 2)];

        return this._findIntersectionsWithProjectiles(gameObject, [closestProjectile, nextProjectileInPair]);
    }

    _findIntersectionsWithProjectiles(gameObject, projectiles) {
        const intersections = [];
        for (const projectile of projectiles) {
            if (this.isProjectileIntersectsWithObject(projectile, gameObject)) {
                intersections.push(projectile);
            }
        }

        return intersections;
    }

    /**
     * @param {FlyingObject} gameObject
     * @returns {number}
     * @private
     */
    _distFromObjectToFirstProjectile(gameObject) {
        const projectile = this.projectiles[this.startIndex];
        if (projectile) {
            // projectile already removed
            return gameObject.position.clone().sub(projectile.position).lengthSq();
        } else {
            return 0;
        }
    }

    /**
     * @param {DirectionalProjectile} projectile
     * @private
     */
    _removeProjectile(projectile) {
        this.projectiles[projectile.index] = null;
        this.renderer.scene.remove(projectile.object3d);
        this.activeProjectilesCount--;
        if (projectile.index === this.startIndex) {
            while (this.startIndex < this.projectiles.length && !this.projectiles[this.startIndex]) {
                this.startIndex++;
            }
        } else if (projectile.index === this.endIndex) {
            while (this.endIndex !== 0 && !this.projectiles[this.endIndex]) {
                this.endIndex--;
            }
        }
    }

    /**
     * @param {DirectionalProjectile|null} projectile
     * @param {AbstractObject} gameObject
     */
    isProjectileIntersectsWithObject(projectile, gameObject) {
        if (!projectile) {
            return false;
        }
        const rayCaster = new THREE.Raycaster(projectile.position, projectile.direction);
        const intersections = rayCaster.intersectObject(gameObject.object3d);
        return (intersections.length / 2) % 2 !== 0
    }

    shouldBeRemoved() {
        return !this.activeProjectilesCount && !this.active;
    }

}
