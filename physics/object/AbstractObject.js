 /**
  * @typedef {import('three').Object3D} Object3D
  */

export default class AbstractObject {

    /** @type {Object3D} */
    object3d;

    /** @type {*} */
    id;

     /**
      * @param {*} id 
      * @param {Object3D} object3d 
      */
    constructor(id, object3d) {
        this.id = id;
        this.object3d = object3d;
    }

    // eslint-disable-next-line no-unused-vars
    update(delta) {
        throw new Error("Not implemented");
    }

}