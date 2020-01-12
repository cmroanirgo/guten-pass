/**
 * background.js
 * @license AGPL
 * Copyright (c) 2017 Craig Monro (cmroanirgo), kodespace.com. All rights reserved.
 **/

/*
* This is the main code guten pass.
*/

const ext = require("./webext");
const storage = ext.storage;
const $ = ext.$;
const _ = ext._;
const Dict = require('./libs/dict');
const validators = require('./libs/validators');
const fetchSource = require('./libs/fetch');

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

    		

    	case 'gp-optionsChanged': // this is sent from popup.js & options.js
    		DEBUG && log("Options changed")
    		_currentOptions = request.options; 
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

function getCachedUrlObj(url, cb) {
	const key = "url:"+url;
	var obj = _global_cache[key];
	if (obj && obj.dictionary) {
		cb(obj);
		return;
	}
		

	obj = {};
	storage.get(key, function(resp){
		ext.logLastError('getCachedUrlObj');
		if (resp[key])
			obj.text = resp[key].text;
		cb(obj);
	})
}
function storeCachedUrlObj(url, obj) {
	DEBUG && log("Storing cached url: " + url);
	const key = "url:"+url;
	_global_cache[key] = obj;
	var s = {};
	s[key] = {text:obj.text+''};
	obj.text =  undefined; // don't need this in memory anymore!
	storage.set(s, 	ext.logLastErrorCB('storeCachedUrlObj'))
}




function addSource(request, sender, responseCB)
{
	log('Adding a new source...')
	var source = {title:request.title, url:request.url};
	if (!isValidSource(source)) {
		return responseCB({error:"Invalid Source"});;
	}
	_sources.push(source);
	saveSources(_sources);
	_currentOptions.source_url = source.url;
	saveOptions();
	log('Added a new source...')
	return responseCB({action: "ok"});
}

function generatePasswords(request, sender, responseCB) {
	var options = _.extend({}, _currentOptions);

	//if (!options.url && !options.text && !options.dictionary && !options.randomSource)
	//	throw new Error("Need to specify a url, text, or randomSource=true for password generator");

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
		source = _sources[Dict.random(0, _sources.length-1)];
		DEBUG && log("Randomly chose: \""+source.title+"\". url: " + source.url)
		options.url = source.url;
	}
	if (source) {
		DEBUG && log("source is \""+source.title+"\"")
	}

	// TODO. Proxy is needed for chrome. Fails on Firefox
	var proxy = null; // "https://cors-anywhere.herokuapp.com/" + 

	// fetch source from cache/ local storage
	getCachedUrlObj(options.url, function(sourceObj) {

		var dict;
		if (!sourceObj.dictionary) {
			// most of the time

			var learnOptions = _.extend({}, _learnOptions);

			dict = new Dict();

			// fetched from cache or local?
			if (sourceObj.text) {
				// already fetched
				log(options, "Reusing fetched text")
				DEBUG && log('learning...')
				dict.learn(sourceObj.text, learnOptions);	
				DEBUG && log('generating...')
				_generate(dict)	
			}
			else
			{				
				// else fetch it from the web

				DEBUG && log('fetching from web...')
				options.ajaxCallback = function(stage) {
					sendMessage({action:'gp-ajax', status:stage})
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
						storeCachedUrlObj(options.url, sourceObj)

						DEBUG && log('learning...')
						dict.learn(text, learnOptions);	
						DEBUG && log('generating...')
						_generate(dict)	
					}
				);
			}
				
		}
		else
		{
			// re-use whatever's been learnt
			DEBUG && log("Reusing dictionary...")
			dict = sourceObj.dictionary;
			_generate(dict)	
		}


		function _generate(dict) {
			sourceObj.dictionary = dict; // updated the cached obj to include the dictionary (for next time). No need to explicity store it again
			sourceObj.text = undefined; // no need to keep this in memory. we have the dictionary!
			DEBUG && log("Creating password...")
			var results = [];
			var num_results = options.num_results || 5;
			while (results.length<num_results)
			{
				var words = dict.createWords(options);
				if (!options.keepSeparate || options.separator!==null) 
					words = words.join(options.separator||'-');
				results.push(words);
			}

			responseCB({
				action: "ok",
				words: results, 
				meta: {
					source: source
					}
				});
		}

	});


}

