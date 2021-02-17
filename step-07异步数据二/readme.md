# step-07异步数据二
前面说了两种客户端数据预取的方式。  
有一种情况当组件复用(/foo/1到/foo/2)，由于是同一个路由组件的生命周期不会运行，数据不会更新需要单独处理。  
vue-router导航守卫里有个beforeRouteUpdate，会在复用的组件里调用该守卫。  
同样使用全局混入解决  
```javascript
Vue.mixin({
    beforeRouteUpdate(to, from, next) {
        const { asyncData } = this.$options
        if (asyncData) {
            asyncData({
                store: this.$store,
                route: to
            })
            .then(next)
            .catch(next)
        } else {
            next()
        }
    },
})
```
前面获取异步的方式是在store里面初始化数据，在组件的asyncData中异步修改数据，当数据多了以后手动在store里添加数据会很麻烦，我们稍作修改。  
思路是调用asyncData时将获取到的数据通过store.registerModule注册到store中，每个组件以组件名注册一个模块，并在生命周期destoryed中删除此模块。
```javascript
//main.js
import Vue from 'vue'
import app from './App.vue'
import  { createRouter } from './router.js'
import { createStore } from './store.js'
import { sync } from 'vuex-router-sync'
// 加了一个工具文件，里面封装了一个注册storeModule的方法
import utils from '../utils.js'

// import '../assets/global.less'
export function createApp() {
    const router = createRouter()
    const store = createStore()
    // 新添加的
    sync(store, router)
    const vueApp = new Vue({
        router,
        store,
        render: h => (h(app))
    })
    return { vueApp, router, store, utils }
}
```
sync(store, router)在store中注册了一个叫route的模块，模块的内容是路由状态(router)的一些信息，并添加了watch,观察route数据是否有变化，并更新route数据。如果你觉得用不着可以不用加。
此时可以看到服务端传过来的html中的window.__INITIAL_STATE已经添加route的数据
```javascript
//utils.js
export default {
    registerStore(store, compName, compData) {
        if (!store.hasModule(compName)) {
            let mutationObj = {}
            Object.keys(compData).forEach(prop => {
                mutationObj[prop] = (state, payload) => {
                    state[prop] = payload[prop]
                }
            })
            store.registerModule(compName, {
                namespaced: true,
                state: () => {
                    return compData
                },
                mutations: mutationObj
            })
        } else {
            Object.keys(compData).forEach(prop => {
                store.commit(compName + '/' + prop, compData)
            })
        }
    }
}
```
再修改router.js
```javascript
const routes = [
    //这里加了一个新组建index.vue,自己去创建一个index.vue吧
    { path: '/', component: index, name: 'index' },
    { path: '/foo/:id?', component: foo, name: 'foo' },
    { path: '/bar/:id?', component: bar, name: 'bar' }
]
```
path: '/bar/:id?'表示id可以存在也可以不存在 vue-router的路径解析采用的是 path-to-regexp，有很多种高级匹配模式。
如果你的代码跟我一样，运行npm run dev后在浏览器地址中输入```http://localhost:3019/foo/1```会出现一个比较有意思的错误。  
```client.bundle.js:1 Uncaught SyntaxError: Unexpected token '<'```  
点开这个错误一看，client.bundle.js居然是返回的一段html,这是因为我在index.ssr.html中引入的client.bundle.js采用的相对路径  
```<script src="client.bundle.js"></script>```  
当前浏览器的url是```http://localhost:3019/foo/1```，加载client.bundle.js的时候浏览器就会去访问```http://localhost:3019/foo/client.bundle.js```，刚好路由就将client.bundle.js当成了:id匹配到foo这个组件，就返回了```http://localhost:3019/foo```页面的html，  
解决的方法是在webpack.base.conf.js的output里加上publicPath: '/dist/'。
```javascript
//entry-server

import { createApp } from './src/main.js'
import axios from 'axios'

export default context => {
    return new Promise((resolve, reject) => {
        const { vueApp, router, store, utils } = createApp()
        router.push(context.url)
        router.onReady(async () => {
            const matchedComponents = router.getMatchedComponents()
            if (!matchedComponents.length) {
                reject({
                    code: 404
                })
            } else {
                Promise.all(matchedComponents.map(component => {
                    if (component.asyncData) {
                        return component.asyncData({ store, route: router.currentRoute, axios })
                    }
                }))
                .then(asyncDatas => {
                    asyncDatas.forEach((compData, i) => {
                        if (compData) {
                            const component = matchedComponents[i]
                            const compName = component.name
                            if (!component.name) {
                                console.error('组件必须要有名称')
                                return
                            }
                            // 判断store是否存在该模块没有就注册一个，存在的话就提交内部的数据，
                            utils.registerStore(store, compName, compData)
                        }
                    })
                    context.state = store.state
                    resolve(vueApp)
                })
                .catch(reject) 
            }
        }, reject)
    })
}
```
```javascript
//entry-client
import { createApp } from './src/main.js'
import Vue from 'vue'
import axios from 'axios'
const { vueApp, router, store, utils } = createApp()
if (window.__INITIAL_STATE__) {
    // 这里也将数据通过store.registerModule注册到store中，不再将数据放在store.state中
    const compName = window.__INITIAL_STATE__.route.name
    const compData = window.__INITIAL_STATE__[compName]
    utils.registerStore(store, compName, compData)
}
Vue.mixin({
    beforeRouteUpdate(to, from, next) {
        const { asyncData, name } = this.$options
        if (asyncData) {
            asyncData({ store, route: to, axios }).then((compData) => {
                Object.keys(compData).forEach(prop => {
                    store.commit(name + '/' + prop, compData)
                })
                next()
            }).catch(err => {
                console.log(err)
                next()
            })
        } else {
            next()
        }
    },
    destroyed() {
        // Vue.mixin是全局注入，所有的vue实例都会注入，但不是所以的实例里面都有store，要进行判断
        if (this.$store) {
            let compName = this.$options.name
            if (this.$store.state[compName] && this.$store.hasModule(compName)) {
                this.$store.unregisterModule(compName)
            }
        }

    }
})

router.onReady(() => {
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
            for (let i = 0; i < activated.length; i++) {
                const actComp = activated[i]
                if (actComp.asyncData) {
                    await actComp.asyncData({ store, route: to, axios })
                    .then(compData => {
                        if (!actComp.name) {
                            console.error('组件必须要有名称')
                            return
                        }
                        const compName = actComp.name
                        // 判断store是否存在该模块没有就注册一个，存在的话就提交内部的数据，
                        // 比如:/foo/1 -> /foo/2不会重新在store中注册foo模块,但是内部数据变化了
                        utils.registerStore(store, compName, compData)
                        next()
                    })
                    .catch(err => {
                        console.error('读取组'+ actComp.name +'件异步数据失败')
                        next()
                    })
                }
            }
        }
    })
    vueApp.$mount('#app') 
}) 
```


