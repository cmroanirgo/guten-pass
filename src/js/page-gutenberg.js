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

function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}


$('td[property="dcterms:format"][content*="text/plain"] a[href]').each(function(idx, el) {
	console.log("Found text file: " + $(el).attr('href'))

	// remove existing buttons
	$(".wordish-add-text", el).each(function() { this.remove(); })
	// Add button
	var icon = browser.runtime.getURL("icons/icon-16.png");
	var newEl = htmlToElement("<a class=\"wordish-add-text\" href=\"#\"><img src=\""+icon+"\"> Add to Wordish</a>")
	el.parentNode.insertBefore(newEl, el.nextSibling);


	$(newEl) // handle button press
		.on('click', function(e) {
			e.preventDefault();
			var title = $('.header>h1').text();
			if (confirm("TODO: Press OK if you would like to add\n\""+title+"\"?\nto Wordish..."))
			{
				alert("TODO: Not impl yet. Sorry\n(" + el.href+")\n");
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

