/**
 * @typedef {import('../client/AbstractNetworkClient').default} AbstractNetworkClient
 * @typedef {import('../format/MessageSerializerDeserializer').default} MessageSerializerDeserializer
 * @typedef {import('di-container-js').default} DiContainer
 */

export default class MultiplayerService {

    /** @type {DiContainer} diContainer */
    diContainer;

    /** @type {AbstractNetworkClient} networkClient */
    networkClient;

    /** @type {MessageSerializerDeserializer} messageSerializerDeserializer */
    messageSerializerDeserializer;

    /**
     * @param {DiContainer} diContainer
     * @param {MessageSerializerDeserializer} messageSerializerDeserializer
     */
    constructor(diContainer, messageSerializerDeserializer) {
        this.diContainer = diContainer;
        this.messageSerializerDeserializer = messageSerializerDeserializer;
    }

    async postConstruct({client = "webRtcNetworkClient"}) {
        this.networkClient = await this.diContainer.get(client);
    }

    connect() {
        return this.networkClient.connect();
    }

    requestSpawn() {
        // TODO ...
    }

}
