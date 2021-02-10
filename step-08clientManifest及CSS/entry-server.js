import { createApp } from './src/main.js'
import axios from 'axios'

export default context => {
    return new Promise((resolve, reject) => {
        const { vueApp, router, store } = createApp()
        router.push(context.url)
        router.onReady(async () => {
            const matchedComponents = router.getMatchedComponents()
            if (!matchedComponents.length) {
                reject({
                    code: 404
                })
            } else {
                for(let i = 0; i < matchedComponents.length; i++) {
                    const component = matchedComponents[i]
                    if (component.asyncData) {
                        await component.asyncData({ store, route: router.currentRoute, axios })
                        .then(compData => {
                            if (!component.name) {
                                console.error('组件必须要有名称')
                                return
                            }
                            const compName = component.name
                            
                            if (!store.hasModule(compName)) {
                                let mutationObj = {}
                                Object.keys(compData).forEach(prop => {
                                    mutationObj[prop] = (state, payload) => {
                                        state[prop] = payload[prop]
                                    }
                                })
                                store.registerModule(compName, {
                                    namespaced: true,
                                    state: () => {
                                        return compData
                                    },
                                    mutations: mutationObj
                                })
                            } else {
                                Object.keys(compData).forEach(prop => {
                                    store.commit(compName + '/' + prop, compData)
                                })
                            }
                            
                        })
                        .catch(reject) 
                    }
                    resolve(vueApp)
                }
            }
        }, reject)
    })
} 