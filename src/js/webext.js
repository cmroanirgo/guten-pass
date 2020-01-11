/**
 * webext.js
 * license AGPL
 * Copyright (c) 2017 Craig Monro (cmroanirgo), kodespace.com. All rights reserved.
 **/

/* 
* Parts of this code originally from https://github.com/EmailThis/extension-boilerplate. Copyright (c) 2017 Bharani / Email This
* ...but modified and redistributed under MIT license
* This file is still AGPL however.
*/
const _apis = [
  'alarms',
  'bookmarks',
  'browserAction',
  'commands',
  'contextMenus',
  'cookies',
  'downloads',
  'events',
  'extension',
  'extensionTypes',
  'history',
  'i18n',
  'idle',
  'notifications',
  'pageAction',
  'runtime',
  'storage',
  'tabs',
  'webNavigation',
  'webRequest',
  'windows',
]

function _ExtensionApi () {
	const _this = this;

	_apis.forEach(function (_api) {

		_this[_api] = null

		try {
			if (!_this[_api] && !!chrome[_api]) {
				_this[_api] = chrome[_api]
			}
		} catch (e) {}

		try {
			if (!_this[_api] && !!window[_api]) {
				_this[_api] = window[_api]
			}
		} catch (e) {}

		try {
			if (!_this[_api] && !!browser[_api]) {
				_this[_api] = browser[_api]
			}
		} catch (e) {}
		
		try {
			if (!_this[_api])
				_this.api = browser.extension[_api]
		} catch (e) {}
	});

	// always prefer browser's runtime AND browserAction
	try {
		if (browser && !!browser.runtime) {
			_this.runtime = browser.runtime
		}
	} catch (e) {}

	try {
		if (browser && !!browser.browserAction) {
			_this.browserAction = browser.browserAction
		}
	} catch (e) {}
}

function _Extension() {
	const _this = this
	_ExtensionApi.call(_this);
	_this.storageApi = _this.storage;
	_this.storage = _this.storage.local;

	const _ = require('./libs/notunderscore');
	const $ = require('./libs/notjquery');
	
	_this._ = _;
	_this.$ = $;
	_this.eatError = function(message) {
		try {
			if (_this.runtime.lastError)
				console.error(message||'runtime.lastError', _this.runtime.lastError.message.toString())
		}
		catch(e) {

		}
	}
	_this.registerLog = function(name) {
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
	}
	_this.registerLogPROD = function(name) {
		if (_PRODUCTION) {
			var log = function() { }
			log.warn = log;
			log.error = log;
			return log;
		}
			
		else
			return _this.registerLog(name);
	}
}

module.exports = new _Extension();

