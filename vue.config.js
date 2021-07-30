/* eslint-disable @typescript-eslint/no-var-requires */

const ExtensionReloader = require('webpack-ext-reloader');

// Add instances here
const instances = {
  quickswitch: 'src/apps/quickswitch/main.ts',
  headway: 'src/apps/headway/main.ts',
  'debug-search': 'src/apps/debug-search/main.ts',
};

const names = Object.keys(instances);
const pages = {};
Object.entries(instances).forEach(([name, path]) => {
  pages[name] = path;
});

module.exports = {
  chainWebpack: (config) => {
    config.optimization.delete('splitChunks');
  },
  configureWebpack: {
    plugins: [
      new ExtensionReloader({
        entries: {
          contentScript: names,
          background: 'background',
        },
      }),
    ],
  },
  pages: {
    ...pages,
    background: {
      entry: 'src/background.ts',
    },
  },
};
