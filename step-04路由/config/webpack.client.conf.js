const { merge } = require('webpack-merge')
const path = require('path')
const base = require('./webpack.base.conf')

module.exports = merge(base, {
    entry: {
        client: path.resolve(__dirname, '../entry-client.js')
    }
})