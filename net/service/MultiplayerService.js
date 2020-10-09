/**
 * @typedef {import('../client/AbstractNetworkClient').default} AbstractNetworkClient
 * @typedef {import('../format/MessageSerializerDeserializer').default} MessageSerializerDeserializer
 * @typedef {import('di-container-js').default} DiContainer
 * @typedef {import('../models/SpawnResponse').default} SpawnResponse
 * @typedef {import('../models/WorldState').default} WorldState
 * @typedef {import('../models/AbstractModel').default} AbstractModel
 */
import SpawnRequest from '../models/SpawnRequest';
import Emitter from "../../util/Emitter";
import {unixTimestampMs} from "../../util/date";
import ObjectAction from "../models/ObjectAction";

export default class MultiplayerService extends Emitter {

    /** @type {DiContainer} diContainer */
    diContainer;
    /** @type {AbstractNetworkClient} networkClient */
    networkClient;
    /** @type {MessageSerializerDeserializer} messageSerializerDeserializer */
    messageSerializerDeserializer;
    /** @type {string} */
    assignedObjectId;
    /** @type {number} */
    ping = 0;
    /** @type {number} */
    frameLengthMs;

    /**
     * @type {Function}
     * @private
     */
    _onSpawned;

    /**
     * @param {DiContainer} diContainer
     * @param {MessageSerializerDeserializer} messageSerializerDeserializer
     */
    constructor(diContainer, messageSerializerDeserializer) {
        super();
        this.diContainer = diContainer;
        this.messageSerializerDeserializer = messageSerializerDeserializer;
    }

    async postConstruct({client = "webRtcNetworkClient", fps} = {}) {
        this.networkClient = await this.diContainer.get(client);
        this.frameLengthMs = 1000 / fps;
    }

    connect() {
        return this.networkClient.connect();
    }

    requestSpawn() {
        const spawnRequest = new SpawnRequest();
        spawnRequest.nickName = "Illia";

        this.networkClient.addEventListener("messages", this._handleMessagesBeforeSpawn);
        this.networkClient.sendMessage(this._buildMessage(spawnRequest, true));

        return new Promise(resolve => {
            this._onSpawned = resolve;
        });
    }

    startStateSync() {
        this.networkClient.addEventListener("messages", this._handleMessagesAfterSpawned);
    }

    /**
     * @param {AbstractModel} specificAction
     * @param {number} currentFrameIndex
     * @returns {ObjectAction}
     */
    scheduleObjectAction(specificAction, currentFrameIndex) {
        const halfRttFramesLength = Math.ceil((this.ping / 2) / this.frameLengthMs); // half of rtt represented in number of frames
        const frameIndex = currentFrameIndex + halfRttFramesLength + 1; // + 10; // + N frames to make prediction more reliable
        console.log('halfRttFramesLength: ' + halfRttFramesLength)

        const objectAction = new ObjectAction();
        objectAction.action = this.messageSerializerDeserializer.getFieldNameInsideOneOfForModel(specificAction);
        objectAction.frameIndex = frameIndex;
        objectAction[objectAction.action] = specificAction;

        this.networkClient.sendMessage(this._buildMessage(objectAction, true));

        return objectAction;
    }

    _buildMessage(data, ack = false) {
        const wrapperProps = {};
        if (ack) {
            wrapperProps.requestSentTimestamp = unixTimestampMs();
        }
        return this.messageSerializerDeserializer.serializeRequest(data, wrapperProps);
    }

    _handleMessagesBeforeSpawn = (event) => {
        const messages = this.messageSerializerDeserializer.deserializeResponse(event.detail);
        for (let i = 0; i < messages.length; i++) {
            const messageName = messages[i].constructor.name;
            if (messageName === "SpawnResponse") {
                this.networkClient.removeEventListener("messages", this._handleMessagesBeforeSpawn);
                this.assignedObjectId = messages[i].assignedObjectId;
                this._onSpawned && this._onSpawned(this.assignedObjectId);
                break;
            } else if (messageName === "RequestAck") {
                this.ping = unixTimestampMs() - messages[i].requestSentTimestamp;
                this.dispatchEvent("ping", this.ping);
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
                    this.dispatchEvent("worldStateUpdate", message);
                    break;
                case "RequestAck":
                    this.ping = unixTimestampMs() - messages[i].requestSentTimestamp;
                    this.dispatchEvent("ping", this.ping);
                    break;
            }
        }
    };

}
