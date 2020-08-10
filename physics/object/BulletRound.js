import * as THREE from 'three';

const geometry = new THREE.SphereGeometry(0.1, 16, 16);
geometry.applyMatrix(new THREE.Matrix4().makeScale( 1.0, 1.0, 4.0));

const material = new THREE.ShaderMaterial({
    vertexShader:   document.getElementById('plasma-blast-vertex-shader').textContent,
    fragmentShader: document.getElementById('plasma-blast-fragment-shader').textContent,
    transparent: true,
});

export class BulletRound {

    constructor() {

    }

}
