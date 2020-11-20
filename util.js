
var handleCircular = function () {
    var cache = [];
    var keyCache = []
    return function (key, value) {
        if (typeof value === 'object' && value !== null) {
            var index = cache.indexOf(value);
            if (index !== -1) {
                return '[Circular ' + keyCache[index] + ']';
            }
            cache.push(value);
            keyCache.push(key || 'root');
        }
        return value;
    }
}

var tmp = JSON.stringify;
stringify = function (value, replacer, space) {
    replacer = replacer || handleCircular();
    return tmp(value, replacer, space);
}

module.exports = stringify
