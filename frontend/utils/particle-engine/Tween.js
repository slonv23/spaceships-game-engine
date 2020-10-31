/**
 * @author Lee Stemkoski   http://www.adelphi.edu/~stemkoski/
 * @author Illia Solonar
 */
import * as THREE from 'three';

export default class Tween {

    constructor(timeArray, valueArray) {
        this.times  = timeArray || [];
        this.values = valueArray || [];
    }

    lerp(t) {
        let i = 0;
        const n = this.times.length;
        while (i < n && t > this.times[i]) {
            i++;
        }
        if (i === 0) return this.values[0];
        if (i === n) return this.values[n-1];
        const p = (t - this.times[i-1]) / (this.times[i] - this.times[i-1]);

        if (this.values[0] instanceof THREE.Vector3) {
            return this.values[i - 1].clone().lerp(this.values[i], p);
        } else {
            // it is a float
            return this.values[i - 1] + p * (this.values[i] - this.values[i - 1]);
        }
    }

}
