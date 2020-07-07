export default class Emitter {

    constructor() {
        let delegate;
        if (global && global.EventTarget) {
            delegate = new global.EventTarget;
        } else {
            delegate = document.createDocumentFragment();
        }

        [
            'addEventListener',
            'removeEventListener'
        ].forEach(f =>
            this[f] = (...xs) => delegate[f](...xs)
        )

        this.dispatchEvent = (type, detail) => {
            let event;
            if (typeof CustomEvent !== 'undefined') {
                event = new CustomEvent(type, {detail});
            } else {
                event = {type, detail};
            }

            delegate.dispatchEvent(event);
        }
    }

}
