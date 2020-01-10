/**
 * notunderscore.js
 * license AGPL
 * Copyright (c) 2017 Craig Monro (cmroanirgo), kodespace.com. All rights reserved.
 **/
// a lighter use for underscore. ie just helper functions, really

var nus = {

  isString: function (x) { return typeof x == 'string'; }
, isUndefined: function (x) { return (typeof x == 'undefined'); }
, isDefined: function (x) { return !_isUndefined(x); }
, isBool: function (x) { return typeof x == 'boolean'; }
, isString: function (x) { return typeof x == 'string'; }
, isObject: function (x) { return x !== null && typeof x === 'object'}
, isFunction: function (x) { return typeof x == 'function'; }
, isArray: Array.isArray || function(obj) {
    return toString.call(obj) === '[object Array]';
}
, forEach: function(obj, cb) {
	return Array.prototype.forEach(obj, cb);
}

, toRealArray: function (arrayIsh) {
		if (nus.isArray(arrayIsh)) return arrayIsh;
		var ar = [];
		for (var i=0; i<arrayIsh.length; i++)
			ar.push(arrayIsh[i]);
		return ar;
	}
, extend: function (origin, add) { // copied from electron-api-demos/node_modules/glob/glob.js
		if (add === null || typeof add !== 'object') {
			return origin
		}

		var keys = Object.keys(add)
		var i = keys.length
		while (i--) {
			origin[keys[i]] = add[keys[i]]
		}
		return origin
	}

, min: function (x,y) { return x<y ? x : y; }
, max: function (x,y) { return x>=y ? x : y; }
, dump: function (obj) { 
	var cache = [];
	return JSON.stringify(obj, function(key, value) {
		    if (typeof value === 'object' && value !== null) {
		        if (cache.indexOf(value) !== -1) {
		            // Circular reference found, discard key
		            return;
		        }
		        // Store value in our collection
		        cache.push(value);
		    }
		    if (key == 'parent')
		    	return '[parent]'; // this will always generate unwanted recursion
		    return value;
		}
	, 4); }
};

module.exports = nus;