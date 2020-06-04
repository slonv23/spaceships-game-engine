import AbstractObject from "../physics/object/AbstractObject";

export default class StateManager {

    /** @type {AbstractObject[]} */
    allObjects = [];

    update(delta) {
        this.allObjects.forEach(object => object.update(delta));
    }

    addObject(gameObject) {
        this.allObjects.push(gameObject);
    }

}