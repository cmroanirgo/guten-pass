/**
 * options.js
 * @license AGPL
 * Copyright (c) 2017 Craig Monro (cmroanirgo), kodespace.com. All rights reserved.
 **/

/*
 * This file is loaded by options.js and is self-contained otherwise
 *
*/

'use strict';

const ext = require("./webext");
const humanise = require("./libs/humanise")
const storage = ext.storage;
const $ = ext.$;
const _ = ext._;
const log = ext.registerLogPROD('gp-options');
const DEBUG = true && !_PRODUCTION;
const sendMessage = ext.runtime.sendMessage.bind(ext.runtime);



/*
 TODO:

 - show a checked list of already downloaded files
*/


///////////////////////////////////////////////////////////////////////////////////////////
//
//
//
var _sources = [];
var _options = {};

const DEFAULT_CUSTOM_SEPS = '+ -_.';

// launch
loadSources();
loadOptions();




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
		updateBytesUsed();
	})
}


function onSourcesUpdated(sources) {
	_sources = sources;
	var sourceEl = $('#sources').get(0);
	while (sourceEl.firstChild) {
		sourceEl.removeChild(sourceEl.firstChild); }
	var html = '';
	_sources.forEach(function(src) {
		var id=getBookId(src);
		html += '<div id="'+id+'" class="source" data-url="'+src.url+'">' + 
			'<div class="title"><a href="https://www.gutenberg.org/ebooks/'+ id+'" target="_new">' + _.htmlEncode(src.title) + '</a></div>' + 
			'<div class="ops">'+
				'<a href="'+ src.url+'" target="_new">Text</a>'+
				'<button id="load-'+id+'" class="load">Load</button>'+
				'<button id="unload-'+id+'" class="unload">Unload</button>'+
				'<button id="delete-'+id+'" class="delete">Delete</button>'+
			'</div>' + 
		 '</div>\n';
	})
	$('#sources').appendHtml(html);
	$("#sources .ops>.delete").on("click", function(e) {
		var url = $(this).getParent('.source[data-url]').attr('data-url');
		$(this).disable();
		sendMessage({action:"gp-deleteSource", url: url}, function(resp) {
			ext.logLastError('deleteSource');
			if (resp && resp.error) {
				ext.extension.getBackgroundPage().alert("Failed to remove the source:\n\n"+resp.error);
			}
			loadOptions();
			loadSources();
		});
	})		
}

function onOptionsUpdated() {
	//$('#num-words').val(_options.numWords || 4).copyValToNext();
	//$('#rand-words').val(_options.randomizeNumWords || 1).copyValToNext();

	$('#generator-type').val(_options.generatorType || 'words')
	$('#strength').val(_options.passwordStrength || 44).copyValToNext();
	$('#min-len').val(_options.minWordLen || 5).copyValToNext();
	$('#max-len').val(_options.maxWordLen || 10).copyValToNext();
	$('#separator').val(_options.separator || ' ');
	$('#custom-separator').val(_options.customSeparator || DEFAULT_CUSTOM_SEPS);
	$('#custom-separator-label').show(_options.separator==="custom");
}

function updateBytesUsed() {
	storage.getBytesInUse(null, function(bytes) {
		$('#total-bytes').text(humanise.bytes(bytes));
	});
	
}

function saveOptions() {
	//_options.numWords = parseInt($('#num-words').val());
	//_options.randomizeNumWords = parseInt($('#rand-words').val());
	_options.generatorType = $('#generator-type').val();
	_options.passwordStrength = $('#strength').val();
	_options.minWordLen = parseInt($('#min-len').val());
	_options.maxWordLen = parseInt($('#max-len').val());
	_options.separator = $('#separator').val();
	_options.customSeparator = $('#custom-separator').val();
	sendMessage({action: 'gp-optionsChanged', options: _options}, ext.logLastErrorCB('saveOptions'))
}



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


function htmlToElements(html, rootSelector) {
	rootSelector = rootSelector || 'body>*:not(script)';
	const parser = new DOMParser();
	const newNode = parser.parseFromString(html, 'text/html');
	var els = newNode.querySelectorAll(rootSelector);
	return els;
}


function getBookId(source) {
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
	return bookId;

}





