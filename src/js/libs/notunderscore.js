/**
 * not_.js
 * license AGPL
 * Copyright (c) 2017 Craig Monro (cmroanirgo), kodespace.com. All rights reserved.
 * v1.5b
 **/
// a lighter use for underscore. ie just helper functions, really
'use strict';

var n_ = {
  isString: function (x) { return typeof x == 'string'; }
, isUndefined: function (x) { return (typeof x == 'undefined'); }
, isDefined: function (x) { return !_isUndefined(x); }
, isBool: function (x) { return typeof x == 'boolean'; }
, isObject: function (x) { return x !== null && typeof x === 'object'}
, isFunction: function (x) { return typeof x == 'function'; }
, isArray: Array.isArray || function(obj) {
    return toString.call(obj) === '[object Array]';
}
, isArrayish: function(obj) {
	return n_.isArray(obj) || (!!obj && !n_.isString(obj) && obj.length !== undefined)
}
, isEmpty: function(x) { return n_.isString(x) && !x.length; }
, forEach: function(obj, cb) {
	return Array.prototype.forEach.call(obj, cb);
}


, toRealArray: function (arrayIsh) {
		if (n_.isArray(arrayIsh)) return arrayIsh;
		var ar = [];
		for (var i=0; i<arrayIsh.length; i++)
			ar.push(arrayIsh[i]);
		return ar;
	}
, extend: function() {
    var target = arguments[0];

    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        if (!source) continue;

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key];
            }
        }
    }

    return target;
}
, round: function round(val, num_decimals) {
	// num_decimals=3 --> 1000 === rounds to 3 dec places
	// num_decimals=-2 ==> 0.01 ==> rounds to nearest 100
	if (num_decimals===undefined) num_decimals = 2;
	var to = Math.pow(10, num_decimals); 
	return Math.round(val*to)/to;

}
, htmlEncode: function(html) { return (!!html && html.length ? html.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/&/g, "&amp;").replace(/\"/g, '&#34;').replace(/\'/g, '&#39;') : ''); }
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

module.exports = n_;