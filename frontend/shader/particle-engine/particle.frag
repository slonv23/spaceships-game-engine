uniform sampler2D texture1;
varying vec4 vColor;
varying float vAngle;

void main()
{
    gl_FragColor = vColor;

    float c = cos(vAngle);
    float s = sin(vAngle);
    vec2 rotatedUV = vec2(c * (gl_PointCoord.x - 0.5) + s * (gl_PointCoord.y - 0.5) + 0.5,
    c * (gl_PointCoord.y - 0.5) - s * (gl_PointCoord.x - 0.5) + 0.5); // rotate UV coordinates to rotate texture
    vec4 rotatedTexture = texture2D( texture1,  rotatedUV );

    gl_FragColor = gl_FragColor * rotatedTexture; //texture2D(texture1,  vec2(0.5,0.5)); // gl_FragColor * rotatedTexture; //vec4(1.0,0.0,1.0,1.0); //gl_FragColor = gl_FragColor * rotatedTexture;",    // sets an otherwise white particle texture to desired color
}