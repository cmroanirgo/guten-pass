/**
 * humanise.js
 * license AGPL
 * Copyright (c) 2017 Craig Monro (cmroanirgo), kodespace.com. All rights reserved.
 **/
'use strict';

// designed to make human readable strings:
// eg. 2048 (bytes) --> '2 KB'
// eg 120 (secs) --> '2 mins'
function valToString(val, labels, sizes) {
	var str = labels.reduce(function(result, sizeString, idx) {
		var denom = sizes[idx];
		if (((val/denom)>1) || idx===0)
			// eg. if b=2049, then 2049/1024 = 2.00.. --> return '2 KB'
			return Math.round(val/denom) + ' ' + sizeString;
		else
			return result; // already found our best size, keep returning it
	}, '');
	return str;	
}

function bytesStr(b) {
	return valToString(b,['bytes', 'KB', 'MB', 'GB'], [1, 1024, 1024*1024, 1024*1024*1024]);
}

function timeStr(t) {
	return valToString(t, ['secs', 'mins', 'hrs', 'days'], [1, 60, 60*60, 24*60*60] );
}

// function milliTimeStr(t) {
// 	return valToString(t, ['ms' , 'secs', 'mins', 'hrs', 'days'], [1, 1*1000, 60*1000, 60*60*1000, 24*60*60*1000] );
// }

valToString.bytes = bytesStr;
valToString.time = timeStr;
//valToString.timeMs = milliTimeStr; not used

module.exports = valToString;
