/**
 * popup.js
 * @license AGPL
 * Copyright (c) 2017 Craig Monro (cmroanirgo), kodespace.com. All rights reserved.
 **/

/*
* This file is used by popup.html
* popup.html is shown when the user clicks on the browser button in the toolbar
*/

const ext = require("./webext");
const Wordish = require('Wordish');
const $ = ext.$;
const storage = ext.storage;
const known_sources = require('./sources/gutenberg');// TODO. If more than 1 source collate
const validators = require('./sources/validators');
const fetchSource = require('./libs/fetch.js');

function log(str) { console.log(str); }

var _global_popup_cache = {};

storage.get('cache', function(resp) {
	var cache = resp.cache;
	if(cache) {
		_global_popup_cache =cache;
		log("Loaded cached documents");
	}
});

function generate(options, cb) {
	if (!cb && typeof options == "function") {
		cb = options;
		options = null;
	}
	options = options || {randomSource:true};
	if (!options.url && !options.text && !options.dictionaryCache && !options.randomSource)
		throw new Error("Need to specify a url, text, or randomSource=true for password generator");

	var source; // = undefined;
	if (options.randomSource) {
		source = known_sources.sources[Wordish.random(0, known_sources.sources.length-1)];
		log(options, "Randomly chose: '"+source.name+"' by " + source.author + ". url: " + source.url)
		options.url = source.url;
	}
	options.base_url = "https://cors-anywhere.herokuapp.com/" + known_sources.base_url;
	options.cache = _global_popup_cache;
	options.cacheCallback = function(url, obj) {
		_global_popup_cache[url] = obj;
		storage.set({cache: _global_popup_cache});
		log("Updated cached documents");
	}

	var wordish;
	if (!options.dictionary || options.dictionaryRelearn) {
		// most of the time

		var learnOptions = {};
		if (options.trim) {
			learnOptions.minWordLen = Math.min(options.minWordLen||10, options.accuracy||3);
			learnOptions.maxWordLen = Math.max(options.maxWordLen||25, options.accuracy||10);
		}
		learnOptions.validator = options.validator || known_sources.default_validator;

		wordish = new Wordish(options.accuracy);

		if (!options.text) {
			fetchSource(options, 
				function (text, err) {
					if (err)
					{
						cb(null, null, err);
						return;
					}
					log('learning...')
					wordish.learn(text, learnOptions);	
					log('generating...')
					_generate(wordish)	
				}
			);
		}
		else {
			log(options, "learning text...")
			wordish.learn(options.text, learnOptions);
			_generate(wordish)	
		}
	}
	else
	{
		// re-use whatever's been learnt
		log(options, "Reusing dictionary...")
		wordish = options.dictionary;
		_generate(wordish)	
	}


	function _generate(wordish) {
		log(options, "Creating password...")
		var results = [];
		var num_results = options.num_results || 1;
		while (results.length<num_results)
		{
			var words = wordish.createWords(options);
			if (!options.keepSeparate || options.separator!==null) 
				words = words.join(options.separator||'-');
			results.push(words);
		}

		cb(results, {
			dictionary: wordish, 
			cache: options.cache || _global_popup_cache,
			source: source
			})
		log(options, "")
	}
}



// Use the settings stored in options.html
storage.get('color', function(resp) {
	var color = resp.color;
	if(color) {
		$(document.body).css('background-color',color);
	}
});

// Get the current tab and request that it do something. Often, this might be in relation to a button-click/form submit
// ...but here it's done immediately
/*
ext.tabs.query({active: true, currentWindow: true}, function(tabs) {
	var activeTab = tabs[0];

	//chrome.tabs.sendMessage(activeTab.id, { action: 'page-fetchSomething' });

	// tell the current page to fetch something. (See page.js)
	chrome.tabs.sendMessage(activeTab.id, { action: 'page-fetchSomething' }, function (linksStr) { 
		// handle the response here... 
		//var links = JSON.parse(linksStr);
		console.log(linksStr);
		//alert(linksStr);
	} );

});
*/

/*
// see background.js for pseudo-implementation
$("#some-btn").on("click", function(e) {
	e.preventDefault();
	ext.runtime.sendMessage({ action: "perform-someBtn-Action", data: data }, function(response) {
		if(response && response.action === "saved") {
			renderMessage("Your bookmark was saved successfully!");
		} else {
			renderMessage("Sorry, there was an error while saving your bookmark.");
		}
	})
});
*/

var _last_dict = {};

$("#generate").on("click", function(e) {
	e.preventDefault();

	var source = known_sources.sources[4]; // Happy Prince

	var options = {
		num_results: 5,
		trim: true,
		minWordLen: 5,
		maxWordLen: 10,
		accuracy: 20,
		numWords: 4,
		randomizeNumWords: 1,
		separator: '-',
	};

	if (source) {
		options.url = source.url;
		options.dictionary = _last_dict[source.url];
	}
	else
		options.randomSource = true;


	generate(options, function(words, meta, err) {
		if (err) {
			log('generate error:')
			log(err);
			return;
		}
		log('generate ok:' + words + ', '+meta);
		if (source)
			meta.source = source;

		$('#password-1').val(words[0]);
		$('#password-2').val(words[1]);
		$('#password-3').val(words[2]);
		$('#password-4').val(words[3]);
		$('#password-5').val(words[4]);
		$('#source>#title').text(meta.source.name);
		$('#source>#author').text(meta.source.author);
		$('#source>#lang').text(meta.source.language || '');
		$('#source>#url').text(meta.source.url);
		_last_dict[meta.source.url] = meta.dictionary;
	});
})

// show our plugin options
$("#options").on("click", function(e) {
	e.preventDefault();
	ext.tabs.create({'url': ext.extension.getURL('options.html')});
})


