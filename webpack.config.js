const path = require('path');
const nodeExternals = require('webpack-node-externals');
const { TsconfigPathsPlugin } = require('tsconfig-paths-webpack-plugin');

module.exports = (options, webpack) => {
  return {
    ...options,
    entry: './src/main.ts',
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    target: 'node',
    externals: [
      nodeExternals({
        allowlist: ['webpack/hot/poll?100'],
      }),
    ],
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      plugins: [
        new TsconfigPathsPlugin({
          configFile: './tsconfig.json',
          logLevel: 'info',
          extensions: ['.ts', '.tsx', '.js'],
          mainFields: ['main'],
        }),
      ],
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@common': path.resolve(__dirname, './src/common'),
        '@modules': path.resolve(__dirname, './src/modules'),
        '@config': path.resolve(__dirname, './src/config'),
      },
    },
    optimization: {
      minimize: false, // Desactiva la minificación para evitar problemas de nombres en producción
    },
    plugins: [
      ...options.plugins,
      new webpack.HotModuleReplacementPlugin(),
      new webpack.WatchIgnorePlugin({
        paths: [/\.js$/, /\.d\.ts$/],
      }),
    ],
  };
};
