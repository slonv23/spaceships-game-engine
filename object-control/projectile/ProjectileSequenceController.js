/**
 * @typedef {import('../../physics/object/DirectionalProjectile').default} DirectionalProjectile
 */
import * as THREE from "three";

import AbstractController from "../AbstractController";
import GunRoundVertShader from "../../frontend/shader/gun-round.vert";
import GunRoundFragShader from "../../frontend/shader/gun-round.frag";
import DirectionalProjectile from "../../physics/object/DirectionalProjectile";

export default class ProjectileSequenceController extends AbstractController {

    /** @type {DirectionalProjectile[]} */
    projectiles = [];

    /**
     * @param {THREE.Vector3[]} positions
     * @param {THREE.Vector3} target
     */
    launch(positions, target) {
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

        const material = new THREE.ShaderMaterial({
            vertexShader:   GunRoundVertShader,
            fragmentShader: GunRoundFragShader,
            transparent: true,
        });

        const model = new THREE.Mesh(geometry, material);

        return new DirectionalProjectile(null, model);
    }

}
