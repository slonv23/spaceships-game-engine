/**
 * @author Lee Stemkoski http://www.adelphi.edu/~stemkoski/
 * @author Illia Solonar
 */
import * as THREE from 'three';

import Tween from "./Tween";
import Particle from "./Particle";
import ParticleVertexShader from "../../shader/particle-engine/particle.vert";
import ParticleFragmentShader from "../../shader/particle-engine/particle.frag";

export const Type = Object.freeze({ "CUBE":1, "SPHERE":2 });

export default class ParticleEngine {

    constructor(scene) {
        this.scene = scene;

        this.positionStyle = Type.CUBE;
        this.positionBase = new THREE.Vector3();
        // cube shape data
        this.positionSpread = new THREE.Vector3();
        // sphere shape data
        this.positionRadius = 0; // distance from base at which particles start

        this.velocityStyle = Type.CUBE;
        // cube movement data
        this.velocityBase = new THREE.Vector3();
        this.velocitySpread = new THREE.Vector3();
        // sphere movement data
        // direction vector calculated using initial position
        this.speedBase = 0;
        this.speedSpread = 0;

        this.accelerationBase   = new THREE.Vector3();
        this.accelerationSpread = new THREE.Vector3();

        this.angleBase               = 0;
        this.angleSpread             = 0;
        this.angleVelocityBase       = 0;
        this.angleVelocitySpread     = 0;
        this.angleAccelerationBase   = 0;
        this.angleAccelerationSpread = 0;

        this.sizeBase = 0.0;
        this.sizeSpread = 0.0;

        // store colors in HSL format in a THREE.Vector3 object
        // http://en.wikipedia.org/wiki/HSL_and_HSV
        this.colorBase = new THREE.Vector3(0.0, 1.0, 0.5);
        this.colorSpread = new THREE.Vector3(0.0, 0.0, 0.0);

        this.opacityBase = 1.0;
        this.opacitySpread = 0.0;

        this.blendStyle = THREE.NormalBlending;

        this.particlesPerSecond = 100;
        this.particleDeathAge = 1.0;

        this.emitterDeathAge = 60; // time (seconds) at which to stop creating particles.
    }

