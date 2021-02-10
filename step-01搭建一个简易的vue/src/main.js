import Vue from 'vue'
import app from './App.vue'
import router from './router.js'
import '../assets/global.less'
new Vue({
    el: '#app',
    router,
    render: h => h(app)
})