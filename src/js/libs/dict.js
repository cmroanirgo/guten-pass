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

var rand = require('./crypto-random');
var defaultValidator = require('./validators').multilingual;
var entropy = require('./entropy');
var english = require('./english');
var _ = require('./notunderscore.js');



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
	validator: defaultValidator,
	lang_iso: 'en'
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
	//this._rawWordCount = 0; // # words in source. NOT unique NOT USED
	this._wordCount = 0; // # unique words
	//this._englishWordCount = 0; // # unique words found in english5000 // NOT USED
	this._lang_iso = 'en';
	this._words = { }; // a map of word to usage eg. 'funkyword':1
};


RootDict.prototype.createWords = function(options) {
	options = extend({}, _defaultCreateOptions, options);
	if (options.minWordLen>=options.maxWordLen)
		throw new Error("Minimum word length ("+options.minWordLen+") should be shorter than the maximum word length ("+options.maxWordLen+")")

	var src_englishWordCount = 0;
	var src_words = Object.keys(this._words).filter(function(word) {
		// make sure the list has only words of the right length
		if (word.length>=options.minWordLen && word.length<=options.maxWordLen) {
			if (english.is(word))
				src_englishWordCount++;
			return true;
		}
		return false;
	})


	// get/choose a separator
	var sep = _.isString(options.separator) ? options.separator : ' ';
	var num_sep_symbols = 1;
	if (sep==="custom") {
		sep = rand.array(options.customSeparator, '') // empty if an error, which is probably what user wants
		num_sep_symbols = Math.max(1, options.customSeparator.length);
	}

	var targetStrength = options.passwordStrength || 44;

	// NB: NB: NB: src_englishWordCount <= english.size (by definition)
	var entropyDictionarySize;
	if (src_englishWordCount === src_words.length)
		// ALL are english words. unlikely
		// so, use the smaller
		entropyDictionarySize = src_englishWordCount;
	else
		// this dict has words NOT found in the standard dictionary. This is good. This is expected for this project
		entropyDictionarySize = english.size - src_englishWordCount + src_words.length;


	var words = [];
	var strength = 0;
	while (strength<targetStrength && src_words.length>0){
		var attempts = 50; // 50 attempts to find unique words 
		do
		{
			var w = src_words[rand(0,src_words.length)];

		} while (words.indexOf(w)>=0 && attempts-->0)

		words.push(w);

		if (!attempts)
//			log.error("Not enough source text to generate a word. Decrease accuracy &/or required word length or add more words");
			targetStrength = 0;
		else
			strength = entropy.wordpick(words.length, entropyDictionarySize, num_sep_symbols);
	}

	// return extra meta-info about the dictionary and the result set.
	return {
		password: words.join(sep),
		stats : {
			sourceWordCountMax:  	this._wordCount,
			sourceWordCount:     	src_words.length,
			englishSourceWordCount: src_englishWordCount,
			uniqueSourceWordCount: 	src_words.length-src_englishWordCount,
			wordCount:              words.length,
			sepCount: 		     	num_sep_symbols, 
			strength:            	strength,
			//pctAlphaNum:    100*this._alphaNumLetterCount / totalLetters,
			//pctSymbols:     100*this._symbolLetterCount / totalLetters,
			//pctNonAlpha:    100*this._nonAlphaLetterCount / totalLetters
		}
	}
};



RootDict.prototype.learn = function(text, options) {
	options = extend({ }, _defaultLearnOptions, options);
	this._lang_iso = options.lang_iso;

	// perform basic validation on the input string (eg. remove nonword chars, convert to lowercase)
	if (options.validator)
		text = options.validator.call(this, text);

	// build a regExp to exclude all words < options.minWordLen and >options.maxWordLen
	if (options.minWordLen>0) {
		var minStr = "(?:^| )([^ ]{1," + Math.max(0,options.minWordLen-1) + "})(?=$| )"
		var reMin = new RegExp(minStr, "gi");
		text = text.replace(reMin, ' ');
	}
	if (options.maxWordLen>0) {
		var maxStr = "(?:^| )([^ ]{" + (options.maxWordLen+1) + ",})(?=$| )"
		var reMax = new RegExp(maxStr, "gi");
		text = text.replace(reMax, ' ');
	}
	// get rid of excessive whitespace
	text = text.replace(/ {2,}/g, ' ').trim(); 

	// add what's left to our dictionary
	var all_words = text.split(' ');
	var _this = this;
	all_words.forEach(function(word) {
		_this._words[word] = (_this._words[word] || 0)+1; 
		if (_this._words[word] === 1) {
			// this is a new word. build some extra stats
			_this._wordCount++;

			//if (english.is(word))
			//	_this._englishWordCount++; NOT USED
		}
		//_this._rawWordCount++; // NOT USED
	})
	return text;
};




module.exports = RootDict;




