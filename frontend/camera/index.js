import {diContainer} from "../../globals";
import CameraManager from "./flying-object/CameraManager";

export const cameraManagers = Object.freeze({
    FLYING_OBJECT_CAMERA_MANAGER: Symbol()
});

diContainer.registerClass(cameraManagers.FLYING_OBJECT_CAMERA_MANAGER, CameraManager);