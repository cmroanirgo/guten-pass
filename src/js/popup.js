/**
 * popup.js
 * @license AGPL
 * Copyright (c) 2017 Craig Monro (cmroanirgo), kodespace.com. All rights reserved.
 **/

/*
* This file is used by popup.html
* popup.html is shown when the user clicks on the browser button in the toolbar
*/

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
	$('#sources>options').each(function(idx) { if (idx>0) this.remove(); }) // remove all existing options
	var html = '';
	sources.forEach(function(source) {
		html += "<option value=\""+source.url+"\">"+_.htmlEncode(source.title)+"</option>\n"
	})
	$('#sources').lastChild().appendHtml(html);
	$('#sources').val(selected);
}

///////////////////////////////////////////////////////////////////////////////////////////
//
// utils
//
$.register({
	lastChild: function() {
		return $(this.get(0).lastElementChild); // or $(this.children().get(-1)) . should be equivalent~ish
	},
	appendHtml: function(html) { // appends Sibling
		this.each(function(i, el) { 
			var newEl = htmlToElements(html);
			el.parentNode.insertBefore(newEl, el.nextSibling);
		});
		return this;
	},

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
function htmlToElements(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content;
}


///////////////////////////////////////////////////////////////////////////////////////////
//
//
//
function generate() {
	const t0 = performance.now();
	$('#generate').disable();
	sendMessage({ action: "gp-generate"  }, function(response) {

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
		$('#source>#title').text(meta.source.title);
		$('#source>#lang').text(meta.source.language || '');
		$('#source>#url').text(meta.source.url);

		

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
$("#reset").on("click", function(e) {
	e.preventDefault();
	sendMessage({ action: "gp-resetAllData"  }, ext.logLastErrorCB('gp-resetAllData'));
	flashMessage("Resetting all data...")
})
