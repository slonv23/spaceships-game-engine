/**
 * @typedef {import('../client/AbstractNetworkClient').default} AbstractNetworkClient
 * @typedef {import('../format/MessageSerializerDeserializer').default} MessageSerializerDeserializer
 * @typedef {import('di-container-js').default} DiContainer
 * @typedef {import('../models/SpawnResponse').default} SpawnResponse
 */
import SpawnRequest from '../models/SpawnRequest';

export default class MultiplayerService {

    /** @type {DiContainer} diContainer */
    diContainer;

    /** @type {AbstractNetworkClient} networkClient */
    networkClient;

    /** @type {MessageSerializerDeserializer} messageSerializerDeserializer */
    messageSerializerDeserializer;

    /**
     * @type {function}
     * @private
     */
    _onSpawned;

    /** @type {string} */
    assignedObjectId;

    /**
     * @param {DiContainer} diContainer
     * @param {MessageSerializerDeserializer} messageSerializerDeserializer
     */
    constructor(diContainer, messageSerializerDeserializer) {
        this.diContainer = diContainer;
        this.messageSerializerDeserializer = messageSerializerDeserializer;
    }

    async postConstruct({client = "webRtcNetworkClient"} = {}) {
        this.networkClient = await this.diContainer.get(client);
        this.networkClient.addEventListener("message", this._handleIncomingMessage)
    }

    connect() {
        return this.networkClient.connect();
    }

    requestSpawn() {
        const spawnRequest = new SpawnRequest();
        spawnRequest.nickName = "Illia";

        this.networkClient.sendMessage(this.messageSerializerDeserializer.serialize(spawnRequest));

        return new Promise(resolve => {
            this._onSpawned = resolve;
        });
    }

    _handleIncomingMessage(event) {
        const message = this.messageSerializerDeserializer.deserializeResponse(event.data);
        const type = message.constructor.name;
        switch (type) {
            case "SpawnResponse":
                this.assignedObjectId = message.assignedObjectId;
                this._onSpawned && this._onSpawned(this.assignedObjectId);
                break;
        }
    }

}
