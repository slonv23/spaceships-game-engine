import {diContainer} from '../../globals';
import MessageSerializerDeserializer from './MessageSerializerDeserializer';
import InputAction from '../models/InputAction';
import ObjectState from '../models/ObjectState';
import SpawnRequest from '../models/SpawnRequest';
import SpawnResponse from '../models/SpawnResponse';
import WorldState from '../models/WorldState';
import RequestAck from "../models/RequestAck";

diContainer.registerClass("messageSerializerDeserializer", MessageSerializerDeserializer, {
    models: [InputAction, ObjectState, SpawnRequest, SpawnResponse, WorldState, RequestAck]
});
