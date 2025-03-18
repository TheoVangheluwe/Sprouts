const { override, addWebpackPlugin } = require('customize-cra');
const WebpackStatsPlugin = require('webpack-stats-plugin').StatsWriterPlugin;

module.exports = override(
  addWebpackPlugin(
    new WebpackStatsPlugin({
      filename: 'webpack-stats.json',
      stats: {
        context: __dirname,
        chunkModules: true,
        maxModules: 0,
        assets: true,
        children: true,
        chunks: true,
        modules: true,
      },
    })
  )
);
