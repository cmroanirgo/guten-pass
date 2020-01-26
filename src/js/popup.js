/**
 * popup.js
 * @license AGPL
 * Copyright (c) 2017 Craig Monro (cmroanirgo), kodespace.com. All rights reserved.
 **/

/*
* This file is used by popup.html
* popup.html is shown when the user clicks on the browser button in the toolbar
*/
'use strict';

const ext = require("./webext");
const $ = ext.$;
const _ = ext._;
const entropy = require("./libs/entropy");
const statslib = require('./libs/stats');

const sendMessage = ext.runtime.sendMessage.bind(ext.runtime);

const DEBUG = true && !_PRODUCTION;
const log = ext.registerLogPROD('gp-popup');
var _options = {};


///////////////////////////////////////////////////////////////////////////////////////////
//
//
//

// launch
$('#ajax').hide(); 
$('#message').hide(); 
if (_PRODUCTION)
	$('#reset').get(0).remove();
$('#source>#delete').disable();

//$('#ajax img')..attr('src', ext.runtime.getURL("icons/animate.gif"));
loadSources();
loadOptions();
setTimeout(generate, 100);

function loadOptions() {
	ext.storage.get('options', function(resp) {
		ext.logLastError('loadOptions');

		if (resp.options)
			_options = resp.options;
		onOptionsUpdated();
	});
}
function loadSources() {
	require('./libs/load-sources')(function(sources) {
		onSourcesUpdated(sources);
		onOptionsUpdated();
	})
}


///////////////////////////////////////////////////////////////////////////////////////////
//
//
//

// Listen to broadcast messages
ext.runtime.onMessage.addListener(function(request, sender, sendResponse) {

	switch(request.action) {

		case 'gp-optionsChanged':
			DEBUG && log("Options changed")
			_options = request.options; 
			onOptionsUpdated();
			break;

		case 'gp-ajax':
			log('gp-ajax status:', request.status);
			$('#popup input').disable(request.status === 'begin'); // or 'end' is th eone other state
			$('#ajax').show(request.status === 'begin');
			break;
		default:
			return false;

	}
	if (sendResponse)
		return sendResponse();
});


function onOptionsUpdated() {

	var val = $($('#sources').children().get(0)).val(); // == "random"
	if (!_.isEmpty(_options.source_url))
		val = _options.source_url;
	$('#sources').val(val);
	$('#num-words').val(_options.numWords || 4).copyValToNext();
	$('#rand-words').val(_options.randomizeNumWords || 1).copyValToNext();
	$('#min-len').val(_options.minWordLen || 5).copyValToNext();
	$('#max-len').val(_options.maxWordLen || 10).copyValToNext();
	$('#separator').val(_options.separator || ' ');
}

function saveOptions() {
	_options.source_url = $('#sources').val();
	_options.numWords = parseInt($('#num-words').val());
	_options.randomizeNumWords = parseInt($('#rand-words').val());
	_options.minWordLen = parseInt($('#min-len').val());
	_options.maxWordLen = parseInt($('#max-len').val());
	_options.separator = $('#separator').val();
	sendMessage({action: 'gp-optionsChanged', options: _options}, ext.logLastErrorCB('saveOptions'))
}


function onSourcesUpdated(sources) {
	var selected = $('#sources').val();
	var selectEl = $('#sources').get(0);
	while (selectEl.children.length>1) {
		DEBUG && log("children delete: " + selectEl.children.length)
		selectEl.remove(1);
	}

	var html = '';
	sources.forEach(function(source) {
		html += "<option value=\""+source.url+"\">"+_.htmlEncode(source.title)+"</option>\n"
	})
	$('#sources').appendHtml(html).val(selected);
}

///////////////////////////////////////////////////////////////////////////////////////////
//
// utils
//
$.register({
	appendHtml: function(html) { // appends child
		this.each(function(i, el) { 
			var newEls = htmlToElements(html);
			$(newEls).each(function(i2, newEl) {
				el.appendChild(newEl);	
			})
			
		});
		return this;
	},

	next: function() { 
		return $(this.elems[0].nextElementSibling); 
	},

	copyValToNext: function() {
		// given: <input...> <span></span>
		// get the 'input' value and set the span's textContent
		return this.each(function() {
			var v = $(this).val();
			$(this).next().text(v);
		})
	}		
});

function round(val) { return Math.round(val*1000)/1000; } 


