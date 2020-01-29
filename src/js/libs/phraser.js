/**
 * phraser.js
 * license AGPL
 * Copyright (c) 2017 Craig Monro (cmroanirgo), kodespace.com. All rights reserved.
 **/
'use strict';

var rand = require('./crypto-random');
var validators = require('./validators');
var entropy = require('./entropy');
var _ = require('./notunderscore.js');
var log = require('./log').registerLogPROD('phaser')
const DEBUG = true && !_PRODUCTION;

/*
 	plucks sentences out of a source text.
 	It's as much experiemental as anything
*/




/*
Preliminary calcs:
given 10 words...

for 2 random words to be chosen: # possibilies = 10^2 = 100. E = 6.6 bits
for 2 sequential words to be chosen: # possibilies = 10-2+1 = 9. E = 3.1 bits

for 4 random words to be chosen: # possibilities = 10^4 = 10000. E = 13.3 bits
for 4 sequential words to be chosen: # possibilies = 10-4+1 = 7. E = 2.8 bits

So, by choosing MORE words from a known text, then the entropy DECREASES, if they're sequential. 
(This is both logically and intuitively correct, but suicide from a security perspective!)

So, in order for this system to have any real effect we must ASSUME that the attacker doesn't know which source text we used.
This goes against the fundamentals of good password construction, which assumes that the attacker knows everything, except the RANDOMNESS.

So, it's imperative that this option isn't chosen without using a random data source!

Now, for the threat model of attacker trying dictionary attacks or brute force, this method must calculate the MINIMUM strength of all 3 options.
*/


var _defaultLearnOptions = {
	minWordLen: 3,
	maxWordLen: 20,
	lang_iso: 'en'
};
var _defaultCreateOptions = {
	minWordLen: 5,
	maxWordLen: 10
};


///////////////////////////////////////////////////////////////////////
//
function trimWords(text, options) {
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
	return text;
}

function countWords(text) {
	return text.split(' ').length;
}


///////////////////////////////////////////////////////////////////////
//

function Phraser() {
	this.reset();
}

Phraser.prototype.reset = function() {
	this._phrases = [];
	this._lang_iso = 'en';
	this._wordCount = 0;
};

Phraser.prototype.createWords = function(options) {
	const t0 = performance.now();
	options = _.extend({}, _defaultCreateOptions, options);
	if (options.minWordLen>=options.maxWordLen)
		throw new Error("Minimum word length ("+options.minWordLen+") should be shorter than the maximum word length ("+options.maxWordLen+")")

	var targetStrength = options.passwordStrength || 44;

	var src_wordCount = this._wordCount; // we dont mess with this

	var words='';
	var strength = 0;

	function calcStrength(phrase) {
		return entropy.standard(countWords(phrase), src_wordCount); // TODO. This is wrong. it's actually !!!! entropy.standard(1, src_wordCount-numWords+1); which gets worse
		//return entropy.standard(1, src_wordCount - countWords(phrase) + 1);
	}

	var attempts = 50;
	while (strength<targetStrength && this._phrases.length>0 && attempts-->0){
		words = rand.array(this._phrases, '');
		strength = calcStrength(words);

		var ar = words.split(' ');
		var lastWord = '';
		while (strength>=targetStrength && ar.length>2) {
			// trim the last word
			if (ar.length>10) {
				lastWord = ar[10];
				ar = ar.slice(0, 10);
			}
			else {
				lastWord = ar[ar.length-1];
				ar = ar.slice(0, -1);
			}
			words = ar.join(' ');
			strength = calcStrength(words);
		}

		if (lastWord.length>0) {
			// we trimmed too many words & now we're under-strength!
			// put the last word back on
			words += ' ' + lastWord;
			strength = calcStrength(words);
		}

		/*
		This code assumes (correctly) that entropy inceases when less words are chosen
		... but we;re fudging results & can't make these assumptions
		if (strength<targetStrength) {
			// try and beef it up by removing shorter words
			words = trimWords(words, options);
			strength = calcStrength(words);
		}

		var ar = words.split(' ');
		while (strength<targetStrength && ar.length>2) {
			// trim the last word
			if (ar.length>10)
				ar = ar.slice(0, 10);
			else
				ar = ar.slice(0, -1);
			words = ar.join(' ');
			strength = calcStrength(words);
		}
		*/
	}


/*
	if (!this._cache || this._cache.minWordLen != options.minWordLen || this._cache.maxWordLen != options.maxWordLen) 
	{
		this._cache = {
				text: trimWords(this._text, options),
				minWordLen: options.minWordLen,
				maxWordLen: options.maxWordLen,
			};
		this._cache.count = countWords(this._cache.text),
		DEBUG && log('...built word cache in '+_.round(performance.now()-t0)+'ms');
	}


	// use cache
	const src_words = this._cache.text;
	const src_wordCount = this._cache.count;

	var end = src_words.length-200;
	if (end < 200)
		end = src_words.length;
	var idx = rand(0,end);
	// seek the next word
	idx = src_words.indexOf(' ', idx);	
	var startIdx = idx+1;
	var numWords = 0;
	var words='';
	var strength = 0;
	DEBUG && log('...first word idx in '+_.round(performance.now()-t0)+'ms');
	while (strength<targetStrength && src_words.length>0 && idx>=0){
		// seek the next word
		idx = src_words.indexOf(' ', idx+1);
		words = src_words.substring(startIdx, idx);
		numWords++;

		strength = entropy.standard(numWords, src_wordCount); // TODO. This is wrong. it's actually !!!! entropy.standard(1, src_wordCount-numWords); which gets worse
		// TODO. compare against entropy.pickwords() and use worst
	}
*/

	DEBUG && log('generated in '+_.round(performance.now()-t0)+'ms');
	return {
		password: words,
		stats : {
			sourceWordCountMax:  	this._wordCount,
			sourceWordCount:     	src_wordCount,
			strength:            	strength,
		}
	}

	
};

Phraser.prototype.learn = function(text, options) {
	const t0 = performance.now();
	options = _.extend({ }, _defaultLearnOptions, options);
	this._lang_iso = options.lang_iso;

	// perform basic validation on the input string (eg. remove nonword chars, convert to lowercase)
//	if (options.validator)
//		text = options.validator.call(this, text);
	text = validators.gutenbergTrim(text);

	//text = trimWords(text, options)
	// add what's left to our dictionary
	//this._text = text;
	this._phrases = text.split(".").map(function(text) { return validators.multilingual(text.trim()).trim(); });
	this._wordCount = countWords(text);
	DEBUG && log('learnt in '+_.round(performance.now()-t0)+'ms');

};


module.exports = Phraser;