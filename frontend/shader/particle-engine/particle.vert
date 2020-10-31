attribute vec3  customColor;
attribute float customOpacity;
attribute float customSize;
attribute float customAngle;
attribute float customVisible; // float used as boolean (0 = false, 1 = true)
varying vec4  vColor;
varying float vAngle;

void main()
{
	if (customVisible > 0.5)
		vColor = vec4(customColor, customOpacity); // set color associated to vertex; use later in fragment shader.
	else
		vColor = vec4(0.0, 0.0, 0.0, 0.0); // make particle invisible.

	vAngle = customAngle;

	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
	gl_PointSize = 20.0;//customSize * ( 10.0 / length( mvPosition.xyz ) ); // scale particles as objects in 3D space

	//gl_Position = projectionMatrix * mvPosition; // projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); // projectionMatrix * vec4( position, 1.0 ); //mvPosition;",
	gl_Position = projectionMatrix * mvPosition;
}