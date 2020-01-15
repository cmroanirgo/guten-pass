/**
 * log.js
 * license AGPL
 * Copyright (c) 2017 Craig Monro (cmroanirgo), kodespace.com. All rights reserved.
 **/
'use strict';
 // provides simple logging with a module name attached
 // usage: 
 // const log = require('log').registerLog('some-module');

var l = {
	registerLog: function(name) {
		var log = function() {
			var args = Array.prototype.slice.call(arguments);
			args.unshift(name);
			console.log.apply(null, args);
		}
		log.warn = function() {
			var args = Array.prototype.slice.call(arguments);
			args.unshift(name);
			console.warn.apply(null, args);
		}
		log.error = function() {
			var args = Array.prototype.slice.call(arguments);
			args.unshift(name);
			console.error.apply(null, args);
		}

		return log;
	},
	registerLogPROD: function(name) { // this turns logs into STUBS when using production mode
		if (_PRODUCTION) {
			var log = function() { }
			log.warn = log;
			log.error = log;
			return log;
		}
			
		else
			return l.registerLog(name);
	}	
};
module.exports = l;
