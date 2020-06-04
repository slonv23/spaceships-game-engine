import {diContainer} from '../../globals';

import FlyingObjectControls from "./flying-object/FlyingObjectControls";
import CameraManager from "./flying-object/CameraManager";

export const controls = Object.freeze({
    FLYING_OBJECT_CONTROLS: Symbol()
});

diContainer.registerClass(controls.FLYING_OBJECT_CONTROLS, FlyingObjectControls, {enableAxesHelper: false});
diContainer.registerClass("flyingObjectCameraManager", CameraManager);