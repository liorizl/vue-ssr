# step-03 开始vue-ssr
>开始之前先看看vue ssr相比传统的单页面(SPA)的优势  
>1、更好的 SEO，由于搜索引擎爬虫抓取工具可以直接查看完全渲染的页面。  
>2、更快的内容到达时间 (time-to-content)，特别是对于缓慢的网络情况或运行缓慢的设备。  
我们的目的是让后端返回html代码，但是返回的html代码都是静态的，还需要在前端对这些代码进行“激活”，让它们能对数据的变化做出反应。这些“激活”的代码bundle.js通过由webpack对vue文件的打包来获得，跟SPA差不多。再将这个bundle进行分割，进行按需加载和预加载等操作，实现更快的内容到达时间。

这里我们在step-01项目的基础上进行修改。  
我们需要2份bundle文件，一份是用来服务端渲染成html,一份用来浏览器端激活html，打包也需要2个不同的入口文件。
浏览器端入口文件为entry-client.js,服务端入口文件为entry-server.js。  
>并将wepack.config.js拆分为3个文件分别：
> +webpack-base-oonf.js（基础配置文件）
> +webpack.client.conf.js
> +webpack-server.conf.js
新建一个index.ssr.html文件作为服务端渲染模版。 
删除index.html文件，因为直接从nodejs服务器返回html代码，不需要这文件了。  
```javascript
// main.js文件
import Vue from 'vue'
import app from './App.vue'
// import router from './router.js'
// 先去掉路由，后面再配置
// import '../assets/global.less'
// new Vue({
//     el: '#app',
//     router,
//     render: h => (h(app))
// })
export function createApp() {
    return new Vue({
        // el: '#app',   浏览器端在entry-client上挂载，服务器端不需要挂载,所以不需要el参数
        render: h => h(app)
    })
}
```
这里导出的是一个返回vue实例的工厂函数，官方介绍：避免多个请求使用一个共享的实例，导致交叉请求状态污染。以后创建路由和vuex实例都会采用工厂函数的方式。  
```javascript
//entry-client.js
import { createApp } from './src/main.js'

const vueApp = createApp()

vueApp.$mount('#app')
```
```javascript
//package.json
//其他配置
    "scripts": { 
        "build:client": "webpack --config ./config/webpack.client.conf.js",
        "build:server": "webpack --config ./config/webpack.server.conf.js"
    },
//其他配置
```
```javascript
// webpack.base.conf.js
const path = require('path')
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = {
    mode: 'development',
    entry: './src/main.js',
    module: {
        rules: [
            {
                test: /\.vue$/,
                use: 'vue-loader'
            },
            {
                test: /\.js$/,
                use: 'babel-loader'
            },
            // {
            //     test: /\.css$/,
            //     use: ['style-loader', 'css-loader'],  //注意顺序
            // },
            // {
            //     test: /\.less$/,
            //     use: ['style-loader', 'css-loader', 'less-loader']
            // }
        ]
    },
    plugins: [
        new VueLoaderPlugin()
    ]
}
```
先去掉所有的css和webpack.base.conf里的相关loader,服务端没有document对象，style-loader将<style></style>标签插入html时会导致出错,后面再配置CSS。  
```javascript
//webpack.client.conf.js

const { merge } = require('webpack-merge')
const path = require('path')
const base = require('./webpack.base.conf')

module.exports = merge(base, {
    entry: {
        client: path.resolve(__dirname, '../entry-client.js')
    }
})
```
此时运行```npm run build:client``` 浏览器端激活html的文件client.bundle.js已经打包好了。

服务端的配置
```javascript
//webpack.server.conf.js
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
```
服务端入口
```javascript
///entry-server.js

import { createApp } from './src/main.js'

// context参数以后会用到
export default context => {
    const app = createApp()
    return app
} 
```
```javascript
//index.ssr.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>ssr(server-side)</title>
</head>
<body>
   <!--vue-ssr-outlet--> 
<script src="client.bundle.js"></script>
</body>
</html>
```
<!--vue-ssr-outlet--> 是一个占位符，必须要加上，vue-server-renderer会将它替换为渲染出的html。  
<script src="client.bundle.js"></script>插入client-entry打包的文件进行测试，后期会删除。

此时运行npm run build:server 会打包出vue-ssr-server-bundle.json文件，如果你想修改名字可以在配置里加上参数，
如：new VueSSRServerPlugin({ filename = "vuessrbundle.json" })
源码
```javascript
var VueSSRServerPlugin = function VueSSRServerPlugin (options) {
  if ( options === void 0 ) options = {};

  this.options = Object.assign({
    filename: 'vue-ssr-server-bundle.json'
  }, options);
};
```
如果你的webpack版本是5.x, npm run build:server会弹出错误，webpack config `output.libraryTarget` should be "commonjs2"
查找vue-server-renderer/server-plugin源码
```javascript
  if (compiler.options.target !== 'node') {
    warn('webpack config `target` should be "node".');
  }
  console.log(compiler.options.output)
  if (compiler.options.output && compiler.options.output.libraryTarget !== 'commonjs2') {
    warn('webpack config `output.libraryTarget` should be "commonjs2".');
  }
```
加入console.log测试出options.output里面根本没有libraryTarget属性，而是library: { type: "commonjs2" },
重新安装成webpack4.x版本成功运行，```npm i webpack@4 -save```。

根目录创建server.js，或者复制例2里的文件进行修改  
```javascript
//server.js
const Vue = require('vue')
const vueRenderer = require('vue-server-renderer')
const Koa = require('koa')
const KoaRouter = require('koa-router')
const fs = require('fs')
const koaStatic = require('koa-static')

const koaApp = new Koa()
const router = new KoaRouter()

const template = fs.readFileSync('./dist/index.ssr.html', 'utf-8')
// 这里访问的是webpack + vue-server-renderer打包的对象所以要使用createBundleRenderer
const bundle = require('./dist/vue-ssr-server-bundle.json')
const renderer = vueRenderer.createBundleRenderer(bundle, {
    template: template
})
router.get('/', async ctx => {
    await renderer.renderToString().then(html => {
        ctx.body = html
    }).catch(err => {
        console.log(err)
    })
})
//koa-static 访问静态文件，将页面的src="client.bundle.js"转到/dist/client.bundle.js
koaApp.use(koaStatic(process.cwd() + '/dist/')) 
koaApp.use(router.routes())
koaApp.listen(3019, () => { console.log('server started at 3019') })
```
运行node server,在浏览器打开localhost:3019可以看到，服务端返回了html，并且在入口的div上加了```data-server-rendered="true"```。
此时有一个错误Cannot find element: #app。因为模版文件index.ssr.html并没有 id="app"的标签，应该在入口VUE文件app.vue的根目录加上。







