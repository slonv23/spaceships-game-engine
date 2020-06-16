export default class AbstractNetworkClient extends EventTarget {

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
    sendMessage(buffer) {
        throw new Error("Not implemented");
    }

}
