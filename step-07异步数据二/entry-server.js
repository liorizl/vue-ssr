import { createApp } from './src/main.js'
import axios from 'axios'

export default context => {
    return new Promise((resolve, reject) => {
        const { vueApp, router, store, utils } = createApp()
        router.push(context.url)
        router.onReady(async () => {
            const matchedComponents = router.getMatchedComponents()
            if (!matchedComponents.length) {
                reject({
                    code: 404
                })
            } else {
                Promise.all(matchedComponents.map(component => {
                    if (component.asyncData) {
                        return component.asyncData({ store, route: router.currentRoute, axios })
                    }
                }))
                .then(asyncDatas => {
                    asyncDatas.forEach((compData, i) => {
                        if (compData) {
                            const component = matchedComponents[i]
                            const compName = component.name
                            if (!component.name) {
                                console.error('组件必须要有名称')
                                return
                            }
                            // 判断store是否存在该模块没有就注册一个
                            utils.registerStore(store, compName, compData)
                        }
                    })
                    context.state = store.state
                    resolve(vueApp)
                })
                .catch(reject) 
            }
        }, reject)
    })
} 