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


const METHOD_STD     = 0; // assumes a fully unicode capabable storage and usage of a password
const METHOD_7BIT    = 1; // assumes that unicode is not supported, and that a string is assumed as ASCII. (This makes a UTF32 string have more ASCII chars)
const METHOD_STRIP   = 2; // assumes the worst kind of unicode support: removes any non-ASCII entirely.
const METHOD_16BYTES = 3; // truncate any string to 16 (ASCII) chars. automatically uses the minimum entropy of the METHOD_7BIT and METHOD_STRIP


function strto7bit(str) {
	// the string needs to be ASCII-fied by removing top bit of each byte
	var temp = '';
	for (var i=0; i<str.length; i++) {
		temp += String.fromCharCode(str.charCodeAt(i) & 0x7f);
	}
	return temp;
}

function stripunichars(str) {
	// strips the unicode chars from a string and only keeps the ASCII chars
	var temp = '';
	const ar = Array.from(str); // this is so that emojis & unicode work by converting to codepoints
	for (var i=0; i<ar.length; i++) {
		if (ar[i].charCodeAt(0)<127)
			temp += ar[i];
	}
	return temp;
}

/*
given a password, calcs the brute force strength
*/
const bruteZones = [
	{ re:/[a-z]/, count:26}, // Lower Case
	{ re:/[A-Z]/, count:26}, // Upper Case
	{ re:/[0-9]/, count:10}, // Numbers
	{ re:/[\!\@\#\$\%\^\&\*\(\)]/, count:10}, // Symbols above Num Keys
	{ re:/[\[\]\\\{\}\|\;\'\:\"\,\.\/\<\>\?\`\~\-\=\_\+]/, count:22} // other Symbols
];

function bruteforce(str, method) {
	if (str.length<1)
		return 1;

	if (method===undefined)
		method = METHOD_16BYTES;

	// test strings
	// 		الاتصال دراسته مسيرة لفترة
	//		publicació ábrica cuestió érprete
	switch (method || 0){ // see METHOD_xxxx
		case METHOD_7BIT:
			// the string needs to be ASCII-fied by removing top bit of each byte
			str = strto7bit(str);
			break;

		case METHOD_STRIP:
			// strips the unicode chars from a string and only keeps the ASCII chars
			str = stripunichars(str);
			break;

		case METHOD_16BYTES:
			var str7bit = strto7bit(str);
			if (str7bit.length>16)
				str7bit = str7bit.slice(0,16);
			var strstrip = stripunichars(str);
			if (strstrip.length>16)
				strstrip = strstrip.slice(0,16);
			var ent7bit = bruteforce(str7bit, METHOD_STD);
			var entstrip = bruteforce(strstrip, METHOD_STD);
			return Math.min(ent7bit, entstrip);
			break;
	}

	var symbolcount = 0;

	const arCodePoints = Array.from(str); // this is so that emojis & unicode work by converting to an array of chars based on codepoints. The chars are really strings
	for (var i=0; i<arCodePoints.length; i++) {
		if (arCodePoints[i].charCodeAt(0)>127)
			symbolcount += 1;
	}

	if (symbolcount===0) {
		// no 'foreign' chars found
		symbolcount += bruteZones.reduce(function(count, zone, idx) {
			if (str.match(zone.re))
				return count + zone.count;
			return count;
		}, 0)
	}
	else
	{
		// assume brute force must test upper, lower, numbers and all std symbols
		symbolcount += 32 + 10 + 26 + 26;
	}

	return standard(str.length, symbolcount);
}

module.exports = {
	//ENGLISH_DICT_SIZE: 2048, // # words in english dict. this gives E=44 for 4 words. 
	ENGLISH_DICT_SIZE: 5000, // NB: We DON'T require('./english').size, so that the whole english dict won't be loaded uncessarily into popup or options
	standard: standard,
	//diceroll: diceroll,
	wordpick: wordpick,
	bruteforce: bruteforce,
	countBits: countBits
};

