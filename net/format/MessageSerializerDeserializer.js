/**
 * @typedef {import('three').Vector3} Vector3
 * @typedef {import('three').Quaternion} Quaternion
 * @typedef {import('protobufjs').Type} Type
 * @typedef {import('protobufjs').Message} Message
 * @typedef {import('../models/AbstractModel').default} AbstractModel
 */

// eslint-disable-next-line no-undef
const protobuf = require("protobufjs");

export default class MessageSerializerDeserializer {

    postConstruct({protoBundle}) {
        this.protoBundle = protoBundle;
        return this.loadProtoDefinitions();
    }

    loadProtoDefinitions() {
        const root = protobuf.Root.fromJSON(this.protoBundle);

        // TODO associate types with msg models (create map {[className] => [protobufType]})
        this.HelloWorld = root.lookupType("helloworld.HelloWorld");
        this.ObjectState = root.lookupType("multiplayer.ObjectState");
        this.ControlsState = root.lookupType("multiplayer.ControlsState");
        this.FloatVector = root.lookupType("multiplayer.FloatVector");
        this.Quaternion = root.lookupType("multiplayer.Quaternion");
        this.WorldState = root.lookupType("multiplayer.WorldState");
        return Promise.resolve();
        /*return protobuf.load(config.protoDir + "/helloworld.proto")
                .then((root) => {
                    this.HelloWorld = root.lookupType("helloworld.HelloWorld");
                    return Promise.resolve();
                });*/
    }

    /**
     * @param {Buffer} buffer
     * @returns {Array}
     */
    decodeMsgs(buffer) {
        const msgs = [];
        while (buffer.length) {
            const size = buffer.readUInt32LE();
            // TODO if received buffer size < msg size, save msg part into buffer and wait for another chunk of data

            buffer = buffer.slice(4);
            const decodedMsg = this.HelloWorld.decode(buffer.slice(0, size));
            buffer = buffer.slice(size);

            msgs.push(decodedMsg);
        }

        return msgs;
    }

    /**
     * @param {Vector3} vector
     * @returns {*}
     */
    serializeVector(vector) {
        return this.FloatVector.create({x: vector.x, y: vector.y, z: vector.z});
    }

    /**
     * @param {Quaternion} quaternion
     * @returns {*}
     */
    serializeQuaternion(quaternion) {
        const real = this.FloatVector.create({x: quaternion.x, y: quaternion.y, z: quaternion.z});
        const imag = quaternion.w;

        return this.Quaternion.create({real, imag});
    }

    /**
     * @param {AbstractModel} model
     */
    serialize(model) {
        // TODO iterate over keys, use hasOwnProperty to extract members to plane object
        //  and convert vectors and quaternions to corresponding protobuf types
    }

    deserialize() {
        // TODO ...
    }

    /**
     * @param {Type} msgType
     * @param {Message} msg
     * @returns {Uint8Array}
     */
    _toByteArray(msgType, msg) {
        const writer = new protobuf.Writer();
        msgType.encodeDelimited(msg, writer);
        return writer.finish();
    }

}
