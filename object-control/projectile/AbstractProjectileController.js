import AbstractController from "../AbstractController";

export default class AbstractProjectileController extends AbstractController {

    launch() {
        throw new Error("Not implemented");
    }

    stop() {
        throw new Error("Not implemented");
    }

    // eslint-disable-next-line no-unused-vars
    sync(frameIndexLaunchedAt) {
        throw new Error("Not implemented");
    }

}
