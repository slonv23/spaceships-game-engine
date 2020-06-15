import {diContainer} from '../globals';

import FlyingObjectSingleplayerController from "./flying-object/FlyingObjectController";
import RemoteFlyingObjectController from './flying-object/FlyingObjectRemoteController';
import RemoteFlyingObjectControllerTest from './flying-object/FlyingObjectRemoteControllerTest';

export const controls = Object.freeze({
    FLYING_OBJECT_CONTROLLER: Symbol(),
    FLYING_OBJECT_REMOTE_CONTROLLER: Symbol(),
    FLYING_OBJECT_REMOTE_CONTROLLER_TEST: Symbol(),
});

diContainer.registerClass(controls.FLYING_OBJECT_CONTROLLER, FlyingObjectSingleplayerController, {enableAxesHelper: false});
diContainer.registerClass(controls.FLYING_OBJECT_REMOTE_CONTROLLER, RemoteFlyingObjectController);
diContainer.registerClass(controls.FLYING_OBJECT_REMOTE_CONTROLLER_TEST, RemoteFlyingObjectControllerTest);

