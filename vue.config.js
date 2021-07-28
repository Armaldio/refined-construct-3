/* eslint-disable @typescript-eslint/no-var-requires */

const ExtensionReloader = require('webpack-ext-reloader');

module.exports = {
  chainWebpack: (config) => {
    config.optimization.delete('splitChunks');
  },
  configureWebpack: {
    plugins: [
      new ExtensionReloader({
        entries: {
          contentScript: [
            'quickswitch',
            'headway',
          ],
          background: 'background',
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
