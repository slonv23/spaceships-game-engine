export default class AbstractNetworkClient {

    /** @type {string} */
    serverIp;

    /** @type {string} */
    signalingServerPort;

    constructor(messageEncoderDecoder) {
        this.messageEncoderDecoder = messageEncoderDecoder;
    }

    connect() {
        throw new Error("Not implemented");
    }

}