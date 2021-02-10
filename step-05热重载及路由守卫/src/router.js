import Vue from 'vue'
import Router from 'vue-router'
// import foo from './components/Foo.vue'
// import bar from './components/Bar.vue'
const foo = () => import('./components/Foo.vue')
const bar = () => import('./components/Bar.vue')

Vue.use(Router)

const routes = [
    { path: '/foo', component: foo, name: 'foo', beforeEnter:(to, from, next) => { console.log('路由即将读取组件foo的数据'); next() } },
    { path: '/bar', component: bar, name: 'bar', beforeEnter:(to, from, next) =>{ console.log('路由即将读取组件bar的数据'), next() } }
]
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

