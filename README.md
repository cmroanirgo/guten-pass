# Wordish Password Generator

This is a password generator that bases it's source dictionary of words from literary works available from Gutenburg.org.


## Build & Developer Installation

Either download or clone this repo and `cd` to it.

```
npm install
```

This will install around 50MB of webpack and related modules in order to develop.


### Usage

Building

```
npm run build
```

Debug (non-minified) builds are available using:

```
npm run build:debug
```

Watching
```
npm run watch
```

Note: It is important that you run `npm run build` to generate a final minified version, rather than relying on the last watch output.


## Testing

### Chrome

1. Go to <a href="chrome://extensions/">chrome://extensions/</a>
2. Click `Load Unpacked Extension` and select the `build/chrome` folder

Note: Chrome will keep this extension loaded after shutting down Chrome.

### Firefox

1. Go to <a href="about:debugging#addons">about:debugging#addons</a>
2. Click 'Load Temporary add-on' and select any file in the 'build/firefox' folder

Note: Firefox will always unload this extension after shutting down Firefox.

## Credits

Thanks to the inspirational work by Bharani, and his [Email This](https://www.emailthis.me) boilerplate. Some of his code has been used (and credited) in this project, but will be morphed and removed over time.
Main source for this project is based on the skeleton project available [here](https://github.com/cmroanirgo/webextension-template), by yours truly.
