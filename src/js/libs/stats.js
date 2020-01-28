/**
 * stats.js
 * license AGPL
 * Copyright (c) 2017 Craig Monro (cmroanirgo), kodespace.com. All rights reserved.
 * 
 **/


function getLetterStats(word) {
	var alpha = 0;
	var alphaCap = 0;
	var num = 0;
	var symbols = 0;
	var nonAlpha = 0;
	var usedSymbols = {};
	var usedNonAlpha = {};
	for (var i=0; i<word.length; i++) {
		var c = word[i];
		var cp = word.codePointAt(i);
		if (word[i]>='a' && word[i]<='z') alpha++;
		else if (word[i]>='A' && word[i]<='Z') alphaCap++;
		else if (word[i]>='0' && word[i]<='9') num++;
		else if (cp>127) {
			nonAlpha++;
			usedNonAlpha[cp] = (usedNonAlpha[cp] || 0) + 1;
		}
		else {
			symbols++;
			usedSymbols[c] = (usedSymbols[c] || 0) + 1;
		}
	}
	// sometimes too many stats is a bad thing. alphaNum should be sufficient for std password crack stats/ entropy vs. eg Greek
	//var alphaNum = alpha + alphaCap + num; 
	//var nonAlpha = word.length - alphaNum;
	return { 
		alpha: alpha,
		alphaCap: alphaCap,
		num: num,
		//alphaNum: alphaNum, 
		symbols: symbols, 
		nonAlpha: nonAlpha,
		uniqueSymbols: Object.keys(usedSymbols).length,
		uniqueNonAlpha: Object.keys(usedNonAlpha).length
		 }; 
}



//function symbolCountAlpha() { return 26; }
//function symbolCountNum() { return 10; }
//function symbolCountSymbol() { return 20; } // 20 is common
//function symbolCountNonAlphaNum() { return 1000; } // tricky. could be part of entire Unicode (1 million), or UTF-16 (64k), or just emoji (1k), or just a language subset
function getLanguageExtraCharCount(lang) {
	// lang is ISO 639, which RFC4646 denotes, which is what gutenberg.org uses.
	// NB: Does NOT include non-words. does NOT include std AlphaNumeric, Case insensitive, where possible
	//const case_insensitive = true;
	if (!lang)
		lang = 'en';
	// trim out the sub language
	var ar = lang.split(/[-_]/);
	if (ar.length>1)
		lang = ar[0];

	// arabic: 28
	// japanese: 46+46+ ?? 2000 (say 500) + 26 en 
	// simpl chinese: 7000, 900 is 90% though
	// korean: 24
	// russian: 33
	// spanish: 29
	// german: 26+1
	// italitan: 21 (subset of en)
	// french: 26 (en)
	// greek: 24
	switch (lang) {
		case 'el': return 24; // greek: 24
		case 'ar': return 28;  // arabic: 28
		case 'ja': return 574; // japanese: 46+46+ ?? 2000 (say 500) + 26 en 
		case 'zh': return 900; // simpl chinese: 7000, 900 is 90% though
		case 'ko': return 24;  // korean: 24
		case 'ru': return 33;  // russian: 33
		case 'es': return 3;   // spanish: 29
		case 'de': return 27;  // german: 26+1
		case 'it': return 0;   // italitan: 21 (subset of en)
		case 'fr': return 0;   // french: 26 (en)
		case 'hi': return 52; // hindi

		case 'en': 
		default: // english
			return 0; // NB: This function returns NON alphaNum!!!! hence zero

	}
}




module.exports = {
	langExtraCharCount: getLanguageExtraCharCount,
	letter: getLetterStats
};
