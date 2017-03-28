import {ObserverLocator, inject} from 'aurelia-framework';

/**
 * Helper class to observe multiple properties at once
 */
@inject(ObserverLocator)
export class MultiObserver {

    /**
     * Get injected observer
     *
     * @param {object} observer
     */
    constructor(observer) {
        this.observer = observer;
    }

    /**
     * Observe the properties
     *
     * @param {object} object
     * @param {array} properties
     * @param {function} handler
     *
     * Usage:
     * Observe multiple properties on one object
     * observer.observe(this, ['prop1', 'prop2'], callback)
     *
     * Observe multiple properties on multiple objects
     * observer.observe([[this, 'prop1'], [this, 'prop2']], callback)
     */
    observe(object, properties, handler) {
        // Map to correct values
        if (!handler && typeof properties == 'function') {
            handler = properties;
            properties = object;
            object = null;
        }

        for (let propertyName of properties) {
            // Determine the property name
            let property = object ? propertyName : propertyName[1];
            // Determine the base object
            let obj = object || propertyName[0];
            // Observe the array value or the property
            if (obj[property] instanceof Array) {
                this.observer.getArrayObserver(obj[property]).subscribe(handler);
            }
            else {
                this.observer.getObserver(obj, property).subscribe(handler);
            }
        }
    }
}