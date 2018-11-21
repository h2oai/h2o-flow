webpack = require('webpack')
HtmlWebpackPlugin = require('html-webpack-plugin')
CleanWebpackPlugin = require('clean-webpack-plugin')
path = require('path')
nib = require('nib')

config =
  mode: 'development',
  context: path.resolve __dirname, 'src'
  entry: './core/flow.coffee'
  devtool: 'inline-source-map'
  devServer: {
    contentBase: './build'
  }
  module:
    rules: [
      {
        test: /\.coffee$/,
        use: [
          {
            loader: 'coffee-loader'
          }
        ]
      },
      {
        test: /\.jade$/,
        use: [
          {
            loader: 'pug-loader'
            options: {pretty: yes}
          }
        ]
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.styl$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'stylus-loader',
            options: {
              use: [nib()],
            },
          },
        ],
      },
      {
        test: /\.(png|svg|jpg|gif|ico)$/,
        use: ['file-loader']
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: ['file-loader']
      }
    ]
  resolve:
    extensions: [".coffee", ".js"]
  output:
    filename: 'js/bundle.js'
    path: path.resolve(__dirname, 'build')
  plugins: [
    new CleanWebpackPlugin(['dist']),
    new HtmlWebpackPlugin({
      favicon: './favicon.ico',
      template: './index.jade'
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    })
  ]

module.exports = config
