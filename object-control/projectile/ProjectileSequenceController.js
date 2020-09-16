/**
 * @typedef {import('../../physics/object/DirectionalProjectile').default} DirectionalProjectile
 */
import * as THREE from "three";

import AbstractController from "../AbstractController";
import DirectionalProjectile from "../../physics/object/DirectionalProjectile";

export default class ProjectileSequenceController extends AbstractController {

    /** @type {DirectionalProjectile[]} */
    projectiles = [];

    _aimingPointResolver;

    /**
     * @param {THREE.Vector3[]} positions
     */
    launch(positions) {
        /** @type {THREE.Vector3} target */
        const target = this._aimingPointResolver();
        for (const position of positions) {
            const direction = position.clone().sub(target).normalize();
            /** @type {DirectionalProjectile} */
            const projectile = this.createProjectile();
            projectile.velocity.z = -0.05;
            projectile.position.copy(position);
            projectile.changeDirection(direction);

            this.addObjectToScene(projectile);
            this.projectiles.push(projectile);
        }
    }

    async update(dt) {
        this.projectiles.forEach(projectile => {
            projectile.update(dt);
        });
    }

    stop() {
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

}
