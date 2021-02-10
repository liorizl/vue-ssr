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
