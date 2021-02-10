import Vue from 'vue'
import app from './App.vue'
import { createRouter } from './router.js'
// import '../assets/global.less'
export function createApp() {
    const router = createRouter()
    const vueApp = new Vue({
        router,
        render: h => h(app)
    })
    return { vueApp, router}
}