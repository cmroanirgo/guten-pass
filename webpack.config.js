const merge = require('webpack-merge');
const Copier = require('copy-webpack-plugin');
const Replacer = require('replace-in-file-webpack-plugin');
const Archiver = require('webpack-archive-plugin');
const webpack = require('webpack');
const path = require('path');

const IS_PRODUCTION = process.argv.indexOf('-p') !== -1;
const VERSION = require('./src/manifest.json').version;

console.log("\n\n===========================");
console.log("PRODUCTION mode: "+IS_PRODUCTION);
console.log("Version "+VERSION);
console.log("===========================\n\n");


const output_dir = 'build'; // don't forget to change package.json's "build" script if changing this!

const FilesToCopy = [
	{ from: 'manifest.json' },
	{ from: '*.html' },
	{ from: '*.css' },
	{ from: 'icons/**/*' },
	//{ from: 'images/**/*', to 'images/' },
];

const WebPackConfig = {
	context: path.join(__dirname, 'src'),
	entry: {
		'js/page-gutenberg.js' : './js/page-gutenberg.js',
		'js/background.js'     : './js/background.js',
		'js/options.js'        : './js/options.js',
		'js/popup.js'          : './js/popup.js'
	},
	output: {
		// path: path.join(__dirname, 'dist'), // supplied later
		filename: "[name]"
	},
	// plugins: [
	//     new Copier(
	//     	// { from: 'from/file.txt', to: 'to/file.txt' },
	//     	FilesToCopy_base
	//     )
	// ]
};


const targets = [
	'chrome',
	'firefox'
];

module.exports = [];



function getWebPackPlugins(target) {
	var plugins = [
		new Copier(FilesToCopy),

		new webpack.DefinePlugin({
			_PRODUCTION : IS_PRODUCTION
		}),

		new webpack.IgnorePlugin(/^crypto|xmlhttprequest$/), // ignore crypto include in Wordish

	    new Replacer([{ // add platform specific info to manifest.json (if it exists)
	    	dir: path.join(__dirname, output_dir, target),
	    	files: ['manifest.json'],
	    	rules: [{
	            search: /([\s\S]+)/ig,
	            replace: function(match, m1) {
	            	// load (eg. manifest.firefox.json) & merge it with the default manifest
	            	var extra_manifest;
	            	try {
	            		extra_manifest = require('./src/manifest.'+target+'.json');
	            	}
	            	catch(e) { }
	            	if (!!extra_manifest) // the manifest exists
						return JSON.stringify(
							merge(JSON.parse(m1), extra_manifest), // convert string to JSON and merge in object & convert back to string
							null, 2);
					else
						return m1; // do nothing, no specialised manifest for this target
	            }
	        }]
	    }]) 
	];

	if (IS_PRODUCTION) {
		plugins.push(new Archiver({// zip it
			output: path.join(__dirname, output_dir, target + '-' + VERSION),
			format:'zip'})) 
	} 

	return plugins;
}


targets.forEach(function(target) {
	module.exports.push(
		merge(WebPackConfig, 
		{
			output: {
				path: path.join(__dirname, output_dir, target)
			},
			plugins: getWebPackPlugins(target)
		 })
	)
});


//console.log(JSON.stringify( module.exports,null, 2));