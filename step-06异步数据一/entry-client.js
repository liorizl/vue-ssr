import { createApp } from './src/main.js'
import Vue from 'vue'
const { vueApp, router, store } = createApp()
// 服务端会在html里加入window.__INITIAL_STATE__
// if (window.__INITIAL_STATE__) {
//     store.replaceState(window.__INITIAL_STATE__)
// }
// 获取到视图后再获取数据
Vue.mixin({
    // 在vue的生命周期beforeMount中混入
    beforeCreate() {
        const { asyncData } = this.$options
        if (asyncData) {
            asyncData({
                store: this.$store
            })
        }
    }
})
//此时vue组件还没有实例化，第一次打开页面服务端会获取一次数据，这里也会获取一次，可能会使2次数据不一样
router.onReady(() => {
    vueApp.$mount('#app')
})
// 先获取数据再渲染视图
// router.onReady(() => {
//    //这里要使用到达路由组件的数据，异步组件是在beforeEach之后beforeResolve之前获取的。所以在 `router.beforeResolve()`时获取异步数据，
//    //以便确保所有异步组件都能获取到。
//     router.beforeResolve(async (to, from, next) => {
//         // 检查to和from的组件是否有相同的，不同的组件才获取数据
//         const matched = router.getMatchedComponents(to)
//         const prevMatched = router.getMatchedComponents(from)
//         let diffed = false
//         const activated = matched.filter((c, i) => {
//             return diffed || (diffed = (prevMatched[i] !== c))
//         })
//         if (!activated.length) {
//             next()
//         } else {
//             // 有加载指示器就在放在这，比如那张经典的加载中..菊花图
//             Promise.all(activated.map(c => {
//                 if (c.asyncData) {
//                     return c.asyncData({ store })
//                 }
//             })).then(() => {
//                 //数据已经加载完了，加载指示器在这里取消
//                 next()
//             }).catch(next)
            
//         }
//     })
//     vueApp.$mount('#app') 
// }) 