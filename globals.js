import DiContainer from "di-container-js";

const diContainer = new DiContainer();
const config = {
    env: "browser"
};

export {diContainer, config};