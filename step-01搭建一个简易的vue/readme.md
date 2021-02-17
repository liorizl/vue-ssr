# step-01搭建一个简易的vue
开始之前我们先来复习下vue,先搭建一个简单的vue项目。  
目录下运行 npm init 初始化项目。  
根目录新建一个webpack.config.js文件，并将移除package.json的main入口，在webpack.config.js里定义入口文件，并添加"private": true。  
安装webpack(webpack-cli安装的是3.X的版本)以及其他需要的包。  
```javascript
{
    "name": "step-01",
    "version": "1.0.0",
    "private": true,
    "description": "",
    "scripts": {
        "dev": "webpack-dev-server",
        "build": "webpack",
        "test": "echo \"Error: no test specified\" && exit 1"
    },
    "author": "",
    "license": "ISC",
    "devDependencies": {
        "babel-core": "^6.26.3",
        "babel-loader": "^7.1.5",
        "babel-plugin-transform-es2015-modules-commonjs": "^6.26.2",
        "css-loader": "^5.0.1",
        "less": "^4.0.0",
        "less-loader": "^7.2.1",
        "path": "^0.12.7",
        "postcss": "^8.2.2",
        "postcss-loader": "^4.1.0",
        "style-loader": "^2.0.0",
        "vue": "^2.6.12",
        "vue-loader": "^15.9.6",
        "vue-router": "^3.4.9",
        "vue-template-compiler": "^2.6.12",
        "webpack-cli": "^3.3.12",
        "webpack-dev-server": "^3.11.1"
    },
    "dependencies": {
        "html-webpack-plugin": "^4.5.0",
        "webpack": "^5.11.1"
    }
}
```
根目录下新建src目录，并在src下添加入口文件main.js、app.vue  
```javascript
// main.js
import Vue from 'vue'
import app from './App.vue'

new Vue({
    el: '#app',
    render: h => h(app)
})
```
配置webpack.config.js。  
```javascript
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = {
    mode: 'development',

    entry: './src/main.js',
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                use: 'vue-loader'
            },
            {
                test: /\.js$/,
                use: 'babel-loader'
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({  //将根目录的index打包到dist下
            template: path.resolve(__dirname, 'index.html'),  
            filename: 'index.html'
        }),
        new VueLoaderPlugin()  //解析.vue文件的插件
    ]
}
```
现在执行 npm run build 命令，就会发现dist文件夹下已经打包好了index.html和main.bundle.js文件，如果使用IIS等打开index.html你会发现页面已经正常运行了。  

现在我们使用webpack来建立开发环境  
安装 webpack-dev-server,在webpack.config.js加上  
```javascript
devServer: {
    contentBase: './dist',
    port: 3019
},
```
package.json的script属性里加上"dev": "webpack-dev-server"  这时候运行 npm run dev 服务就跑起来了。
加上路由,在src下建2个vue组件和router.js文件  
```javascript
import Vue from 'vue'
import Router from 'vue-router'
import foo from './components/Foo.vue'
import bar from './components/Bar.vue'

Vue.use(Router)

const routes = [
    { path: '/foo', component: foo, name: 'foo' },
    { path: '/bar', component: bar, name: 'bar' }
]
const router = new Router({
    routes
})

export default router
```
将路由加到入口main.js
```javascript
//其他代码
new Vue({
    el: '#app',
    router,
    render: h => h(app)
})
```
加上样式  
安装相应的包，在webpack.config.js加上loader  
```javascript
// 其他配置
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
        {
            test: /\.css$/,
            use: ['style-loader', 'css-loader'],  //注意顺序
        },
        {
            test: /\.less$/,
            use: ['style-loader', 'css-loader', 'less-loader']  //解析less
        }
    ]
},
// 其他配置
```
注意顺序，loader是从右到左解析，css-loader是将样式解析成数组(或对象)，style-loader再将数组(或对象)解析成我们常见的css并注入到页面。