分别修改下Bar.vue和Foo.vue组件  
Bar.vue(Foo.vue也基本这样)
```
<template>
    <div>
        <p>这是Bar页面</p>
        <p>
            <span @click="go(1)">页面11</span>
            <span @click="go(2)">页面2</span>
            <span @click="go(3)">页面3</span>
            <router-link :to="{name: 'bar', params: {id:1}}">页面1</router-link>
            <router-link :to="{name: 'bar', params: {id:2}}">页面2</router-link>
            <router-link :to="{name: 'bar', params: {id:3}}">页面3</router-link>
        </p>
        <p>标题:{{itemBar.title}}</p>
        <p>内容:{{itemBar.content}}</p>
        <bar-child></bar-child>
    </div>
</template>
<script>
```
```javascript
import barChild from './BarChild.vue'
export default {
    name: 'bar',
    asyncData({ store, route, axios }) {
        const { id } = route.params
        const url = id ? 
            'http://localhost:3017/fetch/bar?id=' + id : 
            'http://localhost:3017/fetch/bar'
        return axios.get(url).then(res => {
            return {
                itemBar: res.data
            }
        })
    },
    components: {
       barChild 
    },
    data() {
        return {
        }
    },
    created() {
    },
    methods: {
        go(id) {
            this.$router.push({ name: 'bar', params: { id: id } })
        }
    },
    computed: {
        itemBar() {
            return this.$store.state.bar.itemBar
        }
    }
}
```
```
</script>
<style  scoped>
</style>
```
这种做法稍微方便一些不用去store里初始化数据，但是必须给组件添加名称，数据也必须在computed里定义。  
nuxt的做法是将asyncData返回的数据添加到data中，这样就不用在computed里定义了，我还没实现这功能，有空再研究下。

