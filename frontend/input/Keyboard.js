export default class Keyboard {

    /** @type {Set} */
    pressedKeys = new Set();

    constructor() {
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
    }

    onKeyDown = (e) => {
        this.pressedKeys.add(e.keyCode);
    };

    onKeyUp = (e) => {
        this.pressedKeys.delete(e.keyCode);
    };

    getFirstPressedKey() {
        return this.pressedKeys.keys().next().value;
    }

}