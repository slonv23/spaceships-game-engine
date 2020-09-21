import {diContainer} from '../globals';

import FrontendFacade from './FrontedFacade';
import Renderer from './Renderer';

diContainer.registerClass("frontendFacade", FrontendFacade);
diContainer.registerClass("renderer", Renderer);

// register other components
import '../asset-management';
import './input';