    setValues(parameters) {
        if (parameters === undefined) return;

        // clear any previous tweens that might exist
        this.sizeTween = new Tween();
        this.colorTween = new Tween();
        this.opacityTween = new Tween();

        for (const key in parameters) {
            this[key] = parameters[key];
        }

        // calculate/set derived particle engine values
        this.particleArray = [];
        this.emitterAge = 0.0;
        this.emitterAlive = true;
        // how many particles could be active at any time?
        this.particleCount = this.particlesPerSecond * Math.min(this.particleDeathAge, this.emitterDeathAge);
        this.aliveParticlesCount = 0;

        this.particleGeometry = new THREE.BufferGeometry();
        this.particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                texture1: {value: this.particleTexture},
            },
            vertexShader: ParticleVertexShader,
            fragmentShader: ParticleFragmentShader,
            transparent: true,
            depthWrite: false, // because some particle are rendered behind other we need disable depthWrite to make them visible
            //alphaTest: 0.5, // if having transparency issues, try including: alphaTest: 0.5,
            //blending: THREE.NormalBlending,
            //depthTest: true
        });

        const position = new THREE.BufferAttribute(new Float32Array(new Array(this.particleCount * 3).fill(0)), 3);
        const customVisible = new THREE.BufferAttribute(new Float32Array(new Array(this.particleCount).fill(1)), 1);
        const customAngle = new THREE.BufferAttribute(new Float32Array(new Array(this.particleCount).fill(0)), 1);
        const customSize = new THREE.BufferAttribute(new Float32Array(new Array(this.particleCount).fill(0)), 1);
        const customColor = new THREE.BufferAttribute(new Float32Array(new Array(this.particleCount * 3).fill(0)), 3);
        const customOpacity = new THREE.BufferAttribute(new Float32Array(new Array(this.particleCount).fill(1)), 1);
        this.particleGeometry.setAttribute( 'position', position);
        this.particleGeometry.setAttribute('customVisible', customVisible);
        this.particleGeometry.setAttribute('customAngle', customAngle);
        this.particleGeometry.setAttribute('customSize', customSize);
        this.particleGeometry.setAttribute('customColor', customColor);
        this.particleGeometry.setAttribute('customOpacity', customOpacity);
    }

    randomValue(base, spread) {
        return base + spread * (Math.random() - 0.5);
    }

    randomVector3(base, spread) {
        const rand3 = new THREE.Vector3( Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5 );
        return new THREE.Vector3().addVectors(base, new THREE.Vector3().multiplyVectors(spread, rand3));
    }

    createParticle() {
        var particle = new Particle(this.sizeTween, this.colorTween, this.opacityTween);

        if (this.positionStyle == Type.CUBE)
            particle.position = this.randomVector3( this.positionBase, this.positionSpread );
        if (this.positionStyle == Type.SPHERE)
        {
            var z = 2 * Math.random() - 1;
            var t = 6.2832 * Math.random();
            var r = Math.sqrt( 1 - z*z );
            var vec3 = new THREE.Vector3( r * Math.cos(t), r * Math.sin(t), z );
            particle.position = new THREE.Vector3().addVectors( this.positionBase, vec3.multiplyScalar( this.positionRadius ) );
        }

        if ( this.velocityStyle == Type.CUBE )
        {
            particle.velocity     = this.randomVector3( this.velocityBase,     this.velocitySpread );
        }
        if ( this.velocityStyle == Type.SPHERE )
        {
            var direction = new THREE.Vector3().subVectors( particle.position, this.positionBase );
            var speed     = this.randomValue( this.speedBase, this.speedSpread );
            particle.velocity  = direction.normalize().multiplyScalar( speed );
        }

        particle.acceleration = this.randomVector3( this.accelerationBase, this.accelerationSpread );

        particle.angle             = this.randomValue( this.angleBase,             this.angleSpread );
        particle.angleVelocity     = this.randomValue( this.angleVelocityBase,     this.angleVelocitySpread );
        particle.angleAcceleration = this.randomValue( this.angleAccelerationBase, this.angleAccelerationSpread );

        particle.size = this.randomValue( this.sizeBase, this.sizeSpread );

        var color = this.randomVector3( this.colorBase, this.colorSpread );
        particle.color = new THREE.Color().setHSL( color.x, color.y, color.z );

        particle.opacity = this.randomValue( this.opacityBase, this.opacitySpread );

        particle.age   = 0;
        particle.alive = 0; // particles initialize as inactive

        return particle;
    }

    initialize() {
        // link particle data with geometry/material data
        for (var i = 0, j = 0; j < this.particleCount;  i = i + 3, j++)
        {
            // remove duplicate code somehow, here and in update function below.
            this.particleArray[j] = this.createParticle();
            this.aliveParticlesCount++;

            const positions = this.particleGeometry.attributes.position.array;
            positions[i] = this.particleArray[j].position.x;
            positions[i + 1] = this.particleArray[j].position.y;
            positions[i + 2] = this.particleArray[j].position.z;
            this.particleGeometry.attributes.position.needsUpdate = true;

            this.particleGeometry.attributes.customVisible.array[j] = this.particleArray[j].alive;
            this.particleGeometry.attributes.customVisible.needsUpdate = true;
            this.particleGeometry.attributes.customColor.array[i] = this.particleArray[j].color.r;
            this.particleGeometry.attributes.customColor.array[i + 1] = this.particleArray[j].color.g;
            this.particleGeometry.attributes.customColor.array[i + 2] = this.particleArray[j].color.b;
            this.particleGeometry.attributes.customColor.needsUpdate = true;
            this.particleGeometry.attributes.customOpacity.array[j] = this.particleArray[j].opacity;
            this.particleGeometry.attributes.customOpacity.needsUpdate = true;
            this.particleGeometry.attributes.customSize.array[j] = this.particleArray[j].size;
            this.particleGeometry.attributes.customSize.needsUpdate = true;
            this.particleGeometry.attributes.customAngle.array[j] = this.particleArray[j].angle;
            this.particleGeometry.attributes.customAngle.needsUpdate = true;
        }

        this.particleMaterial.blending = this.blendStyle;
        // WHY DISABLING DEPTH TEST ???
        /*if (this.blendStyle !== THREE.NormalBlending) {
            this.particleMaterial.depthTest = false;
        }*/

        this.particleMesh = new THREE.Points(this.particleGeometry, this.particleMaterial);
        //this.particleMesh.dynamic = true;
        //this.particleMesh.sortParticles = true;
        //this.particleMesh.renderOrder = 999;

        this.scene.add(this.particleMesh);
    }

    update(dt) {
        dt = dt / 1000;
        //return
        var recycleIndices = [];

        // update particle data
        for (var i = 0; i < this.particleCount; i++)
        {
            if (this.particleArray[i].alive) {
                this.particleArray[i].update(dt);

                // check if particle should expire
                // could also use: death by size<0 or alpha<0.
                if (this.particleArray[i].age > this.particleDeathAge )
                {
                    this.particleArray[i].alive = 0.0;
                    this.aliveParticlesCount--;
                    recycleIndices.push(i);
                }

                // update particle properties in shader
                this.particleGeometry.attributes.customVisible.array[i] = this.particleArray[i].alive;
                this.particleGeometry.attributes.customColor.array[i * 3] = this.particleArray[i].color.r;
                this.particleGeometry.attributes.customColor.array[i * 3 + 1] = this.particleArray[i].color.g;
                this.particleGeometry.attributes.customColor.array[i * 3 + 2] = this.particleArray[i].color.b;
                this.particleGeometry.attributes.customOpacity.array[i] = this.particleArray[i].opacity;
                this.particleGeometry.attributes.customSize.array[i] = this.particleArray[i].size;
                this.particleGeometry.attributes.customAngle.array[i] = this.particleArray[i].angle;
            }
        }

        this.particleGeometry.attributes.position.needsUpdate = true;
        this.particleGeometry.attributes.customVisible.needsUpdate = true;
        this.particleGeometry.attributes.customColor.needsUpdate = true;
        this.particleGeometry.attributes.customOpacity.needsUpdate = true;
        this.particleGeometry.attributes.customSize.needsUpdate = true;
        this.particleGeometry.attributes.customAngle.needsUpdate = true;

        // check if particle emitter is still running
        if ( !this.emitterAlive ) return;

        // if no particles have died yet, then there are still particles to activate
        if ( this.emitterAge < this.particleDeathAge )
        {
            // determine indices of particles to activate
            var startIndex = Math.round( this.particlesPerSecond * (this.emitterAge +  0) );
            var   endIndex = Math.round( this.particlesPerSecond * (this.emitterAge + dt) );
            if  ( endIndex > this.particleCount )
                endIndex = this.particleCount;

            for (var i = startIndex; i < endIndex; i++)
                this.particleArray[i].alive = 1.0;
        }

        // if any particles have died while the emitter is still running, we imediately recycle them
        for (var j = 0; j < recycleIndices.length; j++)
        {
            var i = recycleIndices[j];
            this.particleArray[i] = this.createParticle();
            this.particleArray[i].alive = 1.0; // activate right away
            this.aliveParticlesCount++;

            //this.particleGeometry.vertices[i] = this.particleArray[i].position;
            const positions = this.particleGeometry.attributes.position.array;
            positions[i * 3] = this.particleArray[i].position.x;
            positions[i * 3 + 1] = this.particleArray[i].position.y;
            positions[i * 3 + 2] = this.particleArray[i].position.z;
            this.particleGeometry.attributes.position.needsUpdate = true;
        }

        // stop emitter?
        this.emitterAge += dt;
        if ( this.emitterAge > this.emitterDeathAge )  this.emitterAlive = false;
    }

    destroy() {
        this.scene.remove(this.particleMesh);
    }

}