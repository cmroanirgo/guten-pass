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
		name: "Complete Works of Shakespeare",
		author: "Shakespeare",
		url: "cache/epub/100/pg100.txt",
		validator: validators.play
	},*/
	{
		name: "Macbeth",
		author: "Shakespeare",
		url: "cache/epub/2264/pg2264.txt",
		validator: function(text) {
			text = text.replace(/[\s\S]+David Reed/g, ''); // last line before start of play is this
			return validators.play(text);
		}
	},
	{
		name: "Legends Of The Gods",
		author: "E. A. Wallis Budge",
		url: "cache/epub/9411/pg9411.txt",
	},
	{
		name: "The Aenid",
		author: "Virgil",
		url: "cache/epub/227/pg227.txt",
		language: "latin",
	},
	{
		name: "Bulfinch's Mythology: The Age of Fable",
		author: "Thomas Bulfinch",
		url: "cache/epub/3327/pg3327.txt"
	},
	{
		name: "The Happy Prince and Other Tales",
		author: "Oscar Wilde",
		url: "cache/epub/30120/pg30120.txt"
	},
	{
		name: "Journal of Entomology and Zoology, Volume 11, Number 4, December 1919",
		author: "Gunthorp, Alexander and Hilton",
		url: "cache/epub/37632/pg37632.txt"
	},
	{
		name: "Astounding Stories of Super-Science, January 1930",
		author: "Various",
		url: "cache/epub/41481/pg41481.txt"
	},
	{
		name: "Pride and Prejudice",
		author: "Jane Austen",
		url: "files/1342/1342-0.txt"
	}
];

module.exports = { 
	sources: known_sources, 
	base_url: 'https://gutenberg.org/',
	default_validator: validators.gutenberg,
}

})();
