/**
 * dict.js
 * license AGPL
 * Copyright (c) 2017 Craig Monro (cmroanirgo), kodespace.com. All rights reserved.
 **/
'use strict';

// This basically replaces Wordish altogether
// Why? Wordish builds trees based on letter usage, up to certain depths. This is a simple dictionary... a list of words with no regard to usage counts

/// NB. Although this should be ooodles faster than Wordish, there's been no attempt to ensure this is the quickest way to build the list
// This will probably be a more memory hungry solution.

var Randomizer = require('./randomizer');
var defaultValidator = require('./validators').default;




function rand(from, to) {
	var r = new Randomizer(1);
	return r.generate(from, to); 
}

function extend(origin) { // copied from electron-api-demos/node_modules/glob/glob.js & then hacked to oblivion
	// now, you can keep extending, by using
	// _.extend(origin, data1, data2, data3) & all options will be added onto origin only.
	// The 'rightmost' value of a key will be applied.

	for (var a=1; a<arguments.length; a++) {
		var add = arguments[a];
		if (add === null || typeof add !== 'object')
			continue;

		var keys = Object.keys(add)
		var i = keys.length
		while (i--) {
			origin[keys[i]] = add[keys[i]]
		}
	}

	return origin
}


var _defaultLearnOptions = {
	minWordLen: 3,
	maxWordLen: 20,
	validator: defaultValidator
};
var _defaultCreateOptions = {
	numWords: 4,
	randomizeNumWords: 1,
	minWordLen: 5,
	maxWordLen: 10
};




function RootDict() {
	this.reset();
}


RootDict.prototype.reset = function() {
	this._totalUsage = 0;
	this._words = { }; // a map of word to usage eg. 'funkyword':1
};


RootDict.prototype.createWords = function(options) {
	options = extend({}, _defaultCreateOptions, options);
	if (options.minWordLen>=options.maxWordLen)
		throw new Error("Minimum word length ("+options.minWordLen+") should be shorter than the maximum word length ("+options.maxWordLen+")")

	var src_words = Object.keys(this._words).filter(function(word) {
		// make sure the list has only words of the right length
		return word.length>=options.minWordLen && word.length<=options.maxWordLen;
	})

	var words = [];
	var numWords = options.numWords + (options.randomizeNumWords>0 ? rand(0, options.randomizeNumWords): 0);
	while (numWords-->0){
		var attempts = 50; // 50 attempts to find unique words 
		do
		{
			var w = src_words[rand(0,src_words.length-1)];

		} while (words.indexOf(w)>=0 && attempts-->0)
		if (!attempts)
			throw new Error("Not enough source text to generate a word. Decrease accuracy &/or required word length or add more words");
		words.push(w);
	}
	return words;
};


RootDict.prototype.learn = function(phrase, options) {
	options = options || {};
	if (typeof options === 'function')
		options = { validator: options };
	options = extend({}, _defaultLearnOptions, options);

	// perform basic validation on the input string (eg. remove nonword chars, convert to lowercase)
	if (options.validator)
		phrase = options.validator.call(this, phrase);

	// build a regExp to exclude all words < options.minWordLen and >options.maxWordLen
	if (options.minWordLen>0) {
		var minStr = "(?:^| )([^ ]{1," + Math.max(0,options.minWordLen-1) + "})(?=$| )"
		var reMin = new RegExp(minStr, "gi");
		phrase = phrase.replace(reMin, ' ');
	}
	if (options.maxWordLen>0) {
		var maxStr = "(?:^| )([^ ]{" + (options.maxWordLen+1) + ",})(?=$| )"
		var reMax = new RegExp(maxStr, "gi");
		phrase = phrase.replace(reMax, ' ');
	}
	// get rid of excessive whitespace
	phrase = phrase.replace(/ {2,}/g, ' ').trim(); 

	// add what's left to our dictionary
	var all_words = phrase.split(' ');
	var _this = this;
	all_words.forEach(function(word) {
		_this._words[word] = (_this._words[word] || 0)+1; 
		_this._totalUsage++;
	})
	return phrase;
};


// static
RootDict.random = function(from, to) { 
	return rand(from, to);
};



module.exports = RootDict;




