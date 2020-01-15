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

const sendMessage = ext.runtime.sendMessage.bind(ext.runtime);

const DEBUG = true && !_PRODUCTION;
const log = ext.registerLogPROD('gp-popup');
var _currentOptions = {};


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
			_currentOptions = resp.options;
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
			_currentOptions = request.options; 
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
	if (!_.isEmpty(_currentOptions.source_url))
		val = _currentOptions.source_url;
	$('#sources').val(val);
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
	}
});

function round(val) { return Math.round(val*1000)/1000; } 

function htmlEncode(text) {
	return text.replace(/\&(?!amp\;)/gi, '&amp;').
		replace(/\</gi, '&lt;')
}

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

		$('#password-1').val(words[0]);
		$('#password-2').val(words[1]);
		$('#password-3').val(words[2]);
		$('#password-4').val(words[3]);
		$('#password-5').val(words[4]);
		$('#source>#title').text(meta.source.title) // NB: htmlEncode not needed for text()
			.attr('href', getGutenEBookUrl(meta.source)) 
			.attr('data-url', meta.source.url);
		$('#source>#delete').disable(_.isEmpty(meta.source.url));
	})
}

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
$("#reset").on("click", function(e) {
	e.preventDefault();
	sendMessage({ action: "gp-resetAllData"  }, function() { 
		ext.logLastError('gp-resetAllData');
		loadOptions();
		loadSources();
	});
	flashMessage("Resetting all data...")
})
