const {
  defineConfig
} = require('@efox/emp')

const {
  cdn,
  esm
} = require('./cdn')

const webpack = require('webpack')
const InlineCodePlugin = require('html-inline-code-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const {
  TypedCssModulesPlugin
} = require('typed-css-modules-webpack-plugin');


const {
  join,
  resolve
} = require('path')

module.exports = defineConfig(({
  mode,
  env
}) => {
  process.env.EMP_ENV = env || 'dev'
  const target = 'es5'
  const isESM = !['es3', 'es5'].includes(target)
  return {
    build: {
      target,
      staticDir: '.',
      outDir: join(__dirname, "./dist/client"),
    },
    server: {
      port: 8008,
      devMiddleware: {
        index: true,
        mimeTypes: {
          phtml: 'text/html'
        },
        publicPath: './dist/client',
        serverSideRender: true,
        writeToDisk: true,
      },
    },
    base: '/',
    resolve: {
      alias: {
        '@src': resolve(__dirname, "./src")
      },
    },
    html: {
      template: resolve('./views/index.html'),
      filename: resolve('./dist/views/index.html'),
      title: '基础架构框架'
    },
    webpackChain: (chain, config) => {
      // if (env !== 'dev') {
      //   chain.devtool('source-map')
      //   chain.plugin('SourcemapUploadPlugin').use(new UploadSourceMapPlugin({
      //     url: `${tConfig.}/api/upload-zip`, // 上传url
      //     uploadPath: resolve(__dirname, './dist/client/js'),
      //     patterns: [/\js.map$/],
      //     requestOption: {
      //       data: {
      //         siteId: '63b6568f66704eb3458306d6'
      //       }
      //     }
      //   }))
      // }
      chain.plugin('InlineCodePlugin').use(new InlineCodePlugin({
        begin: false,
        tag: 'script',
        inject: 'body',
        code: `window.INIT_DATA = <%- JSON.stringify(data) %>`
      }))

      chain.plugin('CopyWebpackPlugin').use(new CopyWebpackPlugin({
        patterns: [{
          from: resolve(__dirname, "./public"),
          to: resolve(__dirname, "./dist/views"),
        }],
      }))

      chain.plugin('TypedCssModulesPlugin').use(new TypedCssModulesPlugin({
        globPattern: 'src/!(styles)/**/*.scss'
      }))

      chain.plugin('WatchIgnorePlugin').use(new webpack.WatchIgnorePlugin({
        paths: [/css\.d\.ts$/, /scss\.d\.ts$/]
      }))

      chain.module.rule('sass').use('css').loader('css-loader').tap(options => {
        options.modules = {
          localIdentName: '[local]',
        };
        return options
      });

      chain.module.rule('scripts')
        .use('babel')
        .tap(o => {
          // o.plugins.push(['./build/catch-babel-plugin.js'])
          return o
        })
    },
    empShare: {
      name: 'microHost',
      // esm 共享需要设置 window
      // library: {name: 'microHost', type: 'window'},
      exposes: {
        './App': './src/App',
        // './Button': './src/Button',
        // './importExport/incStore': './src/store/incStore',
      },
      // shared: {
      //   react: {requiredVersion: '^17.0.1'},
      //   'react-dom': {requiredVersion: '^17.0.1'},
      // },
      shareLib: !isESM ?
        cdn(mode) : {
          react: esm('react', mode, '17.0.2'),
          'react-dom': esm('react-dom', mode, '17.0.2'),
          mobx: esm('mobx', mode, 6),
          'mobx-react-lite': esm('mobx-react-lite', mode, 6),
        },
      // shareLib: cdn(mode),
    },
  }
})