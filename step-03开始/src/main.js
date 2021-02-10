import Vue from 'vue'
import app from './App.vue'
// import router from './router.js'
// 先去掉路由，后面再配置
// import '../assets/global.less'
// new Vue({
//     el: '#app',
//     router,
//     render: h => h(app)
// })
export function createApp() {
    return new Vue({
        // el: '#app',   浏览器端在entry-client上挂载，服务器端不需要挂载,所以不需要el参数
        render: h => h(app)
    })
}