/*function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}*/
function htmlToElements(html, rootSelector) {
	rootSelector = rootSelector || 'body>*:not(script)';
	const parser = new DOMParser();
	const newNode = parser.parseFromString(html, 'text/html');
	var els = newNode.querySelectorAll(rootSelector);
	return els;
}

function getGutenEBookUrl(source) {
	// given a url for the actual text for a book, back-generate the 'likely' ebook main link
	//if (source.ebook_url)
	//	return source.ebook_url; // this NEVER happens, because there's no support for it ;-)

	// use the text url to strip out the eBook's id. eg.
	//		https://gutenberg.org/cache/epub/9411/pg9411.txt ==> https://www.gutenberg.org/ebooks/9411
	//		https://gutenberg.org/files/1342/1342-0.txt      ==> https://www.gutenberg.org/ebooks/1342
	//		https://www.gutenberg.org/ebooks/16328.txt.utf-8 ==> https://www.gutenberg.org/ebooks/16328
	var results = source.url.match(/\/(\d+)[\/\.\-]/);
	if (!results || results.length<2)
		return null;
	var bookId = results[1]; // result[0] === "/1234/"    result[1] === "1234"
	return "https://www.gutenberg.org/ebooks/" + bookId;

}


///////////////////////////////////////////////////////////////////////////////////////////
//
//
//
function generate() {
	const t0 = performance.now();
	$('#generate').disable();
	sendMessage({ action: "gp-generate", num_results:5  }, function(response) {

		$('#generate').enable();
		if (!response) {
			ext.logLastError('Failed to generate');
			return;
		}
		if (response.error) {
			log("Failed to generate: " + response.error);
			//console.error(err);
			return;
		}

		var words = response.words;
		var meta = response.meta;

		var t1 = performance.now();
		DEBUG && log('generated in '+round(t1-t0)+'ms : ' + words);

		$('#password-1').setPassword(0, words, meta);
		$('#password-2').setPassword(1, words, meta);
		$('#password-3').setPassword(2, words, meta);
		$('#password-4').setPassword(3, words, meta);
		$('#password-5').setPassword(4, words, meta);
		$('#source>#dictionary_count').text(meta.stats.dictionarySize + ' of ' + meta.stats.bookWordCount);

		var title = meta.source.title;
		if (meta.source.lang && meta.source.lang_iso!='en')
			title += " (" + meta.source.lang + ")";

		$('#source>#title').text(title) // NB: htmlEncode not needed for text()
			.attr('href', getGutenEBookUrl(meta.source)) 
			.attr('data-url', meta.source.url)
			.attr('data-lang', meta.source.lang_iso);
		$('#source>#delete').disable(_.isEmpty(meta.source.url));
	})
}


function isEnglish(lang_iso) {
	return !lang_iso || _.isEmpty(lang_iso) || lang_iso == 'en';
}


