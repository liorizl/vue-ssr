# step-06异步数据一异步数据获取一
我们知道vue是响应式的，渲染页面的同时异步获取数据，再将的数据渲染到界面。在服务器中我们只需要服务器返回html就行，不需要响应式数据，并且响应式也会给服务器增加负载。  
所以渲染html的时候需要已经获取到数据，需要对数据进行预读取。
在访问vue网站的时候，切换页面都会通过路由，路由也决定了需要访问和渲染哪些组件，这时候就需要获取到这些组件中的数据，所以数据的预读取我们就在路由中进行。
另一个就是在客户端中，在打包的文件client.bundle.js挂载(vueApp.$mount('#app') )到页面之前，也需要获得跟服务端一样的的数据。

我们需要一个专门的容器来存储获取到的数据，客户端和服务端都使用这个容器。  
这里采用vuex来存取数据，当然你也可以自己设计一个。  
src目录先创建一个store.js
```javascript
import Vue from 'vue'
import Vuex from 'vue'
//fetch-data.js封装了一个获取数据的api,返回promise
import { fetchData } from './fetch-data.js'

Vue.use(Vuex)

export function createStore() {
    return new Vuex.Store({
        state: {
            item: {
            }
        },
        mutations: {
            setItem(state, {id, title}) {
                Vue.set(state.item, 'id', id)
                Vue.set(state.item, 'title', title)
            }
        },
        actions: {
            fetchItem(context, url) {
                return fetchData(url).then(res => {
                    context.commit('setItem', res.item)
                })
            }
        }
    })
}
```
也是工厂函数的方式创建。简单说一下vuex，state是用来存放数据的，mutations是用来修改数据的，通过store.commit('setItem')来触发，但是不支持异步操作。
actions是用来提交mutations的，通过store.dispatch('fetchItem')来触发，获取到数据后再提交mutations中的方法修改数据,主要用于异步修改数据。
```javascript
//fetch-data.js

import axios from 'axios'

export function createStore(url) {
    return new Promise((resolve, reject) => {
        axios.get(url).then(res => {
            if (res.status === 200) {
                resolve(res)
            }
        }).catch(err => {
            reject(err)
        })
    })
}
```
在根目录创建backend.js文件用来启动一个后台服务，数据都从这里获取。
```javascript
const Koa = require('koa')
const KoaRouter = require('koa-router')
const cors = require('koa2-cors')

const app = new Koa()
const router = new KoaRouter()
// 解决跨域问题
app.use(cors({
    exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
    maxAge: 5,
    credentials: true,
    allowMethods: ['GET', 'POST'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

let count = 0
// 具体的数据就不从其他地方获取了，直接返回数据
const fooDate = async ctx => {
    const id = ctx.query.id || ''
    // 获取一次后自增1，让每次获取到的数据都不一样
    count++
    ctx.body = {
        title: '我是foo'+ id +'的标题' + count,
        content: '我是foo'+ id +'的内容'+ count
    }
}
const barDate = async ctx => {
    ctx.body = {
        title: '你是不是bar的标题',
        content: '你是不是bar的内容'
    }
}

app.use(async (ctx, next) => {
    //稍作区分以/fetch开头为数据请求
    if (!/^\/fetch/.test(ctx.path)) {
        ctx.body = {
            errCode: 404
        }
    } else {
        await next()
    }
})

router.get('/fetch/foo', fooDate)
router.get('/fetch/bar', barDate)
app.use(router.routes())

app.listen(3017, () => {
    console.log('server started at port:3017')
})
```
在main.js中加上store
```javascript
import Vue from 'vue'
import app from './App.vue'
import  { createRouter } from './router.js'
import  { createStore } from './store.js'

export function createApp() {
    const router = createRouter()
    const store = createStore()
    const vueApp = new Vue({
        router,
        store,
        render: h => h(app)
    })
    return { vueApp, router, store }
}
```
修改entry-server.js
```javascript
import { createApp } from './src/main.js'

export default context => {
    return new Promise((resolve, reject) => {
        const { vueApp, router, store } = createApp()
        router.push(context.url)
        router.onReady(() => {
            const matchedComponents = router.getMatchedComponents()
            if (!matchedComponents.length) {
                reject({
                    code: 404
                })
            } else {
                Promise.all(matchedComponents.map(component => {
                    // 如果组件里有asyncData方法，就返回该方法，需要是Promise
                    // store.dispatch()返回的就是Promise
                    if (component.asyncData) {
                        return component.asyncData({ store })
                    }
                })).then(() => {
                    // store.dispatch()执行后，数据已经存到store里面
                    context.state = store.state
                    resolve(vueApp)
                }).catch(reject)
            }
        }, reject)
    })
}
```
我们看到组件中的asyncData函数在路由onReady中调用的，此时还没有组件还没有实例化，所以是访问不到this的，什么this.$store、this.$router都访问不到，
需要在参数中传入store等。  
说下这句：context.state = store.state  
在将数据存到store后，将数据附加到上下文(context)中，这样在renderer选项中有template时候会将数据存到window.__INITIAL_STATE__中，并注入到html
```javascript
    const renderer = vueRenderer.createBundleRenderer(bundle, {
        template: template  //将数据附加到上下文(context)中后有template选项会在window.__INITIAL_STATE__中加入数据
    })
```
此时服务端返回的html代码中有```<script>window.__INITIAL_STATE__={"item":{"title":"我是foo的标题","content":"我是foo的内容"}}</script>```
客户端可以通过store.replaceState方法修改state的值。  
修改Foo和Bar组件
```javascript
<template>
    <div>
        <p>这是Bar页面</p>
        <p>标题:{{item.title}}</p>
        <p>内容:{{item.content}}</p>
    </div>
</template>

<script>
export default {
    asyncData({ store }) {
        return store.dispatch('fetchItem', 'http://localhost:3017/fetch/bar')
    },
    data() {
        return {
        }
    },
    computed: {
        //data中没有item,所以在computed里加上，并从store.state中获取数据
        item() {
            return this.$store.state.item
        }
    }
}
</script>
<style  scoped>
</style>
```
客户端数据预取有2种方式:
第一种是触发路由时候就进行数据预取，等到数据全部获取到再进行渲染，好处是一次就将页面渲染出来，坏处是获取到数据之前一直没有内容呈现，数据获取慢的话一般要加上数据加载指示器   
```javascript
//client.entry.js

import { createApp } from './src/main.js'

const { vueApp, router, store } = createApp()
// 服务端会在html里加入window.__INITIAL_STATE__
if (window.__INITIAL_STATE__) {
    store.replaceState(window.__INITIAL_STATE__)
}
router.onReady(() => {
    //这里要使用到达路由组件的数据，异步组件是在beforeEach之后beforeResolve之前获取的。所以在 `router.beforeResolve()`时获取异步数据，
    //以便确保所有异步组件都能获取到。
    router.beforeResolve(async (to, from, next) => {
        // 检查to和from的组件是否有相同的，不同的组件才获取数据
        const matched = router.getMatchedComponents(to)
        const prevMatched = router.getMatchedComponents(from)
        let diffed = false
        const activated = matched.filter((c, i) => {
            return diffed || (diffed = (prevMatched[i] !== c))
        })
        if (!activated.length) {
            next()
        } else {
            // 有加载指示器就在放在这，比如那张经典的加载中..菊花图
            Promise.all(activated.map(c => {
                if (c.asyncData) {
                    return c.asyncData({ store })
                }
            })).then(() => {
                //数据已经加载完了，加载指示器在这里取消
                next()
            }).catch(next)
            
        }
    })
    vueApp.$mount('#app') 
}) 
```
注意：第一次打开页面的时候会先运行router.onReady，此时才会添加全局路由守卫router.beforeResolve，由于router.beforeResolve的执行顺序在router.onReady之前，所以第一次打开页面的时候并没有运行组件中的asyncData函数，entry-client.js中还需要加入代码
```javascript
if (window.__INITIAL_STATE__) {
    store.replaceState(window.__INITIAL_STATE__)
}
```
那么可不可以router.beforeResolve写在router.onReady()外面呢？
```javascript
router.beforeResolve(async (to, from, next) => {
    //其他代码asyncData()等
})
router.onReady(() => {
    vueApp.$mount('#app') 
})
```
这样写的话服务器会获取一次数据，浏览器端再获取一次，2次获取可能会导致获取到的数据不一致，如果2次获取到的数据不一样，开发模式下client.bundle.js接管页面后会用客户端获取到的数据替换掉服务端获取到的数据。

第二种方法是获取到视图后再获取数据,这种方式跟我们平时使用vue的方式有点像，点击链接触发路由后直接渲染新的组件，异步数据获取到后再渲染上去。
这种方式可以采用vue的全局混入(mixin)来实现
```javascript
Vue.mixin({
    beforeMount() {
        const { asyncData } = this.$options
        if (asyncData) {
            asyncData({
                store: this.$store
            })
        }
    }
})
```
