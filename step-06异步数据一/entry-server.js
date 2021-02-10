import { createApp } from './src/main.js'

export default context => {
    return new Promise((resolve, reject) => {
        const { vueApp, router, store } = createApp()
        router.push(context.url)
        router.onReady(() => {
            const matchedComponents = router.getMatchedComponents()
            if (!matchedComponents.length) {
                reject({
                    code: 404
                })
            } else {
                Promise.all(matchedComponents.map(component => {
                    // 如果组件里有asyncData方法，就返回该方法，需要是Promise
                    // store.dispatch()就是返回的Promise
                    if (component.asyncData) {
                        return component.asyncData({ store })
                    }
                })).then(() => {
                    // store.dispatch()执行后，数据已经存到store里面
                    context.state = store.state
                    resolve(vueApp)
                }).catch(reject)
            }
        }, reject)
    })
} 