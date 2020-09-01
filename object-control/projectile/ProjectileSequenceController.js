/**
 * @typedef {import('../../physics/object/DirectionalProjectile').default} DirectionalProjectile
 */
import AbstractProjectileController from "./AbstractProjectileController";

export default class ProjectileSequenceController extends AbstractProjectileController {

    /** @type {DirectionalProjectile[]} */
    projectiles = [];

    launch(position, direction) {
        /** @type {DirectionalProjectile} */
        const projectile = this.gameObjectFactory(null);
        projectile.velocity.z = -0.007;
        projectile.position.copy(position);
        projectile.direction.copy(direction);
        this.renderer.scene.add(projectile.object3d);
        this.projectiles.push(projectile);
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
