const { merge } = require('webpack-merge')
const path = require('path')
const webpack = require('webpack')
const base = require('./webpack.base.conf')
// const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = merge(base, {
    entry: {
        client: ['webpack-hot-middleware/client?reload=true', path.resolve(__dirname, '../entry-client.js')]
    },
    plugins: [
        // new HtmlWebpackPlugin({
        //     template: path.resolve(__dirname, '../index.html'),
        //     filename: 'index.html'
        // }),
        new webpack.HotModuleReplacementPlugin()
    ]
})