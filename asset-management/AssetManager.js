import * as THREE from "three";

import GLTFLoader from "./GltfLoader";

export default class AssetManager {

    assetsDir;

    assets3dDir;

    spritesDir;

    /** @type {object.<string, object>} */
    assets3d = {};

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
     * @param {{assetsRootDir: string, assets3dDirSubpath: string, spritesDirSubpath: string, modelFilepathsPathByName: object.<string, string>}} param0
     * @returns {Promise<any>}
     */
    postConstruct({
        assetsRootDir = "assets",
        assets3dDirSubpath = "models",
        spritesDirSubpath = "sprites",
        filepaths = {}
    } = {}) {
        this.assetsDir = assetsRootDir;
        this.assets3dDir = this.assetsDir + '/' + assets3dDirSubpath;
        this.spritesDir = this.assetsDir + '/' + spritesDirSubpath;

        return Promise.all([
            this._load3dAssets(filepaths.assets3d),
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
     * @param {string} name
     * @returns {object}
     */
    get3dAsset(name) {
        if (!(name in this.assets3d)) {
            throw new Error(`3d asset '${name}' is not loaded`);
        }

        return this.assets3d[name];
    }

    /**
     * @param {string} spriteName
     * @returns {THREE.Sprite}
     */
    getSprite(spriteName) {
        if (!(spriteName in this.sprites)) {
            throw new Error(`Sprite '${spriteName}' is not loaded`);
        }

        return this.sprites[spriteName];
    }

    async _loadSprites(spritesFilepathsByName) {
        if (spritesFilepathsByName) {
            for (let spriteName in spritesFilepathsByName) {
                const sprite = await this._loadSprite(spritesFilepathsByName[spriteName]);
                this.sprites[spriteName] = sprite;
            }
        }
    }

    async _load3dAssets(assets3dFilepathsByName) {
        if (assets3dFilepathsByName) {
            for (let name in assets3dFilepathsByName) {
                this.assets3d[name] = await this._load3dAsset(assets3dFilepathsByName[name]);
            }
        }
    }

    /**
     * @param {string} subpath
     * @returns {Promise<object>}
     */
    _load3dAsset(subpath) {
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(this.modelFilepath(subpath), (gltf) => {
                resolve(gltf);
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
