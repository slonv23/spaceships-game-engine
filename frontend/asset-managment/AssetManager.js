import * as THREE from "three";

import GLTFLoader from "./GltfLoader";

export default class AssetManager {

    assetsDir;

    modelsDir;

    spritesDir

    /** @type {object.<string, THREE.Object3D>} */
    models = {};

    /** @type {object.<string, THREE.Sprite>} */
    sprites = {};

    /** @type {GLTFLoader} */
    gltfLoader;

    /** @type {THREE.TextureLoader} */
    textureLoader = new THREE.TextureLoader();

    constructor(gltfLoader) {
        this.gltfLoader = gltfLoader;
    }

    /**
     * @param {{assetsRootDir: string, modelsDirSubpath: string, spritesDirSubpath: string, modelFilepathsPathByName: object.<string, string>}} param0
     * @returns {Promise<any>}
     */
    postConstruct({
        assetsRootDir = "assets",
        modelsDirSubpath = "models",
        spritesDirSubpath = "sprites",
        filepaths = {}
    } = {}) {
        this.assetsDir = assetsRootDir;
        this.modelsDir = this.assetsDir + '/' + modelsDirSubpath;
        this.spritesDir = this.assetsDir + '/' + spritesDirSubpath;

        return Promise.all([
            this._loadModels(filepaths.models),
            this._loadSprites(filepaths.sprites)
        ]);
    }

    modelFilepath(subpath) {
        return this.modelsDir + '/' + subpath;
    }

    spriteFilepath(subpath) {
        return this.spritesDir + '/' + subpath;
    }

    /**
     * @param {string} modelName 
     * @returns {THREE.Object3D}
     */
    getModel(modelName) {
        if (!(modelName in this.models)) {
            throw new Error(`Model '${modelName}' is not loaded`);
        }

        return this.models[modelName].clone();
    }

    /**
     * @param {string} spriteName 
     * @returns {THREE.Sprite}
     */
    getSprite(spriteName) {
        if (!(spriteName in this.sprites)) {
            throw new Error(`Sprite '${spriteName}' is not loaded`);
        }

        return this.sprites[spriteName].clone();
    }

    async _loadSprites(spritesFilepathsByName) {
        if (spritesFilepathsByName) {
            for (let spriteName in spritesFilepathsByName) {
                const sprite = await this._loadSprite(spritesFilepathsByName[spriteName]);
                this.sprites[spriteName] = sprite;
            }
        }
    }

    async _loadModels(modelFilepathsByName) {
        if (modelFilepathsByName) {
            for (let modelName in modelFilepathsByName) {
                const model = await this._loadModel(modelFilepathsByName[modelName]);
                this.models[modelName] = model;
            }
        }
    }

    /**
     * @param {string} subpath 
     * @returns {Promise<THREE.Object3D>}
     */
    _loadModel(subpath) {
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(this.modelFilepath(subpath), (gltf) => {
                let model = gltf.scene.children[0].children[0];
                model.matrixAutoUpdate = false;

                resolve(model);
            }, undefined, function (e) {
                console.error(e);

                reject(e);
            });
        });
    }

    /**
     * @param {string} subpath 
     * @returns {Promise<THREE.Sprite>}
     */
    _loadSprite(subpath) {
        return new Promise((resolve, reject) => {
            this.textureLoader.load(this.spriteFilepath(subpath), (texture) => {
                const material = new THREE.SpriteMaterial({map: texture});

                resolve(new THREE.Sprite(material));
            }, null, (e) => {
                console.error(e);

                reject(e);
            });
        });
    }

}