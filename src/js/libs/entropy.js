/**
 * entropy.js
 * @license AGPL
 * Copyright (c) 2017 Craig Monro (cmroanirgo), kodespace.com. All rights reserved.
 **/

 // calculates entropy




function standard(length, symbolcount) {
	// See https://en.wikipedia.org/wiki/Password_strength
	symbolcount = symbolcount || 27; // 27 is true for case-insensitive english passwords, with 1 symbol
	return length * countBits(symbolcount);
}

function diceroll(num_rolls, die_size, misc_symbols_spacer) { 
	// NB: This isn't the real diceware roll!!!

	// eg 5 words, of 3000 words with 1 space ==> diceroll(5, 3000, 1) ==> 5*countBits(3000)+countBits(1)
	// NB: the misc_symbols_spacer is either there or not for allthe dicerolls, & is assumed independant to the roll, hence constant
	// NB: words can be repeated
	return num_rolls*countBits(dictionary_size) + countBits(misc_symbols_spacer);
}


function wordpick(num_words, dictionary_size, misc_symbols_spacer) { 
	// This is the same as diceroll BUT assumes that words are not rechosen/repeated
	// NB: technically, if words are NOT repeated, then
	//     5*countBits(3000) is ACTUALLY countBits(3000) + countBits(2999) + countBits(2998) + countBits(2997) + countBits(2996)
	var numBits = countBits(misc_symbols_spacer);
	while (num_words-- >0) {
		numBits += countBits(dictionary_size--);
	}
	return numBits;
}

function countBits(num) {
	num = num || 0;
	return Math.log(num)/Math.log(2); // if it takes 8.1 bits, it really takes 9. 
}

module.exports = {
	standard: standard,
	diceroll: diceroll,
	wordpick: wordpick,
	countBits: countBits
};