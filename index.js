import {diContainer, config} from './globals';

class Engine {

    createFrontendFacade(filepaths) {
        diContainer.configure('assetManager', {filepaths});
        return diContainer.get("frontendFacade");
    }

    /**
     * @param {('node'|'browser')} env
     */
    setEnv(env) {
        config.env = env;
    }

    getDiContainer() {
        return diContainer;
    }

}

const engine = new Engine();
export default engine;