function generate() {
	$('#result').val('');
/*	if ($('#style').val()=='custom') {
		// get the custom text from #custom-source, rather than the web
		sources['custom'].text = $('#custom-source').val();
		if (!validateCustomSource()){
			console.log("Can't generate yet, not enough text!")
			return;
		}
	}*/
	const t0 = performance.now();
	$('#generate').disable();
	sendMessage({ action: "gp-generate", num_results:1, options:_options  }, function(response) {

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

		const data = response.data;
		const pwd = data[0].password;
		var t1 = performance.now();
		DEBUG && log('generated in '+_.round(t1-t0)+'ms');
		$('#result').val(pwd);
		updateBytesUsed();
	
	/*	var accuracy = parseInt($('#accuracy').val());
		var options = {
			minWordLen: parseInt($('#min-len').val()),
			maxWordLen: parseInt($('#max-len').val()),
			numWords: parseInt($('#num-words').val()),
			randomizeNumWords: parseInt($('#rand-words').val())
		}

		var learnOptions = { };
		if (srcObj.validator)
			learnOptions.validator = srcObj.validator;
		if ($('#trim').is(':checked')) {
			learnOptions.minWordLen = Math.min(options.minWordLen, accuracy);
			learnOptions.maxWordLen = Math.max(options.maxWordLen, accuracy);
		}

		var wordish = new Wordish(accuracy);
		wordish.learn(srcObj.text, learnOptions);
		var words = wordish.createWords(options);
		$('#result').val(words.join($('#separator').val()));*/


	});
	return false;
}

/*
function validateCustomSource() {
	var minLength = parseInt($('#min-len').val());
	var maxLength = parseInt($('#max-len').val());
	var numWords = parseInt($('#num-words').val());
	minLength = Math.min(minLength, accuracy)
	var text = $('#custom-source').val();
	var words = text.toLowerCase().replace(/\W/gi, ' ').replace(/  /g, ' ').trim().split(' ');
	words = words.filter(function(item) { return item.length>=minLength && item.length<=maxLength});
	if (words.length < numWords) {
		$('#custom-hint').text('Please add ' + (numWords-words.length) + ' more words, at least ' + minLength + ' letters long.');
		$('#custom-hint').show();
	}
	else 
		$('#custom-hint').hide();
	return words.length >= numWords;
}
*/



/*
$('select').on("change", function() {
	if ($(this).val()=='custom') {
		// show (&expand) custom source textarea when user chooses 'Custom...'
		$('#custom-source-container').addClass('show');
		$('#custom-more').addClass('show');
	}
	else {
		$('#custom-source-container').removeClass('show'); // hide dlg when user chooses other than 'Custom...'
		generate();
	}
	updateRevealLabelStatus($('#custom-more-btn'), $('#custom-more'))
	updateGenerateBtnStatus();
});
var typing_timeout = -1;
$('#custom-source').on('input paste', function() {
	updateGenerateBtnStatus();
	if (typing_timeout>=0) clearTimeout(typing_timeout);
	typing_timeout = setTimeout(function() {
		if (updateGenerateBtnStatus()) 
			generate();
	}, 1000);
});*/


$('#generate').on('click', generate)
$('input:not(#result)').on("change", generate);


// ranges
var _saveDelayTimer;
function doSaveDelay(timeout) {
	if (_saveDelayTimer)
		clearTimeout(_saveDelayTimer);
	_saveDelayTimer = setTimeout(function() {
		_saveDelayTimer = null;
		saveOptions();
		generate();
	}, timeout || 300)

}

$('#generator-type').on('change', function(e) {
	doSaveDelay();
})
$('input[type="range"]').on("input", function(){
		$(this).copyValToNext();
		doSaveDelay();
	}).copyValToNext();
$('#separator').on('change', function(e) {
	doSaveDelay();
	$('#custom-separator-label').show($(this).val()==="custom");
});
$('#custom-separator').on('input paste', function() {
	doSaveDelay(600); // slow down the save a bit
});
$('#custom-separator-reset').on('click', function(e) {
	$('#custom-separator').val(DEFAULT_CUSTOM_SEPS);
	doSaveDelay();
});

$('#reset-all').on('click', function(e) {
	e.preventDefault();
	sendMessage({action: "gp-resetAllData"}, function() {
		ext.logLastError('reset-all');
		loadOptions();
		loadSources();
		updateBytesUsed();
		doSaveDelay();
	})
})


$(document).ready(function() {
	generate();
}); 





