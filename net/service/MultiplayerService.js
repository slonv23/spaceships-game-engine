/**
 * @typedef {import('../client/AbstractNetworkClient').default} AbstractNetworkClient
 * @typedef {import('../format/MessageSerializerDeserializer').default} MessageSerializerDeserializer
 * @typedef {import('di-container-js').default} DiContainer
 * @typedef {import('../models/SpawnResponse').default} SpawnResponse
 * @typedef {import('../models/WorldState').default} WorldState
 * @typedef {import('../../state/MultiplayerStateManager').default} StateManager
 */
import SpawnRequest from '../models/SpawnRequest';

export default class MultiplayerService {

    /** @type {DiContainer} diContainer */
    diContainer;
    /** @type {AbstractNetworkClient} networkClient */
    networkClient;
    /** @type {MessageSerializerDeserializer} messageSerializerDeserializer */
    messageSerializerDeserializer;
    /** @type {string} */
    assignedObjectId;
    /**
     * @type {Function}
     * @private
     */
    _onSpawned;

    /**
     * @param {DiContainer} diContainer
     * @param {MessageSerializerDeserializer} messageSerializerDeserializer
     * @param {StateManager} stateManager
     */
    constructor(diContainer, messageSerializerDeserializer, stateManager) {
        this.diContainer = diContainer;
        this.messageSerializerDeserializer = messageSerializerDeserializer;
        this.stateManager = stateManager;
    }

    async postConstruct({client = "webRtcNetworkClient"} = {}) {
        this.networkClient = await this.diContainer.get(client);
        //this.networkClient.addEventListener("message", this._handleIncomingMessage)
    }

    connect() {
        return this.networkClient.connect();
    }

    requestSpawn() {
        const spawnRequest = new SpawnRequest();
        spawnRequest.nickName = "Illia";

        this.networkClient.addEventListener("messages", this._handleMessagesBeforeSpawn);
        this.networkClient.sendMessage(this.messageSerializerDeserializer.serializeRequest(spawnRequest));

        return new Promise(resolve => {
            this._onSpawned = resolve;
        });
    }

    startStateSync() {
        this.networkClient.addEventListener("messages", this._handleMessagesAfterSpawned);
    }

    _handleMessagesBeforeSpawn = (event) => {
        const messages = this.messageSerializerDeserializer.deserializeResponse(event.detail);
        for (let i = 0; i < messages.length; i++) {
            if (messages[i].constructor.name === "SpawnResponse") {
                this.networkClient.removeEventListener("messages", this._handleMessagesBeforeSpawn);
                this.assignedObjectId = messages[i].assignedObjectId;
                this._onSpawned && this._onSpawned(this.assignedObjectId);
                break;
            }
        }
    };

    _handleMessagesAfterSpawned = (event) => {
        const messages = this.messageSerializerDeserializer.deserializeResponse(event.detail);
        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            const type = message.constructor.name;

            switch (type) {
                case "WorldState":
                    console.log("Received WorldState msg");
                    this.stateManager.updateWorld(message);
                    break;
            }
        }
    };

}
