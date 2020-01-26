/**
 * entropy.js
 * @license AGPL
 * Copyright (c) 2017 Craig Monro (cmroanirgo), kodespace.com. All rights reserved.
 **/

 // calculates entropy

/*
A calculator (for brute force):
	http://rumkin.com/tools/password/passchk.php / 
*/


/*
https://www.pleacher.com/mp/mlessons/algebra/entropy.html

The formula for entropy is:
	E = log2(R^L)

where:
	R = pool of unique chars
	L = # characters in pwd
	therefore, R^L = #possible pwd
	E = entropy

Also:
	Lowercase                            26
	Lower & Upper Case                   52
	Alphanumeric                         36
	Alphanumeric & Upper Case            62
	Common ASCII Characters              30
	Diceware Words List               7,776
	English Dictionary Words        171,000	

Password strength is determined with this chart:
	< 28 bits = Very Weak; might keep out family members
	28 - 35 bits = Weak; should keep out most people, often good for desktop login passwords
	36 - 59 bits = Reasonable; fairly secure passwords for network and company passwords
	60 - 127 bits = Strong; can be good for guarding financial information
	128+ bits = Very Strong; often overkill
*/


/*
CM Math notes:

	E = log2(R^L) == L*log2(R)   (eg log2(x^4) ==> 4*log2(x))

hence:
	E = L*log2(R)


below:
	symbolcount === R
	length      === L



therefore. 4 random words: correct horse battery staple
	E = 44  
	  = log2(R^4)
	  = 4*log2(R)

	log2(R) = 44/4 == 11
	
	R = 2^ 11
	  = 2048 words in english dict used for xkcd 
*/

var log2 = Math.log2;
if (!log2)
	log2 = function __log2(num) { 
		return Math.log(num)/Math.log(2);
	}

function standard(length, symbolcount) {
	// See https://en.wikipedia.org/wiki/Password_strength
	symbolcount = symbolcount || 27; // 27 is true for case-insensitive english passwords, with 1 symbol
	//return length * countBits(symbolcount);
	return length * log2(symbolcount)
}

/*
function diceroll(num_rolls, die_size, misc_symbols_spacer) { 
	// NB: This isn't the real diceware roll!!!

	// eg 5 words, of 3000 words with 1 space ==> diceroll(5, 3000, 1) ==> 5*countBits(3000)+countBits(1)
	// NB: the misc_symbols_spacer is either there or not for allthe dicerolls, & is assumed independant to the roll, hence constant
	// NB: words can be repeated
	return num_rolls*countBits(dictionary_size) + countBits(misc_symbols_spacer);
}
*/

function wordpick(num_words, dictionary_size, misc_symbols_spacer) { 
	// This is the same as diceroll BUT assumes that words are not rechosen/repeated
	// NB: technically, if words are NOT repeated, then
	//     std(5, 3000) is ACTUALLY std(1, 3000) + std(1, 2999) + std(1, 2998) + std(1, 2997) + std(1, 2996)
	var numBits = standard(1, misc_symbols_spacer); // the space char is constant between all words, hence length '1' (rather than 4, or 5)
	while (num_words-- >0) {
		numBits += standard(1, dictionary_size--);
	}
	return numBits;
}

function countBits(num) { // don't use. ambiguous. use standard(1, num) instead
	num = num || 1;
	return log2(num);
}

module.exports = {
	ENGLISH_DICT_SIZE: 2048, // # words in english dict. this gives E=44 for 4 words.
	standard: standard,
	//diceroll: diceroll,
	wordpick: wordpick,
	countBits: countBits
};