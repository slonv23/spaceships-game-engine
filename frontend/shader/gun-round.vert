varying float modifier;

void main() {
    vec3 localCoordSysPos = vec3(modelMatrix[3][0], modelMatrix[3][1], modelMatrix[3][2]);
    vec3 topmostPoint = (modelMatrix * vec4(0.0, 0.0, 1.0, 1.0)).xyz;
    vec3 primaryAxis = topmostPoint - localCoordSysPos;
    vec3 cameraPosDiffCenterPos = cameraPosition.xyz - localCoordSysPos;

    // find normal to surface which include three points: local coordinates system center, topmost point of ellipsoid and camera position
    vec3 normalToSurf = normalize(cross(primaryAxis, cameraPosDiffCenterPos));

    vec4 posInWorld = modelMatrix * vec4(position, 1.0);
    vec3 directionToPosFromCenter = posInWorld.xyz - localCoordSysPos;

    vec3 normalizedPos = normalize(directionToPosFromCenter);

    float k1 = (1.0 - dot(normalize(cameraPosDiffCenterPos), normalizedPos)) / 2.0; // how close (angle) to direction we looking at
    float k2 = dot(normalToSurf, normalizedPos) / 2.0; // how close to ellipse on ellipsoid we looking at

    modifier = abs(k1) + abs(k2);
    if (modifier > 1.0) {
        modifier = 1.0;
    }
    modifier = 1.0 - modifier;


    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
