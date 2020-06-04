export default class MouseInterface {

    /**
     * @type {number[]} mouse position
     * position[0] - x offset, x є [-screenWidth scrennWidth]
     * position[1] - y offset, y є [-screenHeight scrennHeight]
     */
    position = [.5, .5];

    constructor() {
        window.addEventListener('mousemove', this.onMouseMove, false);
    }

    onMouseMove = (e) => {
        this.position[0] = e.clientX - window.innerWidth * 0.5;
        this.position[1] = e.clientY - window.innerHeight * 0.5;
    };

}