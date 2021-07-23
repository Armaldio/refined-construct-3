/* eslint-disable @typescript-eslint/no-var-requires */

const ExtensionReloader = require('webpack-extension-reloader');
const path = require('path');

module.exports = {
  chainWebpack: (config) => {
    config.optimization.delete('splitChunks');
  },
  configureWebpack: {
    plugins: [
      new ExtensionReloader({
        // manifest: 'public/manifest.json',
        entries: {
          contentScript: [
            'quickswitch',
            'headway',
          ],
          background: ['background'],
        },
      }),
    ],
  },
  pages: {
    quickswitch: {
      entry: 'src/apps/quickswitch/main.ts',
    },
    headway: {
      entry: 'src/apps/headway/main.ts',
    },
    background: {
      entry: 'src/background.ts',
    },
  },
};
