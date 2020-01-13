/**
 * page-gutenberg.js
 * @license AGPL
 * Copyright (c) 2017 Craig Monro (cmroanirgo), kodespace.com. All rights reserved.
 **/

/*
 * This code is injected into each page instance of gutenberg.org. This is commonly called the 'contentscript'
 * Most of your code will exist in background.js
 * Keep this as lightweight and unobtrusive as possible
 */
(function() {

const ext = require("./webext");
const $ = ext.$;

function htmlToElement(html, rootSelector) {
	rootSelector = rootSelector || 'body>*:not(script)';
	const parser = new DOMParser();
	const newNode = parser.parseFromString(html, 'text/html');
	const el = newNode.querySelector(rootSelector);
	return el;
}


$('td[property="dcterms:format"][content*="text/plain"] a[href]').each(function(idx, el) {
	console.log("Found text file: " + $(el).attr('href'))

	// remove existing buttons
	$(".guten-pass-btn", el).each(function() { this.remove(); })
	// Add button
	var icon = ext.runtime.getURL("icons/icon-16.png");
	var newEl = htmlToElement("<a class=\"guten-pass-btn\" href=\"#\"><img src=\""+icon+"\"> Add to Guten Pass</a>")
	el.parentNode.insertBefore(newEl, el.nextSibling);


	$(newEl) // handle button press
		.on('click', function(e) {
			e.preventDefault();
			var title = $('.header>h1').text();
			if (confirm("Press OK if you would like to add:\n\n\""+title+"\"\n\nto \"Guten Pass\" Password Generator."))
			{
				ext.runtime.sendMessage({
					action: "gp-addSource",
					title: title,
					url: el.href
				}, ext.logLastErrorCB('gp-addSource'))
			}
		});
});

/*
function fetchSomething(fnSendResponse) {
	// This demo gets all the links on a page and returns the urls as a list

	var links = [];
	$('a[href]').each(function() {
		var url = $(this).attr('href');
		if (url!='#')
			links.push(url);
	});
	fnSendResponse(JSON.stringify(links)); // return all links in the page
}


// Listen to broadcast messages
ext.runtime.onMessage.addListener(function(request,sender, sendResponse) {
	switch (request.action) {
		case 'page-fetchSomething': // this is called from popup.js
			fetchSomething(sendResponse);
    		break;
  	}
});
*/

})();

