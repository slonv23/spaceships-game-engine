/**
 * @typedef {import('../../physics/object/AbstractObject').default} AbstractObject
 * @typedef {import('../../physics/object/DirectionalProjectile').default} DirectionalProjectile
 */
import * as THREE from "three";

import AbstractController from "../AbstractController";
import DirectionalProjectile from "../../physics/object/DirectionalProjectile";
import {binarySearchClosestInUniqueArray} from "../../util/array";

const FRAMES_BTW_SHOOTS = 10;

export default class ProjectileSequenceController extends AbstractController {

    /** @type {DirectionalProjectile[]} */
    projectiles = [];

    positions;

    _aimingPointResolver;

    framesFromLastShoot = 0;

    active = true;

    /** @type {AbstractObject} */
    releaser;

    /**
     * @param {THREE.Vector3[]} positions
     */
    launch(positions) {
        this.positions = positions;
        this._launchProjectiles();
    }

    async update(dt) {
        if (this.active) {
            this.framesFromLastShoot++;
            if (this.framesFromLastShoot === FRAMES_BTW_SHOOTS) {
                this.framesFromLastShoot = 0;
                this._launchProjectiles();
            }
        }
        this.projectiles.forEach(projectile => {
            projectile.update(dt);
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

    findHits() {

    }

    /**
     * @param {AbstractObject} gameObject
     */
    findHitsWithObject(gameObject) {
        if (!this.isProjectileIntersectsWithObject(this.projectiles[0], gameObject)) {
            const projectilePosDiffGameObjectPos = gameObject.position.clone().sub(this.projectiles[0].position);
            const isAhead = this.projectiles[0].direction.dot(projectilePosDiffGameObjectPos) > 0;
            if (isAhead) {
                // no need to check all projectiles is sequence, they are all behind of the gameObject
                return null;
            }
        } else {
            // handle intersection
            return [this.projectiles[0]];
        }

        const lastProjectile = this.projectiles[this.projectiles.length - 1];
        if (!this.isProjectileIntersectsWithObject(lastProjectile, gameObject)) {
            const projectilePosDiffGameObjectPos = gameObject.position.clone().sub(lastProjectile.position); //lastProjectile.position.clone().sub(gameObject.position);
            const isBefore = lastProjectile.direction.dot(projectilePosDiffGameObjectPos) < 0;
            if (isBefore) {
                // no need to check all projectiles is sequence, they are all ahead of the gameObject
                return null;
            }
        } else {
            // handle intersection
            return [this.projectiles[this.projectiles.length - 1]];
        }

        const closestProjectile =
            binarySearchClosestInUniqueArray(this.projectiles, projectile => projectile.position.distanceToSquared(gameObject.position),
                                             0, this.projectiles.length - 1);

        if (this.isProjectileIntersectsWithObject(closestProjectile, gameObject)) {
            return [closestProjectile];
        } else {
            return null;
        }
    }

    /**
     * @param {DirectionalProjectile} projectile
     * @param {AbstractObject} gameObject
     */
    isProjectileIntersectsWithObject(projectile, gameObject) {
        const rayCaster = new THREE.Raycaster(projectile.position, projectile.direction);
        const intersections = rayCaster.intersectObject(gameObject.object3d);
        return (intersections.length / 2) % 2 !== 0
    }

}
