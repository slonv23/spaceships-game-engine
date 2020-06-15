/**
 * @typedef {import('../object-control/AbstractController').default} AbstractController
 */

import AbstractObject from "../physics/object/AbstractObject";

export default class StateManager {

    /** @type {AbstractController[]} */
    controllers = [];

    /** @type {number} */
    controllersCount = 0;

    update(delta) {
        for (let i = 0; i < this.controllersCount; i++) {
            this.controllers[i].update(delta);
        }
        //this.allObjects.forEach(object => object.update(delta));
    }

    addObject(gameObject) {
        //this.allObjects.push(gameObject);
    }

}