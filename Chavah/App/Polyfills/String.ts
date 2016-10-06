interface String {
    endsWith(searchString: string, position?: number): boolean;
    startsWith(searchString: string, position?: number): boolean;
    includes(searchString: string, position?: number): boolean;
}

// String.includes, ES6 standard https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/String/includes
if (!String.prototype.includes) {
    String.prototype.includes = function () {
        'use strict';
        return String.prototype.indexOf.apply(this, arguments) !== -1;
    };
}

if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (searchString: string, position?: number) {
        var subjectString = this.toString();
        if (position === undefined || position > subjectString.length) {
            position = subjectString.length;
        }

        position -= searchString.length;
        var lastIndex = subjectString.indexOf(searchString, position);
        return lastIndex !== -1 && lastIndex === position;
    };
}

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString: string, position?: number) {
        position = position || 0;
        return this.lastIndexOf(searchString, position) === position;
    };
}