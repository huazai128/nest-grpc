const path = require('path');
const {
  IgnorePlugin
} = require('webpack');
const {
  swcDefaultsFactory,
} = require('@nestjs/cli/lib/compiler/defaults/swc-defaults');

/** @type { import('webpack').Configuration } */
module.exports = {
  entry: './server/main',
  externals: {},
  module: {
    rules: [{
      exclude: /node_modules/,
      test: /\.ts$/,
      use: {
        loader: 'swc-loader',
        options: swcDefaultsFactory().swcOptions,
      },
    }, ],
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'dist/server'),
  },
  plugins: [
    new IgnorePlugin({
      checkResource(resource) {
        const lazyImports = [
          '@nestjs/microservices',
          '@nestjs/microservices/microservices-module',
          '@nestjs/platform-express',
          '@nestjs/websockets/socket-module',
          'cache-manager',
          'cache-manager/package.json',
          'class-transformer/storage',
          'class-validator',
        ];
        if (!lazyImports.includes(resource)) {
          return false;
        }
        try {
          require.resolve(resource, {
            paths: [process.cwd()]
          });
        } catch (err) {
          return true;
        }
        return false;
      },
    }),
  ],
  resolve: {
    extensions: ['.js', '.json', '.ts'],
    mainFields: ['main'],
    alias: {
      "@app": ["./"],
      "@app/*": ["./*"]
    }
  },
  target: 'node',
};