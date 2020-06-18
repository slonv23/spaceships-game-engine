//import EventTarget from 'events';

import Emitter from '../../util/Emitter';

export default class AbstractNetworkClient  extends Emitter {

    /** @type {string} */
    serverIp;

    /** @type {string} */
    signalingServerPort;

    connect() {
        throw new Error("Not implemented");
    }

    /**
     * @param {Buffer|Uint8Array} buffer
     */
    // eslint-disable-next-line no-unused-vars
    sendMessage(buffer) {
        throw new Error("Not implemented");
    }

}
