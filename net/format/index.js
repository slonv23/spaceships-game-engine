import {diContainer} from '../../globals';
import MessageSerializerDeserializer from './MessageSerializerDeserializer';

import ObjectAction from '../models/ObjectAction';
import ObjectState from '../models/ObjectState';
import SpawnRequest from '../models/SpawnRequest';
import SpawnResponse from '../models/SpawnResponse';
import WorldState from '../models/WorldState';
import RequestAck from "../models/RequestAck";

import SpaceFighterDestroy from "../models/space-fighter/SpaceFighterDestroy";
import SpaceFighterInput from "../models/space-fighter/SpaceFighterInput";
import SpaceFighterOpenFire from "../models/space-fighter/SpaceFighterOpenFire";
import SpaceFighterState from "../models/space-fighter/SpaceFighterState";
import SpaceFighterStopFire from "../models/space-fighter/SpaceFighterStopFire";
import SpaceFighterGotHit from "../models/space-fighter/SpaceFighterGotHit";
import Disconnect from "../models/Disconnect";

diContainer.registerClass("messageSerializerDeserializer", MessageSerializerDeserializer, {
    models: [
        // common models:
        ObjectAction, ObjectState, SpawnRequest, SpawnResponse, WorldState, RequestAck, Disconnect,
        // space fighter models:
        SpaceFighterInput, SpaceFighterDestroy, SpaceFighterOpenFire, SpaceFighterState,
        SpaceFighterStopFire, SpaceFighterGotHit
    ]
});
