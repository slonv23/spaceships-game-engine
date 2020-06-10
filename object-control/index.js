import {diContainer} from '../globals';

import FlyingObjectControls from "./flying-object/FlyingObjectControls";
import FlyingObjectRemoteControls from './flying-object/FlyingObjectRemoteControls';

export const controls = Object.freeze({
    FLYING_OBJECT_CONTROLS: Symbol(),
    FLYING_OBJECT_REMOTE_CONTROLS: Symbol(),
});

diContainer.registerClass(controls.FLYING_OBJECT_CONTROLS, FlyingObjectControls, {enableAxesHelper: false});
diContainer.registerClass(controls.FLYING_OBJECT_REMOTE_CONTROLS, FlyingObjectRemoteControls);

