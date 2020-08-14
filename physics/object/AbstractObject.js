 /**
  * @typedef {import('three').Object3D} Object3D
  */

export default class AbstractObject {

    /** @type {Object3D} */
    object3d;

    /** @type {*} */
    id;

     /**
      * @param {*} id - TODO why should we have id assigned to object if we not manipulate it directly?
      * @param {Object3D} [object3d]
      */
    constructor(id, object3d) {
        this.id = id;
        if (object3d) {
            this.object3d = object3d;
            this.object3d.matrixAutoUpdate = false;
        }
    }

    // eslint-disable-next-line no-unused-vars
    update(delta) {
        throw new Error("Not implemented");
    }

}
