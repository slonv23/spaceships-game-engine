import * as THREE from "three";

import AbstractObjectController from "../AbstractObjectController";
import DecompositionVertexShader from "../../frontend/shader/decomposition.vert";
import {SpaceFighterExplosionController} from "./SpaceFighterExplosionController";

// Related links
// https://discourse.threejs.org/t/per-object-uniforms/9091/5
// https://discourse.threejs.org/t/chainable-onbeforecompile-uniforms-per-mesh/8905
// https://github.com/Fyrestar/Material-Plugins/blob/master/MaterialPlugins.js
// https://jsfiddle.net/Fyrestar/xczvwdf6/1/
export class SpaceFighterExplosionControllerFactory {

    static dependencies() {
        return ['assetManager', 'renderer', ...AbstractObjectController.dependencies()];
    }

    dependencies;

    decompositionVertShaderParts = [];

    /** @type {THREE.Object3D} */
    fragmentedModel;

    constructor(assetManager, ...args) {
        this.assetManager = assetManager;
        this.dependencies = args;
    }

    postConstruct() {
        this._splitDecompositionShaderToParts();
        this.matOnBeforeCompile = function(material, shader) {
            shader.vertexShader = shader.vertexShader.replace(
                '#include <clipping_planes_pars_vertex>',
                [
                    '#include <clipping_planes_pars_vertex>',
                    this.decompositionVertShaderParts[0]
                ].join("\n")
            ).replace(
                '#include <fog_vertex>',
                [
                    '#include <fog_vertex>',
                    this.decompositionVertShaderParts[1]
                ].join("\n")
            );

            shader.uniforms.progress = {value: 0};
            //this.decompositionMaterial.userData.shader = shader;
            material.userData.shader = shader;
        };

        const asset = this.assetManager.get3dAsset('spaceFighterFractured');
        /** @type {THREE.Object3D} */
        const model = asset.scene;

        // all children have same material, instead of creating new ShaderMaterial we will extend existing
        //this.decompositionMaterial = model.children[0].material;
        //this.decompositionMaterial.onBeforeCompile = ;

        for (const mesh of model.children) {
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

        this.fragmentedModel = model;
    }

    create() {
        const clonedFM = this.fragmentedModel.clone(true);
        /*clonedFM.children[0].onBeforeRender = (r, s, c, g, material) => {
            if (material.userData.shader) {
                material.userData.shader.uniforms.progress.value = 0.0;
                clonedFM.children[0].onBeforeRender = () => {};
            }
        };*/
        const newMat = clonedFM.children[0].material.clone();
        newMat.onBeforeCompile = this.matOnBeforeCompile.bind(this, newMat);

        clonedFM.traverse(function(object) {
            if (object.isMesh) {
                object.material = newMat;
            }
        });

        return new SpaceFighterExplosionController(clonedFM, ...this.dependencies);
    }

    _splitDecompositionShaderToParts() {
        const mainFuncFirstLine = "void main() {";
        const mainFuncFirstLineIndex = DecompositionVertexShader.indexOf(mainFuncFirstLine);
        const mainFuncLastLineIndex = DecompositionVertexShader.lastIndexOf('}');

        const outerPart = DecompositionVertexShader.substring(0, mainFuncFirstLineIndex);
        const innerPart = DecompositionVertexShader.substring(mainFuncFirstLineIndex + mainFuncFirstLine.length, mainFuncLastLineIndex);

        this.decompositionVertShaderParts.push(outerPart);
        this.decompositionVertShaderParts.push(innerPart)
    }

    _randomUnitVector() {
        const vect = new THREE.Vector3(Math.random(), Math.random(), Math.random());
        vect.normalize();
        return vect;
    }

}