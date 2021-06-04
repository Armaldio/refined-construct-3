module.exports = {
  chainWebpack: (config) => {
    config.optimization.delete('splitChunks');
  },
  pages: {
    quickswitch: {
      entry: 'src/apps/quickswitch/main.ts',
    },
    headway: {
      entry: 'src/apps/headway/main.ts',
    },
  },
};
