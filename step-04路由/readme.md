# step-04路由
修改router.js
```javascript
import Vue from 'vue'
import Router from 'vue-router'
// import foo from './components/Foo.vue'
// import bar from './components/Bar.vue'
const foo = () => import('./components/Foo.vue')
const bar = () => import('./components/Bar.vue')

Vue.use(Router)

const routes = [
    { path: '/', redirect: { name: 'foo'} },
    { path: '/foo', component: foo, name: 'foo' },
    { path: '/bar', component: bar, name: 'bar' }
]
function createRouter() {
    return new Router({
        //浏览器端vue-router默认是hash模式,通过hash的改变来触发路由,url如www.a.com/#/b/c
        // history模式使url看起来更正常www.a.com/b/c，但是在传统的单页面客户端下刷新或者直接打开url会导致页面打不开，
        // 因为直接打开该页面客户端会向服务端请求/b/c这个path下的内容,服务器没进行配置话会出现404
        mode: 'history',
        routes
    })
}

export { createRouter }
```
通过工厂函数的方式返回路由，为了减少打包文件的体积，采用异步加载组件，进行按需加载。

webpack打包异步组件需要在babel-plugin-dynamic-import-node插件，安装后在.babelrc里加上"plugins": ["dynamic-import-node"]
```javascript
//main.js

import Vue from 'vue'
import app from './App.vue'
import  { createRouter } from './router.js'

export function createApp() {
    const router = createRouter()
    const vueApp = new Vue({
        router,
        render: h => h(app)
    })
    return { vueApp, router }
}
```
```javascript
//entry-client.js
import { createApp } from './src/main.js'

const { vueApp, router } = createApp()
router.onReady(() => {
    vueApp.$mount('#app') 
})
```
由于路由采用的是异步组件，在router.onReady阶段在挂载，服务端入口也是在onReady中返回，保证前后端数据一致。
```javascript
//entry-server.js

import { createApp } from './src/main.js'

export default context => {
    return new Promise((resolve, reject) => {
        const { vueApp, router } = createApp()
        router.push(context.url)
        router.onReady(()=> {
            const matchedComponents = router.getMatchedComponents()
            //当前路由没匹配到组件则返回404
            if (!matchedComponents.length) {
                reject({
                    code: 404
                })
            } else {
                resolve(vueApp)
            }
        }, reject)
    })
} 
// 导出一个函数，并在每次渲染中重复调用此函数，此函数参数context是renderToString传入的context并添加了一些其他属性
```
```javascript
//server.js

const vueRenderer = require('vue-server-renderer')
const Koa = require('koa')
const fs = require('fs')
const koaStatic = require('koa-static')

const koaApp = new Koa()

// 不再使用koa-router让所有请求都运行此中间件
koaApp.use(async (ctx, next) => {
    const template = fs.readFileSync('./dist/index.ssr.html', 'utf-8')
    const bundle = require('./dist/vue-ssr-server-bundle.json')
    const renderer = vueRenderer.createBundleRenderer(bundle, {
        template: template
    })
    const context = {
        // entery-server.js里参数context有url属性
        url: ctx.path
    }
    // context将会作为entry-server.js导出函数的参数，并且在renderToString的回调函数中还会在context中注入一些其他信息，比如解析过程收集到的css
    await renderer.renderToString(context).then(html => {
        ctx.body = html
    }).catch(async (err) => {
        // entry-server中没匹配到路由会reject{code:404},如果是404的话执行下一个中间件（也就是koaStatic），
        // 因为此地址可能是一个静态地址如：/client.bundle.js需要koaStatic进行处理
        if (err.code === 404) {
            await next()
        } else {
            ctx.body = '服务器错误'
        }
    })
})

koaApp.use(koaStatic(process.cwd() + '/dist/')) 
koaApp.listen(3019, () => { console.log('server started at 3019') })
```
分别打包执行后node server会发现路由已经正常工作。

