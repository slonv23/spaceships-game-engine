import {diContainer} from '../globals';

import FlyingObjectSingleplayerController from "./flying-object/FlyingObjectSingleplayerController";
import RemoteFlyingObjectController from './flying-object/RemoteFlyingObjectController';
import RemoteFlyingObjectControllerTest from './flying-object/RemoteFlyingObjectControllerTest';
import FlyingObjectMultiplayerController from "./flying-object/FlyingObjectMultiplayerController";

export const controllers = Object.freeze({
    FLYING_OBJECT_SP_CONTROLLER: Symbol(),
    FLYING_OBJECT_MP_CONTROLLER: Symbol(),
    REMOTE_FLYING_OBJECT_CONTROLLER: Symbol(),
    REMOTE_FLYING_OBJECT_CONTROLLER_TEST: Symbol(),
});

diContainer.registerClass(controllers.FLYING_OBJECT_SP_CONTROLLER, FlyingObjectSingleplayerController, {enableAxesHelper: false});
diContainer.registerClass(controllers.FLYING_OBJECT_MP_CONTROLLER, FlyingObjectMultiplayerController, {enableAxesHelper: false});
diContainer.registerClass(controllers.REMOTE_FLYING_OBJECT_CONTROLLER, RemoteFlyingObjectController);
diContainer.registerClass(controllers.REMOTE_FLYING_OBJECT_CONTROLLER_TEST, RemoteFlyingObjectControllerTest);
