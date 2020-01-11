/**
 * fetch.js
 * license AGPL
 * Copyright (c) 2017 Craig Monro (cmroanirgo), kodespace.com. All rights reserved.
 **/


// A library of gutenburg texts, ready for fetching

(function(){ 



const validators = require('./validators');


var known_sources = [
	/*{
		title: "Complete Works of Shakespeare",
		author: "Shakespeare",
		url: "cache/epub/100/pg100.txt",
		validator: validators.play
	},*/
	{
		title: "Macbeth by Shakespeare",
		url: "https://gutenberg.org/cache/epub/2264/pg2264.txt",
		validator: function(text) {
			text = text.replace(/[\s\S]+David Reed/, ''); // last line before start of play is this
			return validators.play(text);
		}
	},
	{
		title: "Legends Of The Gods by E. A. Wallis Budge",
		url: "https://gutenberg.org/cache/epub/9411/pg9411.txt",
	},
	{
		title: "The Aenid by Virgil",
		url: "https://gutenberg.org/cache/epub/227/pg227.txt",
		language: "latin",
	},
	{
		title: "Bulfinch's Mythology: The Age of Fable by Thomas Bulfinch",
		url: "https://gutenberg.org/cache/epub/3327/pg3327.txt"
	},
	{
		title: "The Happy Prince and Other Tales by Oscar Wilde",
		url: "https://gutenberg.org/cache/epub/30120/pg30120.txt"
	},
	{
		title: "Journal of Entomology and Zoology, Volume 11, Number 4, December 1919 by Gunthorp, Alexander and Hilton",
		url: "https://gutenberg.org/cache/epub/37632/pg37632.txt"
	},
	{
		title: "Astounding Stories of Super-Science, January 1930",
		url: "https://gutenberg.org/cache/epub/41481/pg41481.txt"
	},
	{
		title: "Pride and Prejudice by Jane Austen",
		url: "https://gutenberg.org/files/1342/1342-0.txt"
	},
	{
		title: "老子 by Laozi",
		lang: "Chinese",
		url: "https://gutenberg.org/files/24039/24039-0.txt"
	},
	{
		title: "Αθηναίων Πολιτεία by Aristotle",
		lang: "Greek",
		url: "https://gutenberg.org/files/39963/39963-0.txt"
	}
];

module.exports = { 
	sources: known_sources, 
	base_url: 'https://gutenberg.org/',
	default_validator: validators.gutenberg,
}

})();
