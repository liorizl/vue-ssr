import { createApp } from './src/main.js'

const { vueApp, router } = createApp()
router.beforeEach((to, from, next) => {
    console.log('调用全局beforeEach')
    next()
})
router.beforeResolve((to, from, next) => {
    console.log('调用全局beforeResolve')
    next()
})
router.afterEach((to, from, next) => {
    console.log('调用全局afterEach')
})
router.onReady(() => {
    console.log('路由完成最后再调用onReady,我是第一个回调')
}) 
router.onReady(() => {
    console.log('路由完成最后再调用onReady,我是第二个回调')
    vueApp.$mount('#app') 
}) 