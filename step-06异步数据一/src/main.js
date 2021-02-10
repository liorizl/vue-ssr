import Vue from 'vue'
import app from './App.vue'
import  { createRouter } from './router.js'
import { createStore } from './store.js'
// import '../assets/global.less'
export function createApp() {
    const router = createRouter()
    const store = createStore()
    const vueApp = new Vue({
        router,
        store,
        render: h => (h(app))
    })
    return { vueApp, router, store }
}