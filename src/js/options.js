/**
 * options.js
 * @license AGPL
 * Copyright (c) 2017 Craig Monro (cmroanirgo), kodespace.com. All rights reserved.
 **/

/*
 * This file is loaded by options.js and is self-contained otherwise
 *
*/
const ext = require("./webext");
const storage = ext.storage;
const $ = ext.$;


/*
 TODO:

 - show a checked list of already downloaded files
*/


var colorSelectors = $(".js-radio");

function setColor(color) {
  $(document.body).css('background-color', color);
};

storage.get('color', function(resp) {
  var color = resp.color;
  var option;
  if(color) {
    option = $(`.js-radio.${color}`);
    setColor(color);
  } else {
    option = colorSelectors;
  }

  option.attr("checked", "checked");
});

colorSelectors.on("click", function(e) {
    var value = this.value;
    storage.set({ color: value }, function() {
      setColor(value);
    });
});
