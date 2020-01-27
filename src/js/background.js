/**
 * background.js
 * @license AGPL
 * Copyright (c) 2017 Craig Monro (cmroanirgo), kodespace.com. All rights reserved.
 **/

/*
* This is the main code guten pass.
*/
'use strict';

const ext = require("./webext");
const storage = ext.storage;
const $ = ext.$;
const _ = ext._;
const Dict = require('./libs/dict');
const validators = require('./libs/validators');
const fetchSource = require('./libs/fetch');
const rand = require('./libs/crypto-random');

const sendMessage = ext.runtime.sendMessage.bind(ext.runtime);

const DEBUG = true && !_PRODUCTION;
const log = ext.registerLogPROD('gp-background');


///////////////////////////////////////////////////////////////////////////////////////////
//
//
//
var _sources = require('./libs/inbuilt-gutenberg');
var _currentOptions = {
	numWords: 4,
	randomizeNumWords: 1,
	minWordLen: 5,
	maxWordLen: 10,
	source_url: '', // the currently selected source
};
var _learnOptions = { // keep words from 3 to 2 chars long. These signify the MAXiMUM values
	minWordLen: 3,
	maxWordLen: 20,
	validator: validators.gutenberg
};


// launch

loadSources();
loadOptions();
if (DEBUG) {
	storage.get(null, function(data) {
		ext.logLastError('loadAll')
		log("Local storage is: ", data);
	});

	// storage.clear();
}



///////////////////////////////////////////////////////////////////////////////////////////
//
//
//


// Listen to broadcast messages
ext.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	switch (request.action) {
		case 'gp-resetAllData':
			log("resetting all data...")
			storage.clear();
			_global_cache = {};
			loadSources();
			loadOptions();
			break;

		case 'gp-generate': // this is sent from popup.js
			generatePasswords(request, sender, sendResponse);
    		return true; // Inform Chrome that we will make a delayed sendResponse

    	case 'gp-setSource': // from popup.js. it expects a callback (so that it can generate a)
    		_currentOptions.source_url = request.source_url;
    		saveOptions();
    		return sendResponse({result:"ok"}); 

    	case 'gp-addSource': // from page-gutenberg.js when user adds a new source book (NB: popup would be closed 99% most likely & doesn't need to be informed)
    		return addSource(request, sender, sendResponse);

    	case 'gp-deleteSource': // from popup.js or options.js
    		return deleteSource(request, sender, sendResponse);

    		

    	case 'gp-optionsChanged': // this is sent from popup.js & options.js
    		DEBUG && log("Options changed")
    		_currentOptions = _.extend(_currentOptions, request.options); 
    		saveOptions();
    		onOptionsChanged();
    		break;

		default:
			return false;


  	}
  	if (sendResponse)
  		return sendResponse();
  	return false;
});




///////////////////////////////////////////////////////////////////////////////////////////
//
//
//


function loadSources() {
	require('./libs/load-sources')(function(sources) {
		_sources = sources;
		onSourcesChanged();
	})
}

function saveSources(sources) {
	require('./libs/load-sources').saveSources(sources);
}

function isValidSource(source) {
	return require('./libs/load-sources').isValidSource(source);
}

function loadOptions() {
	// this makes sure that we have saved the list of known sources
	storage.get('options', function(resp) {
		ext.logLastError('loadOptions')
		if (resp.options)
			_currentOptions = _.extend(_currentOptions, resp.options);
		onOptionsChanged();
	});
	/*
	consider _learnOptions as fixed for the moment
	storage.get('learnOptions', function(resp) {
		if (resp.learnOptions)
			_learnOptions = resp.learnOptions;
		onOptionsChanged();
	});*/
}

function saveOptions() {
	storage.set({options:_currentOptions}, 	ext.logLastErrorCB('saveOptions'));
}


function onOptionsChanged() {
	// Nothing to do. leave as stub though.
}

function onSourcesChanged() {
	// Nothing to do. leave as stub though.
}



///////////////////////////////////////////////////////////////////////////////////////////
//
//
//
var _global_cache = {};

function __urlToKey(url) {
	return "url:"+url;
}
function getUrlCache(url, generatorType, cb) {
	const key = __urlToKey(url);
	var obj = _global_cache[key];
	if (obj && obj.generator && obj.generatorType === generatorType) {
		// we've previously worked with this url AND generator 
		cb(obj);
		return;
	}
		
	// object not in the cache, OR we've switched generatorTypes... reload from disk

	obj = {};
	storage.get(key, function(resp){
		ext.logLastError('getUrlCache');
		if (resp[key])
			obj.text = resp[key].text;
		obj.generatorType = generatorType;
		cb(obj);
	})
}

function setUrlCache(url, obj) {
	DEBUG && log("Storing cached url: " + url);
	const key = __urlToKey(url);
	_global_cache[key] = obj; // store in memory, including generator
	if (obj.text) {
		var s = {};
		s[key] = {text:obj.text};
		storage.set(s, 	ext.logLastErrorCB('storeUrl'))
	}
	else {
		DEBUG && log.error("obj.text is missing for url: " + url);
	}
}



const pls_contact = "\n\nIf this problem persists & you feel it to be a problem with Guten Pass, please contact the developer."


function getDomainPath(url) { 
	// given https://www.somesite.com/some/path 
	// return somesite.com/some/path
	return url.replace(/https?:\/\/(www\.)?/, ''); 
} 

