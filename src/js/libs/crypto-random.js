/**
* from Stack Overflow:
* https://stackoverflow.com/questions/41437492/how-to-use-window-crypto-getrandomvalues-to-get-random-values-in-a-specific-rang#

*/


// Generate a random integer r with equal chance in  min <= r < max.
function _random(min, max) {
    var range = max - min;
    if (range <= 0) {
        throw new Exception('max must be larger than min');
    }
    var requestBytes = Math.ceil(Math.log2(range) / 8);
    if (!requestBytes) { // No randomness required
        return min;
    }
    var maxNum = Math.pow(256, requestBytes);
    var ar = new Uint8Array(requestBytes);

    while (true) {
        window.crypto.getRandomValues(ar);

        var val = 0;
        for (var i = 0;i < requestBytes;i++) {
            val = (val << 8) + ar[i];
        }

        if (val < maxNum - maxNum % range) {
            return min + (val % range);
        }
    }
}

_random.array = function(ar, defaultVal) {
	if (!ar || !ar.length || ar.length<1)
		return defaultVal;
	if (typeof ar === 'string') {
		var arCodePoints = [...ar]; // this is so that emojis, etc work
		return arCodePoints[_random(0, arCodePoints.length)];
	}
	else
		return ar[_random(0, ar.length)];
}

module.exports = _random;