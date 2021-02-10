import Vue from 'vue'
import app from './App.vue'
import  { createRouter } from './router.js'
import { createStore } from './store.js'
import { sync } from 'vuex-router-sync'
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