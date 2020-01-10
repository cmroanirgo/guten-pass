/**
 * randomizer.js
 * license AGPL
 * Copyright (c) 2017-2019 Craig Monro (cmroanirgo), kodespace.com. All rights reserved.
 **/

 // a good random generator (ses-a-me)

var _hasWindow = typeof window !== 'undefined';
if (!_hasWindow)
	var crypto = require('crypto');



/////////////////////////////////////////////
//

function Randomizer(stack_size) {
	// a simple wrapper to use crypto secure
	this.rand = [];
	this.at = 0;
	stack_size = stack_size || 40;
	stack_size += 4-(stack_size%4); // round up to 32bits

	if (_hasWindow) {
		this.values = new Uint8Array(stack_size);
		window.crypto.getRandomValues(this.values); // make the crypto
	}
	else
	{
		this.values = crypto.randomBytes(stack_size);
	}
}
Randomizer.prototype.generate = function(min, max) {
	if (this.at>=this.values.length)
	{
		 // redo the crypto
		if (_hasWindow)
			window.crypto.getRandomValues(this.values);
		else
			this.values = crypto.randomBytes(this.values.length);

		this.at = 0;
		//console.log('generated: ' + JSON.stringify(this.values))
	}
	var val = this.values[this.at++] | (this.values[this.at++] << 8) | (this.values[this.at++] << 16) | (this.values[this.at++] << 24); // node spits out 
	val = val >>>0; // make UInt32
	var MAX_RAND = 0xffffffff>>>0;
	val = val*(max+1-min)/MAX_RAND + min; // max+1, because we want to 'hit' the maximum value!
	if (val>max) val=max;
	return Math.floor(val);
};


module.exports = Randomizer;
