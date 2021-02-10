import Vue from 'vue'
import Router from 'vue-router'
// import foo from './components/Foo.vue'
// import bar from './components/Bar.vue'
const foo = () => import('./components/Foo.vue')
const bar = () => import('./components/Bar.vue')
Vue.use(Router)

const routes = [
    { path: '/', redirect: { name: 'bar' } },
    { path: '/foo', component: foo, name: 'foo' },
    { path: '/bar', component: bar, name: 'bar' }
]

function createRouter() {
    return new Router({
        mode: 'history',
        routes
    })
}

export { createRouter }