这里会出现一个问题：在组件复用的情况下点击当前页面的链接（params和query没变），用编程式的方式导航如：router.push,router.replace的方式会提示错误,
```Uncaught (in promise) NavigationDuplicated: Avoided redundant navigation to current location:```
但是用router-link的方式不会。
处理这个问题我想到两种思路：  
第一种是直接改变VueRouter原型的push方法，将错误捕捉到，就不会抛出错误。  
路由有不止有push,还有repalce等方法,如果你使用replace也需要修改
vue-router源代码
```javascript
  VueRouter.prototype.push = function push (location, onComplete, onAbort) {
      var this$1 = this;
    // $flow-disable-line
    if (!onComplete && !onAbort && typeof Promise !== 'undefined') {
      return new Promise(function (resolve, reject) {
        this$1.history.push(location, resolve, reject);
      })
    } else {
      this.history.push(location, onComplete, onAbort);
    }
  };
```
从源代码可以看到push方法有3个参数，onComplete,onAbort是回调函数，分别在导航完成和终止时调用，可以省略,当2,3个参数省略的时候会返回一个promise,
那么我们只要在加上catch就可以捕捉到错误了。
在定义路由的地方router.js中加上
```javascript
const routerPush = Router.prototype.push
Router.prototype.push = function (location, onComplete, onAbort) {
    // 如果此时有第2或第3个参数就不会返回promise
    if (!onComplete && !onAbort) {
        return routerPush.call(this, location).catch(err => err)
    } else {
        return routerPush.call(this, location, onComplete, onAbort)
    }
}
```
第二种是自己封装一个push或者replace方法，通过自己的封装的方法来跳转，你可以自己捕捉错误或者进行路由对比相同的路由就不跳转。
这里我就不写了，相同路由的判断可以参照vue-router/dist/vue-router.js的源码 isSameRoute()

至此，vue-ssr服务端返回html部分基本完成了，回忆一下的流程：
输入npm run dev 将浏览器端和服务端的内容打包到内存，并监听3019端口  
在浏览器输入网址localhost:3019/foo  
浏览器向服务端请求，会按顺序运行server.js中定义的中间件  
vue-server-renderer读取并解析entry-server打包的文件  
在路由解析完后开始运行router.onReady的回调函数  
router.onReady中能访问到达组件的信息，如果组件中有asyncData函数，运行此函数，会将获取到的数据存入store，并将数据赋值到context.state中  
vue-server-renderer会将context.state的数据附加到将要返回的html中```<script>window.__INITIAL_STATE__={item: XXX}</script>```  
客户端接收到服务端返回的html  
因为浏览器渲染内容是从上到下的，会先渲染html页面，最后再加载并运行client.bundle.js  
entry.client.js中将vue程序挂载到了```<div id="app">...</div>```上，此时浏览器端已经被vue程序接管,entry.client.js将window.__INITIAL_STATE__数据存到store中,这就保证了前后端的数据一致。  
点击路由，因为此时浏览器已经被vue接管，会走一遍vue-router的路由守卫，如果浏览器端预取数据用的先获取到数据再渲染的方式，调用router.onReady中定义的router.beforeResolve守卫，运行将要到达组件中的asyncData,从而获取到新的数据并存入store。  
路由完成后渲染组件时发现数据已经改变将新的数据替换掉旧的数据。
router.onReady()只在第一次路由完成后执行，以后点击路由不会再运行，所以服务端第一次获取到数据后就不会再去获取数据，除非重新请求(如在地址栏输入地址或者刷新页面)。

有人可能会想到服务端第一次获取数据的时候已经把数据提交到store.state,浏览器端直接取就是为什么还要通过window.__INITIAL_STATE__来获取数据？  
这是因为entry-client和entry-server分别执行了createApp(),store也是通过工厂函数返回的实例，所以客户端和服务端分别创建了一个Store实例，各用各的。

