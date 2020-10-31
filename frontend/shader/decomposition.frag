varying vec2 vUv;

uniform sampler2D texture1;

void main() {
    gl_FragColor = texture2D(texture1, vUv.xy);
}