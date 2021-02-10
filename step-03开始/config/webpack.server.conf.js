const path = require('path');
const { merge } = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const nodeExternals = require('webpack-node-externals')
const VueSSRServerPlugin = require('vue-server-renderer/server-plugin')
const base = require('./webpack.base.conf');

module.exports = merge(base, {
    entry: {
        server: path.resolve(__dirname, '../entry-server.js')
    },
    output: {
        //使用 Node 风格导出模块
        libraryTarget: 'commonjs2', 
    },
    // 告知vue-loader输送面向服务器代码，不加vue-server-renderer会报错。
    target: 'node',
    // 不要将node-modules打包，减少bundle的体积
    externals: nodeExternals(),
    plugins: [
        new VueSSRServerPlugin(),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../index.ssr.html'),
            filename: 'index.ssr.html',
            // files: {
            //     js: 'client.bundle.js'
            // },
            //不要将server.bundle.js加入到html中，因为这文件是给服务端使用的
            excludeChunks: ['server']
        }),
    ]
});