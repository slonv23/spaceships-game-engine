/**
 * @typedef {import('three').Quaternion} Quaternion
 * @typedef {import('protobufjs').Type} Type
 * @typedef {import('protobufjs').Message} Message
 */

import * as THREE from "three";
import {lowerFirst} from "../../util/string";
import {config} from "../../globals";
import AbstractModel from "../models/AbstractModel";

// eslint-disable-next-line no-undef
const protobuf = require("protobufjs");

export default class MessageSerializerDeserializer {

    modelNameToClass = {};

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

    async postConstruct({protoBundle, models}) {
        this.protoBundle = protoBundle;
        await this.loadProtoDefinitions(models);
    }

    loadProtoDefinitions(models) {
        const root = protobuf.Root.fromJSON(this.protoBundle);

        models.forEach(model => {
            this.modelNameToClass[model.name] = model;
            model._protobufType = root.lookupType(`multiplayer.${model.name}`);
        });

        this.FloatVector = root.lookupType("multiplayer.FloatVector");
        this.Quaternion = root.lookupType("multiplayer.Quaternion");
        this.RequestRoot = root.lookupType("multiplayer.RequestRoot");
        this.ResponseRoot = root.lookupType("multiplayer.ResponseRoot");

        return Promise.resolve();
    }

    /**
     * @param {AbstractModel} model
     * @param {object} [wrapperProps]
     * @returns {Uint8Array}
     */
    serializeResponse(model, wrapperProps = {}) {
        return this.serialize(model, this.ResponseRoot, wrapperProps);
    }

    /**
     * @param {AbstractModel} model
     * @param {object} [wrapperProps]
     * @returns {Uint8Array}
     */
    serializeRequest(model, wrapperProps = {}) {
        return this.serialize(model, this.RequestRoot, wrapperProps);
    }

    /**
     * @param {AbstractModel} model
     * @param {Type} wrapperType
     * @param {object} [wrapperProps]
     * @returns {Uint8Array}
     */
    serialize(model, wrapperType, wrapperProps = {}) {
        const modelName = model.constructor.name;
        const type = this.modelNameToClass[modelName]._protobufType;
        if (!type) {
            throw new Error(`Failed to get protobuf type associated with model ${modelName}`);
        }

        const payload = this._buildPayload(model);

        const wrappedMessage = this._wrapMessage(wrapperType, lowerFirst(modelName), type.create(payload), wrapperProps);

        return this._toByteArray(wrapperType, wrappedMessage);
    }

    _buildPayload(model) {
        const payload = {};
        for (const key in model) {
            if (Object.prototype.hasOwnProperty.call(model, key)) {
                payload[key] = this._buildProperty(model[key]);
            }
        }

        return payload;
    }

    _buildProperty(property) {
        if (Array.isArray(property)) {
            return property.map(propElem => this._buildProperty(propElem));
        } else if (property instanceof AbstractModel) {
            return this._buildPayload(property);
        } else if (property instanceof THREE.Vector3) {
            return this.serializeVector(property);
        } else if (property instanceof THREE.Quaternion) {
            return this.serializeQuaternion(property);
        } else {
            return property;
        }
    }

    /**
     * @param {Buffer|Uint8Array} buffer
     * @returns {Array<*>}
     */
    deserializeRequest(buffer) {
        return this.deserializeMessages(this.RequestRoot, buffer);
    }

    /**
     * @param {Buffer|Uint8Array} buffer
     * @returns {Array<*>}
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
            messages.push(this._mapPayloadToModel(msg[msg.message]));
        }

        return messages;
    }

    _mapPayloadToModel(payload) {
        debugger;
        const modelName = payload.constructor.name;
        const model = new this.modelNameToClass[modelName]();

        for (const key in payload) {
            if (Object.prototype.hasOwnProperty.call(payload, key)) {
                model[key] = this._mapPayloadPropertyToIntl(payload[key]);
            }
        }

        return model;
    }

    _mapPayloadPropertyToIntl(property) {
        const name = property.constructor.name;

        if (name === "Array") {
            return property.map(propElem => this._mapPayloadToModel(propElem));
        } else if (name === "FloatVector") {
            return new THREE.Vector3(property.x, property.y, property.z);
        } else if (name === "Quaternion") {
            return new THREE.Quaternion(property.imag.x, property.imag.y, property.imag.z, property.real);
        } else if (property instanceof Object) {
            return this._mapPayloadToModel(property);
        } else {
            return property;
        }
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
        const imag = this.FloatVector.create({x: quaternion.x, y: quaternion.y, z: quaternion.z});
        const real = quaternion.w;

        return this.Quaternion.create({real, imag});
    }

    /**
     * @param {Type} wrapperType
     * @param {string} messageName
     * @param {Message} message
     * @param {object} [wrapperProps]
     * @returns {Message}
     * @private
     */
    _wrapMessage(wrapperType, messageName, message, wrapperProps = {}) {
        const wrappedMsg = wrapperType.create({[messageName]: message});
        wrappedMsg.message = messageName;
        for (const key in wrapperProps) {
            wrappedMsg[key] = wrapperProps[key];
        }

        return wrappedMsg;
    }

    /**
     * @see https://gist.github.com/TooTallNate/4750953
     * @returns {string}
     * @private
     */
    _determineEndianness() {
        const a = new Uint32Array([0x12345678]);
        const b = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
        return b[0] === 0x12 ? 'BE' : 'LE';
    }

    /**
     * @see https://github.com/feross/buffer/blob/master/index.js
     * @param {Buffer|Uint8Array} buffer
     * @private
     * @returns {number}
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
     * @see https://github.com/protobufjs/protobuf.js/blob/master/src/reader.js#L86
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
