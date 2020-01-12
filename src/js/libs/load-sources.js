const ext = require("../webext");
const storage = ext.storage;
const _ = ext._;
const DEBUG = true && !_PRODUCTION;
const log = ext.registerLogPROD('gp-load-sources');


function load(cb) {
	// this makes sure that we have saved the list of known sources
	return storage.get('sources', function(resp) {
		ext.logLastError('load-sources')
		var sources = !resp ? null: resp.sources;

		// Validate sources, make sure they're all part of gutenberg.org
		if (sources && _.isArray(sources)) {
			sources = sources.filter(load.isValidSource)
		}

		if (!sources || !sources.length) {
			// save the list of known sources
			DEBUG && log("No known sources on disk. Storing defaults");
			sources = require('./inbuilt-gutenberg');
			load.saveSources(sources);
		}
		else
		{
			// change the list of known sources
			DEBUG && log("Loaded known sources");
		}
		cb(sources);
	});
};

load.isValidSource = function(src) {
	if (!src.url) 
		return false; // no url
	if (!src.url.match(/^https?:\/\/(www\.)?gutenberg.org\//)) 
		return false; // make sure its gutenberg.org!
	return true;
}

load.saveSources = function(sources) {
	storage.set({'sources': sources}, ext.logLastErrorCB('load-sources:save'));
}

module.exports = load;