import Vue from 'vue'
import Router from 'vue-router'
// import foo from './components/Foo.vue'
// import bar from './components/Bar.vue'
const index = () => import('./components/Index.vue').catch(err => err)
const foo = () => import('./components/Foo.vue').catch(err => err)
const bar = () => import('./components/Bar.vue').catch(err => err)

Vue.use(Router)
const routes = [
    { path: '/', component: index, name: 'index' },
    { path: '/foo/:id?', component: foo, name: 'foo' },
    { path: '/bar/:id?', component: bar, name: 'bar' }
]

const routerPush = Router.prototype.push
Router.prototype.push = function (location, onComplete, onAbort) {
    // 如果此时有第2或第3个参数就不会返回promise
    if (!onComplete && !onAbort) {
        return routerPush.call(this, location).catch(err => err)
    } else {
        return routerPush.call(this, location, onComplete, onAbort)
    }
}

function createRouter() {
    return new Router({
        //vue-router默认是hash模式,通过hash的改变来触发路由,url如www.a.com/#/b/c
        // history模式使url看起来更正常www.a.com/b/c，但是在传统的单页面客户端下刷新或者直接打开url会导致
        // 页面打不开，因为直接打开该页面客户端会向服务端请求/b/c这个path下的内容,一般情况下服务端也不可能有专门的配置，所以会出现404
        mode: 'history',
        routes
    })
}

export { createRouter }

