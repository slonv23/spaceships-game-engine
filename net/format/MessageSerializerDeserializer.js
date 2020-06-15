/**
 * @typedef {import('three').Quaternion} Quaternion
 * @typedef {import('protobufjs').Type} Type
 * @typedef {import('protobufjs').Message} Message
 * @typedef {import('../models/AbstractModel').default} AbstractModel
 */

import * as THREE from "three";
import {lowerFirst} from "../../util/string";
import InputAction from "../models/InputAction";
import {config} from "../../globals";

// eslint-disable-next-line no-undef
const protobuf = require("protobufjs");

export default class MessageSerializerDeserializer {

    modelNameToType = {};

    constructor() {
        if (this._determineEndianness() === 'BE') {
            throw new Error("Big endian platforms not supported");
        }

        if (config.env === "node") {
            this.Reader = protobuf.BufferReader;
        } else {
            this.Reader = protobuf.Reader;
        }
    }

    async postConstruct({protoBundle, modelNames}) {
        this.protoBundle = protoBundle;
        await this.loadProtoDefinitions(modelNames);
        this.defaultRootMessageType = this.RequestRoot;

        // test:
        // const inputAction = new InputAction();
        // inputAction.rollAngle = 5;
        // inputAction.yaw = 2;
        // inputAction.pitch = 3;
        // inputAction.rotationSpeed = 6;
        //
        // const serialized = this.serialize(inputAction);
        // const deserializedRequest = this.deserializeRequest(serialized);
        // console.log(JSON.stringify(deserializedRequest));
    }

    loadProtoDefinitions(modelNames) {
        const root = protobuf.Root.fromJSON(this.protoBundle);

        modelNames.forEach(modelName => {
            this.modelNameToType[modelName] = root.lookupType(`multiplayer.${modelName}`);
        });

        this.FloatVector = root.lookupType("multiplayer.FloatVector");
        this.Quaternion = root.lookupType("multiplayer.Quaternion");
        this.RequestRoot = root.lookupType("multiplayer.RequestRoot");
        this.ResponseRoot = root.lookupType("multiplayer.ResponseRoot");

        return Promise.resolve();
    }

    /**
     * @param {AbstractModel} model
     */
    serialize(model) {
        const modelName = model.constructor.name;
        const type = this.modelNameToType[modelName];
        if (!type) {
            throw new Error(`Failed to get protobuf type associated with model ${modelName}`);
        }

        const payload = {};
        for (const key in model) {
            if (Object.prototype.hasOwnProperty.call(model, key)) {
                const property = model[key];
                if (property instanceof THREE.Vector3) {
                    payload[key] = this.serializeVector(property);
                } else if (property instanceof THREE.Quaternion) {
                    payload[key] = this.serializeQuaternion(property);
                } else {
                    payload[key] = property;
                }
            }
        }

        const wrappedMessage = this._wrapMessage(this.defaultRootMessageType, lowerFirst(modelName), type.create(payload));

        return this._toByteArray(this.defaultRootMessageType, wrappedMessage);
    }

    /**
     * @param {Buffer|Uint8Array} buffer
     */
    deserializeRequest(buffer) {
        return this.deserializeMessages(this.RequestRoot, buffer);
    }

    /**
     * @param {Buffer|Uint8Array} buffer
     */
    deserializeResponse(buffer) {
        return this.deserializeMessages(this.ResponseRoot, buffer);
    }

    /**
     * @param {Type} msgType
     * @param {Buffer|Uint8Array} buffer
     * @returns {Array}
     */
    deserializeMessages(msgType, buffer) {
        const messages = [];

        let reader = new this.Reader(buffer);

        while (reader.pos < buffer.length) {
            // const size = this._readMessageSize(buffer);
            // TODO if received buffer size < buffer size left unprocessed, save msg part into buffer and wait for another chunk of data
            const msg = msgType.decodeDelimited(reader);
            messages.push(msg);
        }

        return messages;
    }

    /**
     * @param {THREE.Vector3} vector
     * @returns {*}
     */
    serializeVector(vector) {
        return this.FloatVector.create({x: vector.x, y: vector.y, z: vector.z});
    }

    /**
     * @param {THREE.Quaternion} quaternion
     * @returns {*}
     */
    serializeQuaternion(quaternion) {
        const real = this.FloatVector.create({x: quaternion.x, y: quaternion.y, z: quaternion.z});
        const imag = quaternion.w;

        return this.Quaternion.create({real, imag});
    }

    /**
     * @param {Type} wrapperType
     * @param {string} messageName
     * @param {Message} message
     * @returns {Message}
     * @private
     */
    _wrapMessage(wrapperType, messageName, message) {
        const wrappedMsg = wrapperType.create({[messageName]: message});
        wrappedMsg.message = messageName;
        return wrappedMsg;
    }

    /**
     * https://gist.github.com/TooTallNate/4750953
     * @returns {string}
     * @private
     */
    _determineEndianness() {
        const a = new Uint32Array([0x12345678]);
        const b = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
        return b[0] === 0x12 ? 'BE' : 'LE';
    }

    /**
     * Taken from https://github.com/feross/buffer/blob/master/index.js
     * @param {Buffer|Uint8Array} buffer
     * @private
     */
    _readMessageSize(buffer) {
        return this._readVarInt(buffer)
        /*if (buffer instanceof Uint8Array) {
            return ((buffer[0]) |
                (buffer[1] << 8) |
                (buffer[2] << 16)) +
                (buffer[3] * 0x1000000)
        } else {
            return buffer.readUInt32LE();
        }*/
    }

    /**
     * @param {Type} msgType
     * @param {Message} msg
     * @returns {Uint8Array}
     * @private
     */
    _toByteArray(msgType, msg) {
        const writer = new protobuf.Writer();
        msgType.encodeDelimited(msg, writer);
        return writer.finish();
    }

    /**
     * https://github.com/protobufjs/protobuf.js/blob/master/src/reader.js#L86
     * @param {Buffer|Uint8Array} buffer
     * @returns {number}
     * @private
     */
    _readVarInt(buffer) {
        let value = 4294967295;
        value = (buffer[0] & 127) >>> 0; if (buffer[1] < 128) return value;
        value = (value | (buffer[1] & 127) <<  7) >>> 0; if (buffer[2] < 128) return value;
        value = (value | (buffer[2] & 127) << 14) >>> 0; if (buffer[3] < 128) return value;
        value = (value | (buffer[3] & 127) << 21) >>> 0; if (buffer[4] < 128) return value;
        value = (value | (buffer[4] &  15) << 28) >>> 0;

        return value;
    }

}