$.register({
	setPassword: function(idx, words, meta) {
		//var numWords = options.numWords;
		//var randomizeNumWords = options.randomizeNumWords;
		var el = this.get(0); 
		words = words[idx];
		$(el).val(words);

		// const stdEnglishDictSize = entropy.ENGLISH_DICT_SIZE; 

		var dictionary_count = meta.stats.dictionarySize;
		var num_words = meta.stats.pwdWordCounts[idx];
		var stats = statslib.letter(words);
		var numSymbols=0;
		if (stats.alpha>0) numSymbols += 26;
		if (stats.alphaCap>0) numSymbols += 26;
		if (stats.num>0) numSymbols += 10;
		if (stats.symbols>0) numSymbols += 20; // 20 is common
		if (stats.nonAlpha>0) {
			var extra = statslib.langExtraCharCount(meta.source.lang_iso); 
			if (stats.uniqueNonAlpha>extra) // our statslib function is rudmentry, but correct only on a small set of languages, this helps pick up on others
				extra = stats.uniqueNonAlpha;
			numSymbols += extra;
		}

		// TODO, chinese & japanese kanji are words -per -letter
		
		if (stats.nonAlpha>0 || !isEnglish(meta.source.lang_iso))
			// foreign langs enjoy instant extra dictionary sized karma ;-)
			//Note: Middle English (enm) also arrives here, "wych is gud" because it's a different english altogether!
			dictionary_count += entropy.ENGLISH_DICT_SIZE; 
		else
			// perhaps our english words are ALL non-standard... but we should have a baseline just in case
			// (to make this accurate, we'd need to do word lookups in an ACTUAL std dictionary and compare)
			dictionary_count = Math.max(dictionary_count, entropy.ENGLISH_DICT_SIZE);

		const dictSpacerSymbols = 10; // see popup.html #separator
		var ent = entropy.wordpick(num_words, dictionary_count, dictSpacerSymbols); 

/*
		var ent_std = entropy.standard(words.length, numSymbols)

*/

		var low = 28;
		var high = 60;
		/*var pct = parseInt(Math.round((ent-low)*100/(high-low))); // entropy as a percent. fudge factor
		var hue = pct*1.2; // x1.2 b/c 100% strong == 120 hue/green
		if (hue<0) hue=0; // don't go beyond red
		if (hue>120) hue=120; // don't go beyond green
		*/

/*
	< 28 bits = Very Weak; might keep out family members
	28 - 35 bits = Weak; should keep out most people, often good for desktop login passwords
	36 - 59 bits = Reasonable; fairly secure passwords for network and company passwords
	60 - 127 bits = Strong; can be good for guarding financial information
	128+ bits = Very Strong; often overkill
*/		
		var hues       = [ 0, 30, 60, 120, 160, 170 ]; // red, orange, yellow, green, cyan (& cyan. probably not used)
		var ent_ranges = [ 0, 28, 36,  60, 128, 20000 ]; // 20000 = max === unattainable. Not used
		var ent_idx = 4;
		while (ent<ent_ranges[ent_idx] && ent_idx>0)
			ent_idx--;
		var hue = hues[ent_idx] + (hues[ent_idx+1] - hues[ent_idx])*(ent-ent_ranges[ent_idx])/(ent_ranges[ent_idx+1]-ent_ranges[ent_idx])/2;
		var color = "hsl("+hue+",100%,50%)";
		var strengthEl = el.nextElementSibling.nextElementSibling;
		$('.line', strengthEl).css('width', (ent*2)+'px').css('background-color', color);

		ent = statslib.round(ent,0);
		//ent_db_dictionary = statslib.round(ent_db_dictionary,0);
		//ent_std = statslib.round(ent_std,0);
		$('.value', strengthEl).text(ent/* + ' : ' + ent_db_dictionary +' : ' + ent_std*/);
		return this;
	}
})

var _flash = null;
function flashMessage(str) {
	if (!_flash)
		clearTimeout(_flash);
	$('#message').text(str).show();
	_flash = setTimeout(function() {
		_flash = null;
		$('#message').text('').hide();
	}, 2000)
}


$('button.copy').on("click", function(e) {
 	this.previousElementSibling.select(); // Select the adjacent input
  	document.execCommand('copy');
  	flashMessage('Copied to clipboard');

});
$("#generate").on("click", function(e) {
	e.preventDefault();
	generate();
})
$('#sources').on("change", function(e) {
	e.preventDefault();
	sendMessage({ action: "gp-setSource",
		source_url:$(this).val()
	  }, 
	  function() {
	  	ext.logLastError('gp-setSource');
	  	setTimeout(generate,10); // call generate in a little bit
	  });
})

// ranges
var _saveDelayTimer;
function doSaveDelay() {
	if (_saveDelayTimer)
		clearTimeout(_saveDelayTimer);
	_saveDelayTimer = setTimeout(function() {
		_saveDelayTimer = null;
		saveOptions();
		generate();
	}, 300)

}

$('input[type="range"]').on("input", function(){
		$(this).copyValToNext();
		doSaveDelay();
	}).copyValToNext();
$('select#separator').on('change', function(e) {
	doSaveDelay();
});


/*
$("#delete").on("click", function(e) {
	var url = $('#source>#title').attr('data-url');
	$(this).disable();
	sendMessage({action:"gp-deleteSource", url: url}, function(resp) {
		ext.logLastError('deleteSource');
		if (resp && resp.error) {
			alert("Failed to remove the source:\n\n"+resp.error);
		}
		loadOptions();
		loadSources();
	});
})
*/
$("#reset").on("click", function(e) {
	e.preventDefault();
	sendMessage({ action: "gp-resetAllData"  }, function() { 
		ext.logLastError('gp-resetAllData');
		loadOptions();
		loadSources();
	});
	flashMessage("Resetting all data...")
})
