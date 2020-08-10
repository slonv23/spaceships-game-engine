varying float modifier;

void main() {
    float opacity = 1.0;

    gl_FragColor = vec4(0.86 - (0.86 - 1.0) * modifier, 0.92 * modifier, 0.20 - 0.20 * modifier, opacity);
}
