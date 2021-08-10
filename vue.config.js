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

    config.module
      .rule('vue')
      .use('vue-loader')
      .loader('vue-loader')
      .tap((options) => {
        // eslint-disable-next-line no-param-reassign
        options.compilerOptions = {
          ...(options.compilerOptions || {}),
          isCustomElement: (tag) => /(^ui|dialog)/i.test(tag),
        };
        return options;
      });
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
  filenameHashing: false,
  pages: {
    ...pages,
    background: {
      entry: 'src/background.ts',
    },
  },
};
