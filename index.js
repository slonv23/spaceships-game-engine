import {diContainer} from './globals';

function createFrontendFacade(filepaths) {
    diContainer.configure('assetManager', {filepaths});
    return diContainer.get("frontendFacade");
}

export {
    diContainer,
    createFrontendFacade,
};
