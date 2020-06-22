import {diContainer} from '../../globals';
import MessageSerializerDeserializer from './MessageSerializerDeserializer';

diContainer.registerClass("messageSerializerDeserializer", MessageSerializerDeserializer, {
    modelNames: ['InputAction', 'ObjectState', 'SpawnRequest', 'SpawnResponse', 'WorldState']
});
