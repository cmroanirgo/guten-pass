/**
 * fetch.js
 * license AGPL
 * Copyright (c) 2017 Craig Monro (cmroanirgo), kodespace.com. All rights reserved.
 **/


// A simple module to fetch data from an online resource

(function(){ 
	const DEBUG = true && !_PRODUCTION


 var __XMLHttpRequest = XMLHttpRequest;
if (typeof XMLHttpRequest == "undefined")
	__XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
else
	__XMLHttpRequest = XMLHttpRequest;


function ajaxGet(url, ok, fail) {
	var request = new __XMLHttpRequest();
	request.open('GET', url, true);
//	request.setRequestHeader("User-Agent", "Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.6) Gecko/20070725 Firefox/2.0.0.6"); // generates error on chrome
	request.setRequestHeader("Accept", "text/plain,text/html;q=0.9,*/*;q=0.5");
	request.setRequestHeader("Accept-Language", "en-us,en;q=0.5");
//	request.setRequestHeader("Accept-Charset", "utf-8"); // generates an error on FF

	request.addEventListener('load', function() {
	  if (request.status >= 200 && request.status < 400) {
	    // Success!
	    ok(request.responseText);
	  } else {
	    // We reached our target server, but it returned an error
	    fail(request)
	  }
	});

	request.addEventListener('error', function() {
	  // There was a connection error of some sort
	    fail(request)
	});

	request.send();
}
function log(options, text) {
	if (typeof options.log == "function") 
		options.log(text);
	if (options.log);
		console.log(text);
}

var _global_cache = {};
function fetchSource(options, cb) {
	var cache = options.cache || _global_cache;
	var sourceObj = cache[options.url] || {};
	if (sourceObj.text) {
		// already fetched
		log(options, "Reusing fetched text")
		cb(sourceObj.text);
		return; 
	}
	var url = options.url + '';
	if (!/^http/.test(url)) // missing http:// or https://   ?
		url = options.base_url + url;
	if (options.ajaxCallback)
		options.ajaxCallback("begin");
	log(options, "Requesting " + url + "")
	ajaxGet(url,
		function ok(data) {
			log(options, "Request ok")
			if (options.ajaxCallback)
				options.ajaxCallback("end");
			sourceObj.text = data + '';
			if (options.cacheCallback)
				options.cacheCallback(options.url, sourceObj);
			log(options, 'about to return from ajax')
			cb(sourceObj.text);
		},
		function fail(xhr) {
			log(options, "Request fail")
			if (options.ajaxCallback)
				options.ajaxCallback("end");
			cb(null, {message: "Failed: status code="+xhr.status+"", status:xhr.status, statusText:xhr.statusText})
		});
}


module.exports = fetchSource;

})();