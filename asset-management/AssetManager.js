import * as THREE from "three";

import GLTFLoader from "./GltfLoader";
import {config} from "../globals";

export default class AssetManager {

    assetsDir;

    assets3dDir;

    spritesDir;

    texturesDir;

    /** @type {object.<string, object>} */
    assets3d = {};

    /** @type {object.<string, THREE.Sprite>} */
    sprites = {};

    /** @type {object.<string, THREE.Texture>} */
    textures = {};

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
        texturesDirSubpath = "textures",
        filepaths = {}
    } = {}) {
        this.assetsDir = assetsRootDir;
        this.assets3dDir = this.assetsDir + '/' + assets3dDirSubpath;
        this.spritesDir = this.assetsDir + '/' + spritesDirSubpath;
        this.texturesDir = this.assetsDir + '/' + texturesDirSubpath;

        const loadingPromises = [];
        if (filepaths.assets3d) {
            loadingPromises.push(this._load3dAssets(filepaths.assets3d));
        }
        if (filepaths.sprites) {
            loadingPromises.push(this._loadSprites(filepaths.sprites));
        }
        if (filepaths.textures) {
            loadingPromises.push(this._loadTextures(filepaths.textures));
        }

        return Promise.all(loadingPromises);
    }

    modelFilepath(subpath) {
        return this.assets3dDir + '/' + subpath;
    }

    spriteFilepath(subpath) {
        return this.spritesDir + '/' + subpath;
    }

    textureFilepath(subpath) {
        return this.texturesDir + '/' + subpath;
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

    getTexture(textureName) {
        if (!(textureName in this.textures)) {
            throw new Error(`Texture '${textureName}' is not loaded`);
        }

        return this.textures[textureName];
    }

    async _loadTextures(textureFilepathsByName) {
        for (let textureName in textureFilepathsByName) {
            this.textures[textureName] = await this._loadTexture(textureFilepathsByName[textureName]);
        }
    }

    async _loadSprites(spritesFilepathsByName) {
        for (let spriteName in spritesFilepathsByName) {
            this.sprites[spriteName] = await this._loadSprite(spritesFilepathsByName[spriteName]);
        }
    }

    async _load3dAssets(assets3dFilepathsByName) {
        for (let name in assets3dFilepathsByName) {
            this.assets3d[name] = await this._load3dAsset(assets3dFilepathsByName[name]);
        }
    }

    /**
     * @param {string} subpath
     * @returns {Promise<object>}
     */
    _load3dAsset(subpath) {
        return this._loadGltf(this.modelFilepath(subpath));
    }

    _loadGltf(filepath) {
        return new Promise((resolve, reject) => {
            if (config.env === "node") {
                const fs = require('fs');
                const path = require('path');

                const buffer = fs.readFileSync(path.join(config.rootDir, filepath), null).buffer;
                this.gltfLoader.parse(buffer, '', gltf => {
                    resolve(gltf);
                }, err => {
                    console.error(err);
                    reject(err);
                })
            } else {
                this.gltfLoader.load(filepath, gltf => {
                    resolve(gltf);
                }, undefined, err => {
                    console.error(err);
                    reject(err);
                });
            }
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

    _loadTexture(subpath) {
        return new Promise((resolve, reject) => {
            this.textureLoader.load(this.textureFilepath(subpath), resolve, null, (e) => {
                console.error(e);
                reject(e);
            });
        });
    }

}
