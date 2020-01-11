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
loadOptions();

function loadOptions() {
	ext.storage.get('options', function(resp) {
		_currentOptions = resp.options;
		onOptionsUpdated();
	});
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
			break;

	}
});


function onOptionsUpdated() {
	// todo
}

///////////////////////////////////////////////////////////////////////////////////////////
//
//
//

function round(val) { return Math.round(val*1000)/1000; } 

function generate() {
	const t0 = performance.now();
	$('#generate').disable();
	sendMessage({ action: "gp-generate"  }, function(response) {

		$('#generate').enable();
		if (!response) {
			ext.eatError('gp-generate post');
			DEBUG && log('Failed to generate words:')
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

$("#generate").on("click", function(e) {
	e.preventDefault();
	generate();
})
$("#reset").on("click", function(e) {
	e.preventDefault();
	sendMessage({ action: "gp-resetdata-debug"  });
})