function addSource(request, sender, responseCB)
{

	log('Adding a new source...')
	var source = {title:request.title, url:request.url, lang:request.lang, lang_iso:request.lang_iso};
	if (!isValidSource(source)) {
		return responseCB({error:"Invalid Source."+pls_contact});;
	}
	// look for the source already in the list
	var existing = _sources.filter(function(src) {
		return (getDomainPath(src.url) === getDomainPath(source.url));
	});
	if (existing && existing.length>0)
		return responseCB({error:"Source already exists!"+pls_contact});
	else
		_sources.push(source);
	saveSources(_sources);
	_currentOptions.source_url = source.url;
	saveOptions();
	log('Added a new source...')
	return responseCB({action: "ok"});
}

function deleteSource(request, sender, responseCB)
{

	var source = {url:request.url};
	log('Deleting source...: ' + source.url)
	// look for the source already in the list
	var newSources = _sources.filter(function(src) {
		return (getDomainPath(src.url) !== getDomainPath(source.url));
	});
	if (!newSources || newSources.length<1)
	{
		return responseCB({error:"Can't delete the last source. Add a new one from gutenberg.org first & then retry."+pls_contact});;
	}
	else
		_sources = newSources;
	if (getDomainPath(_currentOptions.source_url) === getDomainPath(source.url))
		_currentOptions.source_url = ''; // revert to random
	saveSources(_sources);
	saveOptions();
	log('Removed source ok')
	return responseCB({action: "ok"});
}


function generatePasswords(request, sender, responseCB) {
	var options = _.extend({}, _currentOptions, request.options||{});

	//if (!options.url && !options.text && !options.generator && !options.randomSource)
	//	throw new Error("Need to specify a url, text, or randomSource=true for password generator");

	if (!_sources.length) {
		responseCB({error: new Error('Missing list of sources')});
		return;
	}

	var source; // = undefined;
	if (!_.isEmpty(options.source_url)) {
		// try and find the source url
		_sources.forEach(function(src) {
			if (src.url === options.source_url) {
				source = src;
				options.url = source.url;
			}
		})
	}
	if (options.randomSource || !source) {
		source = rand.array(_sources); 
		DEBUG && log("Randomly chose: \""+source.title+"\". url: " + source.url)
		options.url = source.url;
	}
	DEBUG && log("source is \""+source.title+"\"");

	const generatorType = options.generatorType || "words";

	// fetch source from cache/ local storage
	getUrlCache(options.url, generatorType, function(sourceObj) {

		var generator;
		if (!sourceObj.generator) {
			// most of the time

			var learnOptions = _.extend({}, _learnOptions);

			// make a new generator
			switch (generatorType) {
				case "words":
					generator = new Dict();
					break;
				case "phrase":
				case "leet":
				default:
					log.error("Not implemented, generatorType="+generatorType);
					break;
			}

			// fetched from cache or local?
			if (sourceObj.text) {
				// already fetched
				log(options, "Reusing fetched text")
				DEBUG && log('learning...')
				generator.learn(sourceObj.text, learnOptions);	
				DEBUG && log('generating...')
				_generate(generator)	
			}
			else
			{				
				// else fetch it from the web

				DEBUG && log('fetching from web...')
				options.ajaxCallback = function(stage) {
					sendMessage({action:'gp-ajax', status:stage, source:source})
				}

				fetchSource(options, 
					function (text, err) {
						if (err)
						{
							responseCB({error: err});
							return;
						}
						// clean up the text
						if (source.validator)
							options.validator = source.validator;
						var validator = options.validator || _learnOptions.validator;
						if (validator)
							text = validator(text);

						sourceObj.text = text;
						setUrlCache(options.url, sourceObj)
						sourceObj.text = undefined; // we have the generator. no need to keep the raw text in memory (& setUrlCache stores to disk)

						DEBUG && log('learning...')
						generator.learn(text, learnOptions);	
						DEBUG && log('generating...')
						_generate(generator)	
					}
				);
			}
				
		}
		else
		{
			// re-use whatever's been learnt
			DEBUG && log("Reusing generator: " + generatorType);
			generator = sourceObj.generator;
			_generate(generator)	
		}


		function _generate(generator) {
			sourceObj.generator = generator; // update the cached obj to include the generator (for next time). No need to explicity store it again
			sourceObj.generatorType = generatorType; // NB: This *IS* redundant, as getUrlCache() ensures this is filled out, but is here for clarity
			sourceObj.text = undefined; // no need to keep this in memory. we have the generator! This is also redundant, but is here for clarity
			DEBUG && log("Creating password...")

			var results = [];
			var num_words = []; // #of words in each result
			var num_results = request.num_results || 5;
			var stats = {};// although calculated per dict.createWords, it's actually constant, because our options don't change per iteration
			while (results.length<num_results)
			{
				var words = generator.createWords(options);

				// TODO move this into generator & make it return password strength
				stats = words.stats;
				var sep = _.isString(options.separator) ? options.separator : ' ';
				if (sep==="custom")
					sep = rand.array(options.customSeparator, '') // empty if an error, which is probably what user wants
					
				num_words.push(words.length); // TODO change this to stats.push
				words = words.join(sep);
				results.push(words);
			}
			stats.pwdWordCount = undefined;
			delete stats.pwdWordCount;
			stats.pwdWordCounts = num_words;

			responseCB({
				action: "ok",
				words: results, 
				meta: {
					source: source,
					stats: stats,
					num_words: num_words,
					options: options
					}
				});
		}

	});


}

