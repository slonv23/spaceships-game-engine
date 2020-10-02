export default class MouseInterface {

    lmbPressed = false;

    rmbPressed = false;

    /**
     * @type {number[]} mouse position
     * position[0] - x offset, x є [-screenWidth scrennWidth]
     * position[1] - y offset, y є [-screenHeight scrennHeight]
     */
    position = [.5, .5];

    constructor() {
        window.addEventListener('mousemove', this.handleMouseMove, false);
        window.addEventListener('mousedown', this.handleMouseDown, false);
        window.addEventListener('mouseup', this.handleMouseUp, false);
    }

    handleMouseMove = (e) => {
        this.position[0] = e.clientX - window.innerWidth * 0.5;
        this.position[1] = e.clientY - window.innerHeight * 0.5;
    };

    handleMouseDown = (e) => {
        console.log('Mouse down!!');
        if (e.button === 0) {
            this.lmbPressed = true;
        } else if (e.button === 2) {
            this.rmbPressed = true;
        }
    };

    handleMouseUp = (e) => {
        console.log('Mouse up!!');
        if (e.button === 0) {
            this.lmbPressed = false;
        } else if (e.button === 2) {
            this.rmbPressed = false;
        }
    };

}
