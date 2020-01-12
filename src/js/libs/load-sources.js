const ext = require("../webext");
const storage = ext.storage;
const _ = ext._;
const DEBUG = true && !_PRODUCTION;
const log = ext.registerLogPROD('gp-load-sources');


module.exports = function(cb) {
	// this makes sure that we have saved the list of known sources
	storage.get('sources', function(resp) {
		var sources = resp.sources;

		// Validate sources, make sure they're all part of gutenberg.org
		if (sources && _.isArray(sources)) {
			sources = sources.filter(function(src) {
				if (!src.url) 
					return false; // no url
				if (!src.url.match(/^https?:\/\/(www\.)?gutenberg.org\//)) 
					return false; // make sure its gutenberg.org!
				return true;
			})
		}

		if (!sources || !sources.length) {
			// save the list of known sources
			DEBUG && log("No known sources on disk. Storing defaults");
			var known = require('./known-sources-gutenberg');
			sources = known.sources;
			storage.set({'sources': sources});
		}
		else
		{
			// change the list of known sources
			DEBUG && log("Loaded known sources");
		}
		cb(sources);
	});
};

