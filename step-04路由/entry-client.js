import { createApp } from './src/main.js'

const { vueApp, router } = createApp()
//假设你的id为app
router.onReady(() => {
    vueApp.$mount('#app') 
})