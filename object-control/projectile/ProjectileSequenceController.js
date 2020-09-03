/**
 * @typedef {import('three')} THREE
 * @typedef {import('../../physics/object/DirectionalProjectile').default} DirectionalProjectile
 */
import AbstractController from "../AbstractController";

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
            const projectile = this.gameObjectFactory(null);
            projectile.velocity.z = -0.05;
            projectile.position.copy(position);
            projectile.changeDirection(direction); //target/*direction*/);
            this.renderer.scene.add(projectile.object3d);
            this.projectiles.push(projectile);
        }
    }

    async update(dt) {
        this.projectiles.forEach(projectile => {
            projectile.update(dt);
        });
    }

    stop() {
        //this.projectiles
        //throw new Error("Not implemented");
    }

}
