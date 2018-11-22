webpack = require('webpack')
path = require('path')
nib = require('nib')

HtmlWebpackPlugin = require('html-webpack-plugin')
CleanWebpackPlugin = require('clean-webpack-plugin')
MiniCssExtractPlugin = require("mini-css-extract-plugin");

config =
  mode: 'development',
  context: path.resolve __dirname, 'src'
  entry: './index.coffee'
  devtool: 'inline-source-map'
  devServer: {
    contentBase: './build'
  }
  module:
    rules: [
      {
        test: /\.coffee$/
        use: [
          {
            loader: 'coffee-loader'
          }
        ]
      },
      {
        test: /\.jade$/
        use: [
          {
            loader: 'pug-loader'
            options: {pretty: yes}
          }
        ]
      },
      {
        test: /\.css$/
        use: [
          {
            loader: MiniCssExtractPlugin.loader
            options: {
              publicPath: '../'
            }
          },
          'css-loader'
        ]
      },
      {
        test: /\.styl$/
        use: [
          {
            loader: MiniCssExtractPlugin.loader
            options: {
              publicPath: '../'
            }
          },
          'css-loader',
          {
            loader: 'stylus-loader'
            options: {
              use: [nib()]
            }
          }
        ]
      },
      {
        test: /\.(png|svg|jpg|gif|ico)$/
        use: [
          {
            loader: 'file-loader'
            options:
              name: '[name].[ext]'
              outputPath: 'img/'
          }
        ]
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/
        use: [
          {
            loader: 'file-loader'
            options:
              name: '[name].[ext]'
              outputPath: 'fonts/'
          }
        ]
      }
    ]
  resolve:
    extensions: [".coffee", ".js"]
  output:
    filename: 'js/flow.js'
    path: path.resolve(__dirname, 'build')
  plugins: [
    new HtmlWebpackPlugin({
      favicon: './favicon.ico'
      template: './index.jade'
    }),
    new MiniCssExtractPlugin({
      filename: 'css/flow.css'
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    }),
    new webpack.LoaderOptionsPlugin({
         debug: true
    })
  ]

module.exports = config
