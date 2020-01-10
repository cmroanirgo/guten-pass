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
			if (!_this[_api] && chrome[_api]) {
				_this[_api] = chrome[_api]
			}
		} catch (e) {}

		try {
			if (!_this[_api] && window[_api]) {
				_this[_api] = window[_api]
			}
		} catch (e) {}

		try {
			if (!_this[_api] && browser[_api]) {
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
		if (browser && browser.runtime) {
			_this.runtime = browser.runtime
		}
	} catch (e) {}

	try {
		if (browser && browser.browserAction) {
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
}

module.exports = new _Extension();

