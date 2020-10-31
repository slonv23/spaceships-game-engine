/**
 * @typedef {import('../../physics/object/SpaceFighter').default} SpaceFighter
 */
import * as THREE from "three";

import AbstractController from "../AbstractController";
import ParticleEngine, {Type} from "../../frontend/utils/particle-engine/ParticleEngine";
import Tween from "../../frontend/utils/particle-engine/Tween";
import AbstractObjectController from "../AbstractObjectController";

//import DecompositionFragmentShader from "../../frontend/shader/decomposition.frag";
import DecompositionVertexShader from "../../frontend/shader/decomposition.vert";

export class SpaceFighterExplosionController extends AbstractController {

    progress = 0;

    static dependencies() {
        return ['renderer', ...AbstractObjectController.dependencies()];
    }

    static decompositionVertShaderParts = [];

    constructor(renderer, ...args) {
        super(...args);
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
        this.particleEngine = new ParticleEngine(this.renderer.scene);
        this.particleEngine.setValues(this.particleEngineParameters);
        this.particleEngine.initialize();

        const asset = this.assetManager.get3dAsset('spaceFighterFractured');
        /** @type {THREE.Object3D} */
        const model = asset.scene;
        // this._createDecompositionMaterial(model.children[0].material.map);

        // all children have same material, instead of creating new ShaderMaterial we will extend existing
        this.decompositionMaterial = model.children[0].material;
        this.decompositionMaterial.onBeforeCompile = (shader) => {
            shader.vertexShader = shader.vertexShader.replace(
                '#include <clipping_planes_pars_vertex>',
                [
                    '#include <clipping_planes_pars_vertex>',
                    SpaceFighterExplosionController.decompositionVertShaderParts[0]
                ].join("\n")
            ).replace(
                '#include <fog_vertex>',
                [
                    '#include <fog_vertex>',
                    SpaceFighterExplosionController.decompositionVertShaderParts[1]
                ].join("\n")
            );

            shader.uniforms.progress = {value: 0};
            //shader.userData.progress = {value: 0};
            this.decompositionMaterial.userData.shader = shader;

            console.log('SHADER COMPILED!!!');
            this.decompositionMaterialReady = true;
        };

        for (const mesh of model.children) {
            //mesh.material = this.decompositionMaterial;

            let verticesCount = mesh.geometry.attributes.position.array.length / 3;

            const centroid = mesh.position; // this.getCentroid(mesh.geometry);
            const rotationSpeed = Math.random() * 0.03 + 0.03; // 0.006;
            const rotationAxis = this._randomUnitVector();

            const centroidAttributes = new Array(verticesCount * 3).fill(0);
            const rotationAxisAttributes = new Array(verticesCount * 3).fill(0);
            const rotationSpeedAttributes = new Array(verticesCount).fill(0);

            for (let i = 0, j = 0; i < verticesCount * 3; i = i + 3, j = j + 1) {
                centroidAttributes[i] = centroid.x;
                centroidAttributes[i + 1] = centroid.y;
                centroidAttributes[i + 2] = centroid.z;
                rotationAxisAttributes[i] = rotationAxis.x;
                rotationAxisAttributes[i + 1] = rotationAxis.y;
                rotationAxisAttributes[i + 2] = rotationAxis.z;
                rotationSpeedAttributes[j] = rotationSpeed;
            }

            mesh.geometry.setAttribute('abc', new THREE.BufferAttribute(new Float32Array(centroidAttributes), 3));
            mesh.geometry.setAttribute('rtAxis', new THREE.BufferAttribute(new Float32Array(rotationAxisAttributes), 3));
            mesh.geometry.setAttribute('rtSpeed', new THREE.BufferAttribute(new Float32Array(rotationSpeedAttributes), 1));
        }

        //debugger
        model.position.set(0, 0, -50); // = new THREE.Vector3(0, 0, -50);
        //model.matrixWorldNeedsUpdate =
        this.renderer.scene.add(model);
    }

    update(delta) {
        if (this.decompositionMaterialReady) {
            this.decompositionMaterial.userData.shader.uniforms.progress.value += delta;
        }

        this.particleEngine.update(delta);

        if (!this.particleEngine.emitterAlive && !this.particleEngine.aliveParticlesCount) {
            this.particleEngine.destroy();
            this.stateManager.removeController(this);
        }
    }

    static splitDecompositionShaderToParts() {
        const mainFuncFirstLine = "void main() {";
        const mainFuncFirstLineIndex = DecompositionVertexShader.indexOf(mainFuncFirstLine);
        const mainFuncLastLineIndex = DecompositionVertexShader.lastIndexOf('}');

        const outerPart = DecompositionVertexShader.substring(0, mainFuncFirstLineIndex);
        const innerPart = DecompositionVertexShader.substring(mainFuncFirstLineIndex + mainFuncFirstLine.length, mainFuncLastLineIndex);

        SpaceFighterExplosionController.decompositionVertShaderParts.push(outerPart);
        SpaceFighterExplosionController.decompositionVertShaderParts.push(innerPart)
    }

    _randomUnitVector() {
        const vect = new THREE.Vector3(Math.random(), Math.random(), Math.random());
        vect.normalize();
        return vect;
    }

    /*_createDecompositionMaterial(textureMap) {
        this.decompositionMaterial = new THREE.ShaderMaterial({
            uniforms: {
                texture1: {value: textureMap},
                progress: {value: 0}
            },
            vertexShader:   DecompositionVertexShader,
            fragmentShader: DecompositionFragmentShader
        });
    }*/

}

SpaceFighterExplosionController.splitDecompositionShaderToParts();