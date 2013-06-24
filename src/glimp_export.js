/**
 * @author David Corvoysier / Copyright Orange 2013
 */

(function(lib) {
    "use strict";

    if (typeof module === "undefined" || typeof module.exports === "undefined") {
        // in a browser, attach library to the global context
        window.glimp = lib;
    } else {
        // in commonjs, or when AMD, attach library to exports
        module.exports = lib;
    }
})(glimp);
