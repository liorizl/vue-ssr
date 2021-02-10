import { createApp } from './src/main.js'

export default context => {
    return new Promise((resolve, reject) => {
        const { vueApp, router } = createApp()
        router.push(context.url)
        router.onReady(() => {
            const matchedComponents = router.getMatchedComponents()
            //当前路由没匹配到组件则返回404
            if (!matchedComponents.length) {
                reject({
                    code: 404
                })
            } else {
                resolve(vueApp)
            }
        }, reject)
    })
} 