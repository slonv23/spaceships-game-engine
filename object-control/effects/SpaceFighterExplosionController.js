/**
 * @typedef {import('../../physics/object/SpaceFighter').default} SpaceFighter
 */
import * as THREE from "three";

import AbstractController from "../AbstractController";
import ParticleEngine, {Type} from "../../frontend/utils/particle-engine/ParticleEngine";
import Tween from "../../frontend/utils/particle-engine/Tween";

export class SpaceFighterExplosionController extends AbstractController {

    progress = 0;

    /** @type {THREE.Object3D} */
    fragmentedModel;

    constructor(fragmentedModel, renderer, ...args) {
        super(...args);
        this.fragmentedModel = fragmentedModel;
        this.renderer = renderer;

        this.particleEngineParameters = {
            positionStyle  : Type.SPHERE,
            positionBase   : new THREE.Vector3(0, 0, -50),
            positionRadius : 2,

            velocityStyle : Type.SPHERE,
            speedBase     : 40, //40,
            speedSpread   : 8,

            particleTexture : this.assetManager.getTexture('smoke'),

            sizeTween    : new Tween( [0, 0.1], [1, 150] ),
            opacityTween : new Tween( [0.7, 1], [1, 0] ),
            colorBase    : new THREE.Vector3(0.02, 1, 0.4),
            blendStyle   : THREE.AdditiveBlending,

            particlesPerSecond : 360,
            particleDeathAge   : 3, //1.5,
            emitterDeathAge    : 1, //60
        };
    }

    /**
     * @param {SpaceFighter} spaceFighter
     */
    init(spaceFighter) {
        this.particleEngineParameters.positionBase.copy(spaceFighter.position)
        this.particleEngine = new ParticleEngine(this.renderer.scene);
        this.particleEngine.setValues(this.particleEngineParameters);
        this.particleEngine.initialize();

        // all children have same material, instead of creating new ShaderMaterial we will extend existing
        this.decompositionMaterial = this.fragmentedModel.children[0].material;

        //this.fragmentedModel.position.set(0, 0, -100);
        this.fragmentedModel.matrixAutoUpdate = false;
        this.fragmentedModel.matrix.copy(spaceFighter.object3d.matrixWorld);
        this.renderer.scene.add(this.fragmentedModel);
    }

    // eslint-disable-next-line no-unused-vars
    update(delta, frameIndex) {
        if (this.decompositionMaterial.userData.shader/*this.decompositionMaterialReady*/) {
            this.decompositionMaterial.userData.shader.uniforms.progress.value += delta;
        }

        this.particleEngine.update(delta);

        if (!this.particleEngine.emitterAlive && !this.particleEngine.aliveParticlesCount) {
            this.particleEngine.destroy();
            this.renderer.scene.remove(this.fragmentedModel);
            this.stateManager.removeController(this);
        }
    }

}
