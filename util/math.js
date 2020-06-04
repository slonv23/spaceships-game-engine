import * as THREE from "three";

export const sqrtOf2 = Math.sqrt(2);

/**
 * Returns a vector that is deviated from vd1 by a given angle 'fi'(in radian)
 * and lies in the plane formed by the vectors vd0, vd1.
 * 
 * @param {THREE.Vector3} vd0 - normalized
 * @param {THREE.Vector3} vd1 - normalized
 * @param {number} fi - angle in radians
 * @returns {THREE.Vector3} - normalized
 */
export function rotateWithinPlane(vd0, vd1, fi) {
    let k1, A, a, b;
    k1 = vd0.dot(vd1);
    A = Math.cos(fi);
    // counterclockwise:
    // b = -(k1*Math.sqrt(-(- A*A + 1)*(k1*k1 - 1)) - A*k1*k1 + A)/(k1*k1 - 1);
    // clockwise:
    b = (k1*Math.sqrt(-(- A*A + 1)*(k1*k1 - 1)) + A*k1*k1 - A)/(k1*k1 - 1);
    a = (A - b) / k1;

    let result = vd0.clone().multiplyScalar(a)
        .add(vd1.clone().multiplyScalar(b));
    return result;
}

export function radiansToDegrees(radians) {
    return 180 * radians / Math.PI;
}

export function createQuaternionForRotation(fromVector, toVector) {
    let normal = fromVector.clone().cross(toVector);
    let cosphi = fromVector.dot(toVector),
        sinphi = normal.length();

    normal.normalize();

    let cosphidiv2 = Math.sqrt((cosphi + 1) / 2),
        sinphidiv2 = sinphi/ (2 * cosphidiv2);

    return new THREE.Quaternion(sinphidiv2 * normal.x, sinphidiv2 * normal.y, sinphidiv2 * normal.z, cosphidiv2);
}

export function linearTransition(distance, currentSpeed, accelerationAbs, dt) {
    // at first find time point at which we should change acceleration to opposite (t0) and total transition time (t1)

    let acceleration = Math.sign(distance) * accelerationAbs;
    const C0 = -currentSpeed / acceleration;
    const C1 = distance * acceleration;

    const t1 = C0 + Math.sqrt(4 * C1 + 2 * (currentSpeed ** 2)) / accelerationAbs;
    const t0 = (t1 + C0) / 2;
    
    let speed, distanceChange;
    if (t1 <= dt) {
        // stop moving
        distanceChange = distance;
        speed = currentSpeed + (2*t0 - t1) * acceleration;
        acceleration = 0;
    } else if (t0 <= dt) {
        // change acceleration direction to opposite
        speed = currentSpeed + (2*t0 - dt) * acceleration;
        distanceChange = (2*acceleration*t0 + currentSpeed - (acceleration * dt) / 2) * dt - acceleration*t0*t0;
        acceleration = -acceleration;
    } else {
        distanceChange = (currentSpeed + (dt * acceleration) / 2) * dt;
        speed = currentSpeed + dt * acceleration;
    }

    return {acceleration, speed, distanceChange};
}
