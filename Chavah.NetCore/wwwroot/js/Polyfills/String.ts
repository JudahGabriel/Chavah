// tslint:disable-next-line:interface-name
interface String {
    endsWith(searchString: string, position?: number): boolean;
    startsWith(searchString: string, position?: number): boolean;
    includes(searchString: string, position?: number): boolean;
    repeat(count: number): string;
}

// String.includes, ES6 standard
// https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/String/includes
if (!String.prototype.includes) {
    String.prototype.includes = function() {
        "use strict";
        return String.prototype.indexOf.apply(this, arguments) !== -1;
    };
}

if (!String.prototype.endsWith) {
    String.prototype.endsWith = function(searchString: string, position?: number) {
        let subjectString = this.toString();
        if (position === undefined || position > subjectString.length) {
            position = subjectString.length;
        }

        if (position !== undefined && position !== null) {
            position -= searchString.length;
        }
        let lastIndex = subjectString.indexOf(searchString, position);
        return lastIndex !== -1 && lastIndex === position;
    };
}

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString: string, position?: number) {
        position = position || 0;
        return this.lastIndexOf(searchString, position) === position;
    };
}

// String.repeat, ES2015 standard
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/repeat
if (!String.prototype.repeat) {
    String.prototype.repeat = function (count) {
        'use strict';
        if (this == null) {
            throw new TypeError('can\'t convert ' + this + ' to object');
        }
        var str = '' + this;
        // To convert string to integer.
        count = +count;
        if (count != count) {
            count = 0;
        }
        if (count < 0) {
            throw new RangeError('repeat count must be non-negative');
        }
        if (count == Infinity) {
            throw new RangeError('repeat count must be less than infinity');
        }
        count = Math.floor(count);
        if (str.length == 0 || count == 0) {
            return '';
        }
        // Ensuring count is a 31-bit integer allows us to heavily optimize the
        // main part. But anyway, most current (August 2014) browsers can't handle
        // strings 1 << 28 chars or longer, so:
        if (str.length * count >= 1 << 28) {
            throw new RangeError('repeat count must not overflow maximum string size');
        }
        var maxCount = str.length * count;
        count = Math.floor(Math.log(count) / Math.log(2));
        while (count) {
            str += str;
            count--;
        }
        str += str.substring(0, maxCount - str.length);
        return str;
    }
}
