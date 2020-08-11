import {diContainer} from '../globals';

import SpaceFighterSingleplayerController from "./space-fighter/SpaceFighterSingleplayerController";
import SpaceFighterMultiplayerController from "./space-fighter/SpaceFighterMultiplayerController";
import RemoteSpaceFighterController from "./space-fighter/RemoteSpaceFighterController";

export const controllers = Object.freeze({
    SPACE_FIGHTER_SP_CONTROLLER: Symbol(),
    SPACE_FIGHTER_MP_CONTROLLER: Symbol(),
    REMOTE_SPACE_FIGHTER_CONTROLLER: Symbol(),
});

diContainer.registerClass(controllers.SPACE_FIGHTER_SP_CONTROLLER, SpaceFighterSingleplayerController, {enableAxesHelper: false});
diContainer.registerClass(controllers.SPACE_FIGHTER_MP_CONTROLLER, SpaceFighterMultiplayerController, {enableAxesHelper: false});
diContainer.registerClass(controllers.REMOTE_SPACE_FIGHTER_CONTROLLER, RemoteSpaceFighterController);
