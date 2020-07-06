import {diContainer} from '../globals';

import MultiplayerStateManager from './MultiplayerStateManager';
import AuthoritativeStateManager from "./AuthoritativeStateManager";

diContainer.registerClass("multiplayerStateManager", MultiplayerStateManager);
diContainer.registerClass("authoritativeStateManager", AuthoritativeStateManager);
