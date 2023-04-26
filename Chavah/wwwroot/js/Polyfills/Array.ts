// tslint:disable-next-line:interface-name
interface Array<T> {
    includes(searchElement: T, fromIndex?: number): boolean;
    find(predicate: (input: T) => boolean): T | null;
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement /*, fromIndex*/) {
        "use strict";
        let O = Object(this);
        // tslint:disable-next-line:radix
        let len = parseInt(O.length) || 0;
        if (len === 0) {
            return false;
        }
        // tslint:disable-next-line:radix
        let n = parseInt(arguments[1]) || 0;
        let k;
        if (n >= 0) {
            k = n;
        } else {
            k = len + n;
            if (k < 0) { k = 0; }
        }
        let currentElement;
        while (k < len) {
            currentElement = O[k];
            if (searchElement === currentElement ||
                (searchElement !== searchElement && currentElement !== currentElement)) {
                return true;
            }
            k++;
        }
        return false;
    };
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
if (!Array.prototype.find) {
    Array.prototype.find = function(predicate) {
        if (this === null) {
            throw new TypeError("Array.prototype.find called on null or undefined");
        }
        if (typeof predicate !== "function") {
            throw new TypeError("predicate must be a function");
        }
        let list = Object(this);
        // tslint:disable-next-line:no-bitwise
        let length = list.length >>> 0;
        let thisArg = arguments[1];
        let value;

        for (let i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}
