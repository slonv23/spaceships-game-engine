export default class AbstractNetworkClient {

    /** @type {string} */
    serverIp;

    /** @type {string} */
    signalingServerPort;

    constructor(messageEncoderDecoder) {
        this.messageEncoderDecoder = messageEncoderDecoder;
        debugger;
    }

    connect() {
        throw new Error("Not implemented");
    }

}