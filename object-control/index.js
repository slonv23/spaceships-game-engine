import {diContainer} from '../globals';

import FlyingObjectSingleplayerController from "./flying-object/FlyingObjectSingleplayerController";
import RemoteFlyingObjectController from './flying-object/RemoteFlyingObjectController';
import RemoteFlyingObjectControllerTest from './flying-object/RemoteFlyingObjectControllerTest';

export const controllers = Object.freeze({
    FLYING_OBJECT_CONTROLLER: Symbol(),
    FLYING_OBJECT_REMOTE_CONTROLLER: Symbol(),
    FLYING_OBJECT_REMOTE_CONTROLLER_TEST: Symbol(),
});

diContainer.registerClass(controllers.FLYING_OBJECT_CONTROLLER, FlyingObjectSingleplayerController, {enableAxesHelper: false});
diContainer.registerClass(controllers.FLYING_OBJECT_REMOTE_CONTROLLER, RemoteFlyingObjectController);
diContainer.registerClass(controllers.FLYING_OBJECT_REMOTE_CONTROLLER_TEST, RemoteFlyingObjectControllerTest);

